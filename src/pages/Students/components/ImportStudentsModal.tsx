import React, { useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Modal, Button, Icon, Badge, useToast } from '../../../components'
import { createStudent, createStudentWithParent, linkStudentToAcademicYear } from '../../../services'
import type { DbStudent, StudentParent } from '../../../types/database'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  existingStudents: DbStudent[]
  branchId?: string
  yearId?: string
}

type RowStatus = 'ok' | 'duplicate-db' | 'duplicate-file' | 'error'

interface ParsedRow {
  rowIdx: number
  // Student
  full_name: string
  gender: 'M' | 'F' | null
  dob: string | null
  level: string | null
  phone: string | null
  email: string | null
  status: DbStudent['status']
  enroll_date: string | null
  notes: string | null
  // Parent
  parent_name: string | null
  parent_phone: string | null
  parent_email: string | null
  parent_relation: StudentParent['relation']
  parent_address: string | null
  // Meta
  errors: string[]
  rowStatus: RowStatus
  duplicateOf: { id?: string; name: string } | null
  selected: boolean
  forceImport: boolean
}

/* ─── Helpers ─── */
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim()

/** Stricter VN phone normalization. Returns null if cannot be normalized into a recognizable form. */
const normalizePhone = (s: string | null | undefined): string | null => {
  if (s == null || s === '') return null
  let digits = String(s).replace(/\D/g, '')
  if (!digits) return null
  // +84xxxxxxxxx or 84xxxxxxxxx → 0xxxxxxxxx
  if (digits.startsWith('84') && (digits.length === 11 || digits.length === 12)) {
    digits = '0' + digits.slice(2)
  }
  // 9 digits without leading 0
  if (digits.length === 9 && !digits.startsWith('0')) digits = '0' + digits
  return digits
}

/** True if phone is a valid VN mobile or landline (10 digits starting with 0, prefix 02–09). */
const isValidVnPhone = (phone: string): boolean => /^0[2-9]\d{8}$/.test(phone)

/** Stricter email regex — requires real TLD (2+ chars) and proper local/domain parts. */
const EMAIL_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

const parseDate = (v: any): string | null => {
  if (v == null || v === '') return null
  if (typeof v === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30))
    const d = new Date(epoch.getTime() + v * 86400000)
    return d.toISOString().slice(0, 10)
  }
  const s = String(v).trim()
  let m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(s)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  m = /^(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})$/.exec(s)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

const parseGender = (v: any): 'M' | 'F' | null => {
  if (!v) return null
  const s = normalize(String(v))
  if (['nam', 'm', 'male', 'boy'].includes(s)) return 'M'
  if (['nu', 'f', 'female', 'girl'].includes(s)) return 'F'
  return null
}

const parseStatus = (v: any): DbStudent['status'] => {
  if (!v) return 'active'
  const s = normalize(String(v))
  if (s.includes('thu')) return 'trial'
  if (s.includes('tam') || s.includes('paus')) return 'paused'
  if (s.includes('nghi') || s === 'inactive') return 'inactive'
  return 'active'
}

const parseRelation = (v: any): StudentParent['relation'] => {
  if (!v) return 'mother'
  const s = normalize(String(v))
  if (s.includes('ong noi') || s.includes('ong ngoai') || s.includes('grandfather')) return 'grandfather'
  if (s.includes('ba noi') || s.includes('ba ngoai')   || s.includes('grandmother')) return 'grandmother'
  if (s.includes('guard') || s.includes('giam ho') || s.includes('khac') || s === 'other') return 'guardian'
  if (s.includes('me') || s === 'ma' || s.includes('mom') || s.includes('mother')) return 'mother'
  if (s.includes('bo') || s.includes('cha') || s === 'ba' || s.includes('father') || s.includes('dad')) return 'father'
  return 'mother'
}

const RELATION_LABEL: Record<StudentParent['relation'], string> = {
  father: 'Bố', mother: 'Mẹ', grandfather: 'Ông', grandmother: 'Bà', guardian: 'Người giám hộ', other: 'Khác',
}

/** Smart column finder: must include any of `candidates`, must exclude all of `excludes` */
const findKey = (obj: any, candidates: string[], excludes: string[] = []): string | null => {
  const keys = Object.keys(obj)
  for (const c of candidates) {
    const k = keys.find(k => {
      const n = normalize(k)
      if (!n.includes(normalize(c))) return false
      if (excludes.some(ex => n.includes(normalize(ex)))) return false
      return true
    })
    if (k) return k
  }
  return null
}

/* ─── Modal ─── */
export const ImportStudentsModal: React.FC<Props> = ({ open, onClose, onSuccess, existingStudents, branchId, yearId }) => {
  const toast = useToast()
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [filename, setFilename] = useState('')
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ ok: number; failed: number }>({ ok: 0, failed: 0 })
  const [dragOver, setDragOver] = useState(false)
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'errors' | 'duplicates'>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  /* DB duplicate maps */
  const dbMaps = useMemo(() => {
    const byPhone = new Map<string, DbStudent>()
    const byNameDob = new Map<string, DbStudent>()
    for (const s of existingStudents) {
      const ph = normalizePhone(s.phone)
      if (ph) byPhone.set(ph, s)
      const nm = normalize(s.full_name)
      const yr = s.dob ? new Date(s.dob).getFullYear() : ''
      if (nm) byNameDob.set(`${nm}|${yr}`, s)
    }
    return { byPhone, byNameDob }
  }, [existingStudents])

  const reset = () => {
    setStep('upload'); setRows([]); setError(null); setFilename('')
    setResult({ ok: 0, failed: 0 }); setProgress({ done: 0, total: 0 })
  }
  const handleClose = () => { reset(); onClose() }

  const handleFile = async (file: File) => {
    setError(null)
    setFilename(file.name)
    try {
      const data = await file.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array', cellDates: false })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<any>(ws, { defval: null, raw: true })
      if (!json.length) { setError('File rỗng hoặc không có dữ liệu'); return }

      const first = json[0]
      // Student columns — exclude "phu huynh" / "parent" / "ph"
      const PARENT_EX = ['phu huynh', 'parent', 'cha', 'me', 'guard']
      const k = {
        name:    findKey(first, ['ho ten hoc vien', 'ho ten hv', 'ho ten', 'ho va ten', 'full name', 'student name', 'ten hoc vien', 'ten'], PARENT_EX),
        gender:  findKey(first, ['gioi tinh', 'gender', 'sex'], PARENT_EX),
        dob:     findKey(first, ['ngay sinh', 'birth', 'dob', 'birthday'], PARENT_EX),
        level:   findKey(first, ['trinh do', 'level', 'cap do', 'lop'], PARENT_EX),
        phone:   findKey(first, ['sdt hoc vien', 'sdt hv', 'sdt', 'so dien thoai', 'dien thoai', 'phone'], PARENT_EX),
        email:   findKey(first, ['email hoc vien', 'email hv', 'email', 'mail'], PARENT_EX),
        status:  findKey(first, ['trang thai', 'status', 'tinh trang']),
        enroll:  findKey(first, ['ngay nhap hoc', 'nhap hoc', 'enroll', 'join date']),
        // Parent columns — MUST contain "phu huynh" / "parent" / "ph"
        pName:   findKey(first, ['ho ten phu huynh', 'ten phu huynh', 'phu huynh', 'parent name', 'ho ten ph', 'ten ph']),
        pPhone:  findKey(first, ['sdt phu huynh', 'phone phu huynh', 'parent phone', 'sdt ph']),
        pEmail:  findKey(first, ['email phu huynh', 'parent email', 'email ph']),
        pRel:    findKey(first, ['quan he', 'relation', 'moi quan he']),
        pAddr:   findKey(first, ['dia chi', 'address']),
        notes:   findKey(first, ['ghi chu', 'note', 'remark']),
      }

      if (!k.name) {
        setError('Không tìm thấy cột "Họ tên". Hãy tải file mẫu để xem định dạng đúng.')
        return
      }

      const seenPhone   = new Set<string>()
      const seenNameDob = new Set<string>()

      const parsed: ParsedRow[] = json.map((row, i): ParsedRow => {
        const full_name = String(row[k.name!] ?? '').trim()
        const rawPhone = k.phone ? row[k.phone] : null
        const phone = normalizePhone(rawPhone != null ? String(rawPhone) : null)
        const rawDob = k.dob ? row[k.dob] : null
        const dob = parseDate(rawDob)
        const email = k.email ? (String(row[k.email] ?? '').trim() || null) : null
        const gender = k.gender ? parseGender(row[k.gender]) : null
        const level = k.level ? (String(row[k.level] ?? '').trim() || null) : null
        const status = k.status ? parseStatus(row[k.status]) : 'active'
        const enroll_date = k.enroll ? parseDate(row[k.enroll]) : null
        const notes = k.notes ? (String(row[k.notes] ?? '').trim() || null) : null

        // Parent fields
        const parent_name = k.pName ? (String(row[k.pName] ?? '').trim() || null) : null
        const rawPPhone = k.pPhone ? row[k.pPhone] : null
        const parent_phone = normalizePhone(rawPPhone != null ? String(rawPPhone) : null)
        const parent_email = k.pEmail ? (String(row[k.pEmail] ?? '').trim() || null) : null
        const parent_relation = k.pRel ? parseRelation(row[k.pRel]) : 'mother'
        const parent_address = k.pAddr ? (String(row[k.pAddr] ?? '').trim() || null) : null

        /* ── Validation ── */
        const errors: string[] = []
        // Student
        if (!full_name || full_name.length < 2) errors.push('Tên HV không hợp lệ')
        if (rawPhone && !phone) errors.push('SĐT HV sai format')
        else if (phone && !isValidVnPhone(phone)) errors.push('SĐT HV không phải số VN')
        if (email && !EMAIL_RE.test(email)) errors.push('Email HV không hợp lệ')
        if (rawDob && !dob) errors.push('Ngày sinh sai định dạng')

        // Parent
        const hasParentData = parent_name || parent_phone || parent_email
        if (hasParentData) {
          if (!parent_name || parent_name.length < 2) errors.push('Tên PH không hợp lệ')
          if (!parent_phone) errors.push('Thiếu SĐT PH (bắt buộc)')
          else if (!isValidVnPhone(parent_phone)) errors.push('SĐT PH không phải số VN')
          if (parent_email && !EMAIL_RE.test(parent_email)) errors.push('Email PH không hợp lệ')
        }

        /* ── Duplicate check ── */
        let rowStatus: RowStatus = 'ok'
        let duplicateOf: { id?: string; name: string } | null = null

        if (errors.length > 0) {
          rowStatus = 'error'
        } else {
          if (phone && dbMaps.byPhone.has(phone)) {
            const s = dbMaps.byPhone.get(phone)!
            duplicateOf = { id: s.id, name: s.full_name }
            rowStatus = 'duplicate-db'
          } else {
            const nameKey = normalize(full_name)
            const yr = dob ? new Date(dob).getFullYear() : ''
            const key = `${nameKey}|${yr}`
            if (nameKey && dbMaps.byNameDob.has(key)) {
              const s = dbMaps.byNameDob.get(key)!
              duplicateOf = { id: s.id, name: s.full_name }
              rowStatus = 'duplicate-db'
            }
          }
          if (rowStatus === 'ok') {
            if (phone && seenPhone.has(phone)) {
              duplicateOf = { name: 'dòng phía trên trong file' }
              rowStatus = 'duplicate-file'
            } else {
              const nameKey = normalize(full_name)
              const yr = dob ? new Date(dob).getFullYear() : ''
              const key = `${nameKey}|${yr}`
              if (nameKey && seenNameDob.has(key)) {
                duplicateOf = { name: 'dòng phía trên trong file' }
                rowStatus = 'duplicate-file'
              }
            }
          }
        }

        if (phone) seenPhone.add(phone)
        if (full_name) {
          const yr = dob ? new Date(dob).getFullYear() : ''
          seenNameDob.add(`${normalize(full_name)}|${yr}`)
        }

        return {
          rowIdx: i + 2,
          full_name, gender, dob, level, phone, email, status, enroll_date, notes,
          parent_name, parent_phone, parent_email, parent_relation, parent_address,
          errors, rowStatus, duplicateOf,
          selected: rowStatus === 'ok',
          forceImport: false,
        }
      })

      setRows(parsed)
      setStep('preview')
    } catch (e: any) {
      setError(e.message || 'Không đọc được file. Hãy thử lại với file .xlsx hoặc .csv.')
    }
  }

  const handleDownloadSample = () => {
    const headers = [
      'Họ tên', 'Giới tính', 'Ngày sinh', 'Trình độ',
      'SĐT', 'Email', 'Trạng thái', 'Ngày nhập học',
      'Họ tên phụ huynh', 'SĐT phụ huynh', 'Email phụ huynh', 'Quan hệ', 'Địa chỉ',
      'Ghi chú',
    ]
    const samples = [
      ['Nguyễn Văn A', 'Nam', '15/05/2010', 'A1', '0901234567', 'a@example.com', 'Đang học', '15/01/2025',
       'Nguyễn Thị B', '0987123456', 'phu.huynh@example.com', 'Mẹ', '123 Trần Hưng Đạo, Q1, TP.HCM',
       'Học viên mới'],
      ['Trần Thị B',   'Nữ',  '20/08/2012', 'A2', '', '', 'Học thử',  '01/02/2025',
       'Trần Văn C',   '0912345678', '', 'Bố', '456 Lê Lợi, Q3, TP.HCM',
       ''],
      ['Lê Văn C',     'Nam', '10/03/2009', 'B1', '0905555666', '', 'Đang học', '',
       '', '', '', '', '',
       'Không có phụ huynh'],
    ]
    const csv = '﻿' + [headers, ...samples].map(r =>
      r.map(c => /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(',')
    ).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: 'mau-import-hoc-vien.csv',
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleImport = async () => {
    const toImport = rows.filter(r => r.selected && (r.rowStatus === 'ok' || (r.rowStatus === 'duplicate-db' && r.forceImport)))
    if (toImport.length === 0) { setError('Không có dòng nào được chọn để import'); return }

    setImporting(true)
    setError(null)
    setProgress({ done: 0, total: toImport.length })
    let ok = 0, failed = 0
    for (let i = 0; i < toImport.length; i++) {
      const r = toImport[i]
      const studentPayload = {
        full_name:   r.full_name,
        gender:      r.gender,
        dob:         r.dob,
        level:       r.level,
        phone:       r.phone,
        email:       r.email,
        status:      r.status,
        enroll_date: r.enroll_date,
        notes:       r.notes,
      }
      try {
        let createdStudent: DbStudent
        if (r.parent_name && r.parent_phone) {
          createdStudent = await createStudentWithParent(
            studentPayload,
            {
              full_name: r.parent_name,
              phone:     r.parent_phone,
              email:     r.parent_email,
              address:   r.parent_address,
            },
            r.parent_relation,
          )
        } else {
          createdStudent = await createStudent(studentPayload)
        }
        // Link to current branch + academic year so HV xuất hiện ngay khi filter
        if (branchId && yearId && createdStudent?.id) {
          try {
            await linkStudentToAcademicYear(createdStudent.id, branchId, yearId, r.level)
          } catch (linkErr) {
            console.warn('Link student to academic year failed:', linkErr)
          }
        }
        ok++
      } catch (e) {
        failed++
        console.error('Import row failed:', r, e)
      }
      setProgress({ done: i + 1, total: toImport.length })
    }
    setImporting(false)
    setResult({ ok, failed })
    setStep('done')
    if (ok > 0) {
      onSuccess()
      toast.success(`Đã import ${ok} học viên${failed > 0 ? ` (${failed} thất bại)` : ''}`)
    }
  }

  /* Counts */
  const validCount    = rows.filter(r => r.rowStatus === 'ok').length
  const dupDbCount    = rows.filter(r => r.rowStatus === 'duplicate-db').length
  const dupFileCount  = rows.filter(r => r.rowStatus === 'duplicate-file').length
  const errorCount    = rows.filter(r => r.rowStatus === 'error').length
  const selectedCount = rows.filter(r => r.selected).length
  const withParentCount = rows.filter(r => r.selected && r.parent_name && r.parent_phone).length

  /* Filtered rows for display */
  const displayedRows = rows.filter(r => {
    if (filterTab === 'all') return true
    if (filterTab === 'valid') return r.rowStatus === 'ok'
    if (filterTab === 'errors') return r.rowStatus === 'error'
    if (filterTab === 'duplicates') return r.rowStatus === 'duplicate-db' || r.rowStatus === 'duplicate-file'
    return true
  })

  /* ─── Render ─── */
  return (
    <Modal open={open} onClose={handleClose} title="Import học viên từ Excel/CSV" width={1000}>
      {step === 'upload' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Button variant="outline" icon="download" onClick={handleDownloadSample}>
              Tải file mẫu CSV
            </Button>
            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>
              Hỗ trợ <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
            </span>
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false)
              const f = e.dataTransfer.files[0]; if (f) handleFile(f)
            }}
            style={{
              border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 12, padding: 36, textAlign: 'center',
              background: dragOver ? 'var(--primary-light)' : 'var(--hover-bg)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Icon name="upload" size={40}
              style={{ display: 'block', margin: '0 auto 12px', color: dragOver ? 'var(--primary)' : 'var(--text-4)' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 14, marginBottom: 4 }}>
              Kéo thả file vào đây
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>hoặc click để chọn file</div>
          </div>

          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

          {error && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 9, background: '#fee2e2', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="alert" size={14} /> {error}
            </div>
          )}

          <div style={{ marginTop: 18, padding: 14, background: 'var(--hover-bg)', borderRadius: 9, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 6, fontSize: 12.5 }}>
              <Icon name="alert-circle" size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              Định dạng file:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 4 }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: 4 }}>👤 Thông tin học viên</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li><strong>Họ tên</strong> (bắt buộc, ≥2 ký tự)</li>
                  <li>Giới tính: Nam/Nữ hoặc M/F</li>
                  <li>Ngày sinh: DD/MM/YYYY hoặc YYYY-MM-DD</li>
                  <li>SĐT: 10 số bắt đầu bằng 0 (VN)</li>
                  <li>Email: chuẩn RFC (vd. a@b.com)</li>
                  <li>Trạng thái: Đang học/Học thử/Tạm nghỉ/Nghỉ học</li>
                </ul>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: 4 }}>👪 Thông tin phụ huynh (tuỳ chọn)</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Cột phải có chữ <strong>"phụ huynh"</strong> hoặc <strong>"PH"</strong></li>
                  <li>VD: <em>"SĐT phụ huynh"</em>, <em>"Email PH"</em></li>
                  <li>Nếu có tên PH → <strong>SĐT PH bắt buộc</strong></li>
                  <li>Quan hệ: Bố/Mẹ/Ông/Bà/Người giám hộ</li>
                  <li>SĐT, Email PH phải đúng format VN</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <Icon name="alert" size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Trùng học viên được phát hiện theo <strong>SĐT</strong> hoặc <strong>Họ tên + Năm sinh</strong> — sẽ tự bỏ qua.
            </div>
            {branchId && yearId && (
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
                <Icon name="check" size={11} style={{ verticalAlign: 'middle', marginRight: 4, color: '#16a34a' }} />
                Học viên import sẽ được tự động gán vào <strong>chi nhánh & năm học</strong> đang chọn.
              </div>
            )}
            {(!branchId || !yearId) && (
              <div style={{ marginTop: 4, fontSize: 11, color: '#d97706' }}>
                <Icon name="alert" size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Bạn chưa chọn chi nhánh hoặc năm học — học viên import sẽ không được gán branch/year. Nếu đang filter theo branch/year, HV mới sẽ không hiện.
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              <Icon name="file-text" size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              <strong style={{ color: 'var(--text-1)' }}>{filename}</strong> · {rows.length} dòng
            </span>
            <div style={{ flex: 1 }} />
            <Badge variant="success">{validCount} hợp lệ</Badge>
            {dupDbCount > 0   && <Badge variant="warning">{dupDbCount} trùng DB</Badge>}
            {dupFileCount > 0 && <Badge variant="warning">{dupFileCount} trùng file</Badge>}
            {errorCount > 0   && <Badge variant="error">{errorCount} lỗi</Badge>}
            <Badge variant="primary">{selectedCount} import</Badge>
            {withParentCount > 0 && <Badge variant="info">{withParentCount} có PH</Badge>}
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
            {(['all', 'valid', 'errors', 'duplicates'] as const).map(tab => {
              let count = 0
              if (tab === 'all') count = rows.length
              else if (tab === 'valid') count = validCount
              else if (tab === 'errors') count = errorCount
              else if (tab === 'duplicates') count = dupDbCount + dupFileCount
              const isActive = filterTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  style={{
                    padding: '8px 12px', fontSize: 12, border: 'none',
                    background: 'transparent', cursor: 'pointer',
                    color: isActive ? 'var(--primary)' : 'var(--text-3)',
                    fontWeight: isActive ? 600 : 400,
                    borderBottom: isActive ? '2px solid var(--primary)' : 'none',
                    marginBottom: -1,
                    transition: 'all 0.15s',
                  }}
                >
                  {tab === 'all' && `Tất cả (${count})`}
                  {tab === 'valid' && `Hợp lệ (${count})`}
                  {tab === 'errors' && `Lỗi (${count})`}
                  {tab === 'duplicates' && `Trùng lặp (${count})`}
                </button>
              )
            })}
          </div>

          <div style={{ maxHeight: 400, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 9 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--hover-bg)', zIndex: 1 }}>
                <tr>
                  <th style={th(36)}>
                    <input type="checkbox"
                      checked={displayedRows.length > 0 && displayedRows.every(r => r.selected || (r.rowStatus !== 'ok' && !(r.rowStatus === 'duplicate-db' && r.forceImport)))}
                      onChange={e => setRows(rs => rs.map(r =>
                        displayedRows.includes(r) ? { ...r, selected: e.target.checked && (r.rowStatus === 'ok' || (r.rowStatus === 'duplicate-db' && r.forceImport)) } : r
                      ))}
                    />
                  </th>
                  <th style={th(40)}>#</th>
                  <th style={th(110)}>Trạng thái</th>
                  <th style={th(180)}>Học viên</th>
                  <th style={th(110)}>SĐT HV</th>
                  <th style={th(150)}>Email HV</th>
                  <th style={th(180)}>Phụ huynh</th>
                  <th style={th(110)}>SĐT PH</th>
                  <th style={th(70)}>Quan hệ</th>
                  <th style={th(80)}>Ghi đè</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((r, i) => {
                  const rowIndex = rows.indexOf(r)
                  const bg = r.rowStatus === 'error' ? 'rgba(239,68,68,0.06)'
                    : r.rowStatus === 'duplicate-db'   ? 'rgba(245,158,11,0.06)'
                    : r.rowStatus === 'duplicate-file' ? 'rgba(245,158,11,0.04)'
                    : 'transparent'
                  const canSelect = r.rowStatus === 'ok' || (r.rowStatus === 'duplicate-db' && r.forceImport)
                  return (
                    <tr key={i} style={{ background: bg, borderBottom: '1px solid var(--border-light)' }}>
                      <td style={td()}>
                        <input type="checkbox" checked={r.selected} disabled={!canSelect}
                          onChange={e => setRows(rs => rs.map((x, idx) => idx === rowIndex ? { ...x, selected: e.target.checked } : x))}
                          title={!canSelect ? 'Dòng không hợp lệ hoặc chưa ghi đè duplicate' : undefined}
                        />
                      </td>
                      <td style={{ ...td(), color: 'var(--text-4)' }}>{r.rowIdx}</td>
                      <td style={td()}>
                        {r.rowStatus === 'error' && (
                          <span title={r.errors.join(' · ')} style={pill('#dc2626', '#fee2e2')}>
                            <Icon name="x" size={10} /> {r.errors[0]}
                          </span>
                        )}
                        {r.rowStatus === 'duplicate-db' && (
                          <span title={`Trùng với HV: ${r.duplicateOf?.name}`} style={pill('#d97706', '#fef3c7')}>
                            <Icon name="alert" size={10} /> Có trong DB
                          </span>
                        )}
                        {r.rowStatus === 'duplicate-file' && (
                          <span title="Trùng với dòng phía trên trong file" style={pill('#d97706', '#fef3c7')}>
                            <Icon name="alert" size={10} /> Trùng file
                          </span>
                        )}
                        {r.rowStatus === 'ok' && (
                          <span style={pill('#16a34a', '#dcfce7')}>
                            <Icon name="check" size={10} /> Hợp lệ
                          </span>
                        )}
                      </td>
                      <td style={td()}>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{r.full_name || '—'}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-4)', marginTop: 1 }}>
                          {r.gender === 'M' ? 'Nam' : r.gender === 'F' ? 'Nữ' : '?'}
                          {r.dob && ` · ${r.dob}`}
                          {r.level && ` · ${r.level}`}
                        </div>
                      </td>
                      <td style={td()}>{r.phone ?? '—'}</td>
                      <td style={{ ...td(), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                        {r.email ?? '—'}
                      </td>
                      <td style={td()}>
                        {r.parent_name ? (
                          <>
                            <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>{r.parent_name}</div>
                            {r.parent_email && (
                              <div style={{ fontSize: 10.5, color: 'var(--text-4)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>
                                {r.parent_email}
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>
                      <td style={td()}>{r.parent_phone ?? '—'}</td>
                      <td style={td()}>
                        {r.parent_name ? (
                          <Badge style={{ fontSize: 10, padding: '1px 7px' }}>{RELATION_LABEL[r.parent_relation]}</Badge>
                        ) : '—'}
                      </td>
                      <td style={td()}>
                        {r.rowStatus === 'duplicate-db' ? (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={r.forceImport}
                              onChange={e => setRows(rs => rs.map((x, idx) => idx === rowIndex ? { ...x, forceImport: e.target.checked, selected: e.target.checked ? true : r.selected } : x))}
                            />
                            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Ghi đè</span>
                          </label>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {importing && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
                <span>Đang import...</span>
                <strong>{progress.done}/{progress.total}</strong>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'var(--hover-bg)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(progress.done / Math.max(1, progress.total)) * 100}%`,
                  borderRadius: 99, background: 'var(--primary)', transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 9, background: '#fee2e2', color: '#dc2626', fontSize: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Button variant="secondary" onClick={() => { setStep('upload'); setRows([]); setError(null) }} disabled={importing}>
              ← Chọn file khác
            </Button>
            <Button icon="upload" disabled={selectedCount === 0 || importing} onClick={handleImport}>
              {importing ? `Đang import ${progress.done}/${progress.total}...` : `Import ${selectedCount} học viên`}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: result.failed === 0 ? '#dcfce7' : '#fef3c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Icon name={result.failed === 0 ? 'check' : 'alert'} size={36}
              style={{ color: result.failed === 0 ? '#16a34a' : '#d97706' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>
            Hoàn tất import
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 22 }}>
            Thành công <strong style={{ color: '#16a34a' }}>{result.ok}</strong> học viên
            {result.failed > 0 && <> · Thất bại <strong style={{ color: '#dc2626' }}>{result.failed}</strong></>}
          </div>
          <Button onClick={handleClose}>Đóng</Button>
        </div>
      )}
    </Modal>
  )
}

const th = (width?: number): React.CSSProperties => ({
  padding: '9px 10px', textAlign: 'left',
  fontSize: 10.5, fontWeight: 700, color: 'var(--text-4)',
  textTransform: 'uppercase', letterSpacing: '0.4px',
  width, whiteSpace: 'nowrap',
})

const td = (): React.CSSProperties => ({
  padding: '7px 10px', color: 'var(--text-2)', fontSize: 12, verticalAlign: 'middle',
})

const pill = (color: string, bg: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 3,
  padding: '2px 8px', borderRadius: 99,
  fontSize: 10.5, fontWeight: 700,
  background: bg, color, whiteSpace: 'nowrap',
})
