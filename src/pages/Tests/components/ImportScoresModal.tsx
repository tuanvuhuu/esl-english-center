import React, { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Modal, Button, Icon, Badge } from '../../../components'
import { upsertTestResult } from '../../../services/tests'
import type { DbTest, DbTestResult } from '../../../types/database'

interface Row {
  studentId: string
  studentName: string
  result: DbTestResult | null
}

interface Props {
  open: boolean
  onClose: () => void
  test: DbTest | null
  rows: Row[]
  threshold: number
  onDone: () => void
}

interface ParsedRow {
  name: string
  reading: number | null
  listening: number | null
  speaking: number | null
  writing: number | null
  matchedStudentId: string | null
  status: 'matched' | 'no-match'
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

const parseNum = (v: any): number | null => {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? null : n
}

export const ImportScoresModal: React.FC<Props> = ({ open, onClose, test, rows, threshold, onDone }) => {
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => { setParsed([]); setError(null); setDone(0) }

  const handleFile = async (file: File) => {
    reset()
    try {
      let wb
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Không đọc được file CSV'))
          reader.readAsText(file, 'utf-8')
        })
        wb = XLSX.read(text, { type: 'string' })
      } else {
        const data = await file.arrayBuffer()
        wb = XLSX.read(data, { type: 'array' })
      }
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<any>(ws, { defval: null })

      if (json.length === 0) {
        setError('File rỗng hoặc không đọc được.')
        return
      }

      // Auto-detect columns: try common names
      const findKey = (obj: any, candidates: string[]): string | null => {
        const keys = Object.keys(obj)
        for (const c of candidates) {
          const k = keys.find(k => normalize(k).includes(normalize(c)))
          if (k) return k
        }
        return null
      }

      const first = json[0]
      const nameKey      = findKey(first, ['ten', 'hoc vien', 'hoc sinh', 'name', 'student'])
      const readingKey   = findKey(first, ['doc', 'reading'])
      const listeningKey = findKey(first, ['nghe', 'listening'])
      const speakingKey  = findKey(first, ['noi', 'speaking'])
      const writingKey   = findKey(first, ['viet', 'writing'])

      if (!nameKey) {
        setError('Không tìm thấy cột tên học viên. Hãy đảm bảo cột đầu là tên (vd: "Họ tên", "Học viên").')
        return
      }

      const studentMap = new Map(rows.map(r => [normalize(r.studentName), r.studentId]))

      const result: ParsedRow[] = json.map(row => {
        const name = String(row[nameKey] ?? '').trim()
        const matchedId = studentMap.get(normalize(name)) ?? null
        return {
          name,
          reading:   readingKey   ? parseNum(row[readingKey])   : null,
          listening: listeningKey ? parseNum(row[listeningKey]) : null,
          speaking:  speakingKey  ? parseNum(row[speakingKey])  : null,
          writing:   writingKey   ? parseNum(row[writingKey])   : null,
          matchedStudentId: matchedId,
          status: (matchedId ? 'matched' : 'no-match') as 'matched' | 'no-match',
        }
      }).filter(r => r.name)

      setParsed(result)
    } catch (e: any) {
      setError(`Không đọc được file: ${e.message}`)
    }
  }

  const handleImport = async () => {
    if (!test) return
    const valid = parsed.filter(p => p.matchedStudentId)
    if (valid.length === 0) { setError('Không có dòng nào match được với học sinh trong lớp.'); return }

    setImporting(true)
    setDone(0)
    try {
      for (const p of valid) {
        const scores = [p.reading, p.listening, p.speaking, p.writing].filter((n): n is number => n !== null)
        const total = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
          : null
        await upsertTestResult({
          test_id:         test.id,
          student_id:      p.matchedStudentId!,
          score_reading:   p.reading,
          score_listening: p.listening,
          score_speaking:  p.speaking,
          score_writing:   p.writing,
          total_score:     total,
          is_passed:       total != null ? total >= threshold : null,
        })
        setDone(d => d + 1)
      }
      onDone()
      onClose()
      reset()
    } catch (e: any) {
      setError(`Lỗi import: ${e.message}`)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const data = [
      ['Họ tên', 'Đọc', 'Nghe', 'Nói', 'Viết'],
      ...rows.map(r => [r.studentName, '', '', '', '']),
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Diem')
    XLSX.writeFile(wb, `Template_${test?.name.replace(/\s+/g, '_') ?? 'BaiKiemTra'}.xlsx`)
  }

  const matchedCount = parsed.filter(p => p.matchedStudentId).length

  return (
    <Modal open={open} onClose={onClose} title="Import điểm từ Excel" width={720}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {parsed.length === 0 ? (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Tải lên file Excel (.xlsx, .xls) chứa cột <strong>Họ tên</strong> và các cột điểm
              <strong> Đọc / Nghe / Nói / Viết</strong>. Hệ thống sẽ tự động khớp theo tên học viên.
            </div>

            <Button variant="outline" size="sm" icon="download" onClick={downloadTemplate}>
              Tải template Excel của lớp này
            </Button>

            <div
              onClick={() => inputRef.current?.click()}
              style={{
                padding: 40, textAlign: 'center', borderRadius: 12,
                border: '2px dashed var(--border)',
                background: 'var(--hover-bg)', cursor: 'pointer',
              }}
            >
              <Icon name="upload" size={32} style={{ color: 'var(--primary)', display: 'block', margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Click để chọn file Excel</div>
              <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>.xlsx, .xls</div>
            </div>

            {error && (
              <div style={{
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--error-light)', color: 'var(--error)',
                fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="alert-circle" size={14} />
                {error}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12 }}>
              <Badge variant="success">Khớp: {matchedCount}</Badge>
              {parsed.length - matchedCount > 0 && (
                <Badge variant="warning">Không khớp: {parsed.length - matchedCount}</Badge>
              )}
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--hover-bg)' }}>
                  <tr>
                    <th style={{ padding: 8, textAlign: 'left' }}>Tên</th>
                    <th style={{ padding: 8 }}>Đọc</th>
                    <th style={{ padding: 8 }}>Nghe</th>
                    <th style={{ padding: 8 }}>Nói</th>
                    <th style={{ padding: 8 }}>Viết</th>
                    <th style={{ padding: 8 }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((p, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border-light)' }}>
                      <td style={{ padding: 8 }}>{p.name}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{p.reading ?? '—'}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{p.listening ?? '—'}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{p.speaking ?? '—'}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>{p.writing ?? '—'}</td>
                      <td style={{ padding: 8, textAlign: 'center' }}>
                        {p.status === 'matched'
                          ? <Badge variant="success">Khớp</Badge>
                          : <Badge variant="warning">Không khớp</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && (
              <div style={{
                padding: '8px 12px', borderRadius: 8,
                background: 'var(--error-light)', color: 'var(--error)', fontSize: 13,
              }}>{error}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" onClick={reset}>Chọn file khác</Button>
              <Button
                variant="primary"
                icon="check"
                loading={importing}
                disabled={matchedCount === 0}
                onClick={handleImport}
              >
                {importing ? `Đang lưu ${done}/${matchedCount}...` : `Import ${matchedCount} dòng`}
              </Button>
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />
      </div>
    </Modal>
  )
}
