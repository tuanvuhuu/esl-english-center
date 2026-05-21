import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, Button, useToast, SelectBoxMultiple } from '../../../components'
import { createClass, updateClass, getTeachers, getRooms, getBranches, getAcademicYears } from '../../../services'
import { useQuery } from '../../../hooks'
import { supabase } from '../../../lib/supabase'
import type { Class } from '../../../types/data'

interface ClassFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  classData?: Class | null
}

interface Form {
  name: string
  level: string
  ageGroup: string
  teacherId: string
  assistantIds: string[]
  roomId: string
  branchId: string
  academicYearId: string
  totalSessions: string
  maxStudents: string
  feePerMonth: string
  status: string
  startDate: string
  endDate: string
  schedDays: number[]
  schedStart: string
  schedEnd: string
}

const EMPTY: Form = {
  name: '', level: 'A1', ageGroup: '', teacherId: '', assistantIds: [],
  roomId: '', branchId: '', academicYearId: '', totalSessions: '', maxStudents: '15', feePerMonth: '',
  status: 'active', startDate: '', endDate: '',
  schedDays: [], schedStart: '17:00', schedEnd: '18:30',
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

export const ClassFormModal: React.FC<ClassFormModalProps> = ({ open, onClose, onSuccess, classData }) => {
  const isEdit = !!classData
  const toast = useToast()
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: teachers } = useQuery(getTeachers)
  const { data: rooms } = useQuery(getRooms)
  const { data: branches } = useQuery(getBranches)
  const { data: years } = useQuery(getAcademicYears)

  useEffect(() => {
    if (classData) {
      setForm({
        name: classData.name ?? '',
        level: classData.level ?? 'A1',
        ageGroup: classData.ageGroup ?? '',
        teacherId: String(classData.teacherId ?? ''),
        assistantIds: (classData.assistantIds as string[] | undefined) ?? [],
        roomId: classData.roomId ?? '',
        branchId: '',
        academicYearId: '',
        totalSessions: classData.totalSessions != null ? String(classData.totalSessions) : '',
        maxStudents: String(classData.maxStudents ?? 15),
        feePerMonth: classData.feeRaw != null ? String(classData.feeRaw) : '',
        status: classData.status ?? 'active',
        startDate: classData.startDate ? classData.startDate.split('/').reverse().join('-') : '',
        endDate: classData.endDate ? classData.endDate.split('/').reverse().join('-') : '',
        schedDays: classData.days ?? [],
        schedStart: classData.time ?? '17:00',
        schedEnd: classData.endTime ?? '18:30',
      })
    } else {
      setForm(EMPTY)
    }
    setError(null)
  }, [classData, open])

  const set = (k: keyof Form, v: any) => setForm(f => ({ ...f, [k]: v }))

  const toggleDay = (d: number) => {
    setForm(f => ({
      ...f,
      schedDays: f.schedDays.includes(d) ? f.schedDays.filter(x => x !== d) : [...f.schedDays, d].sort(),
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vui lòng nhập tên lớp'); return }
    if (!form.branchId && !isEdit) { setError('Vui lòng chọn cơ sở'); return }
    if (!form.academicYearId && !isEdit) { setError('Vui lòng chọn năm học'); return }
    setSaving(true)
    setError(null)
    try {
      const payload: any = {
        name: form.name,
        level: form.level,
        age_group: form.ageGroup || null,
        teacher_id: form.teacherId || null,
        room_id: form.roomId || null,
        total_sessions: parseInt(form.totalSessions) || null,
        max_students: parseInt(form.maxStudents) || 15,
        fee_per_month: form.feePerMonth ? parseFloat(form.feePerMonth) : null,
        status: form.status,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
      }
      if (!isEdit) {
        payload.branch_id = form.branchId
        payload.academic_year_id = form.academicYearId
      }

      let classId: string
      if (isEdit && classData) {
        const updated = await updateClass(String(classData.id), payload, form.assistantIds)
        classId = updated.id
      } else {
        const created = await createClass(payload, form.assistantIds)
        classId = created.id
        // create schedules
        if (form.schedDays.length > 0) {
          await supabase.from('class_schedules').insert(
            form.schedDays.map(d => ({
              class_id: classId,
              day_of_week: d,
              start_time: form.schedStart + ':00',
              end_time: form.schedEnd + ':00',
            }))
          )
        }
      }

      toast.success(isEdit ? 'Cập nhật lớp học thành công' : 'Mở lớp học thành công')
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message || 'Đã có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa lớp học' : 'Mở lớp mới'} width={820}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Tên lớp — full width */}
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Tên lớp *" value={form.name} onChange={v => set('name', v)} placeholder="VD: A1-01, B2-Kids..." />
        </div>

        {/* Hàng 2: Trình độ · Độ tuổi · Trạng thái */}
        <Select label="Trình độ" value={form.level} onChange={v => set('level', v)}
          options={[
            { value: 'A1', label: 'A1 · Starter' }, { value: 'A2', label: 'A2 · Elementary' },
            { value: 'B1', label: 'B1 · Pre-Inter' }, { value: 'B2', label: 'B2 · Intermediate' },
          ]} />
        <Input label="Độ tuổi" value={form.ageGroup} onChange={v => set('ageGroup', v)} placeholder="VD: 8-12" />
        <Select label="Trạng thái" value={form.status} onChange={v => set('status', v)}
          options={[
            { value: 'active', label: 'Đang học' }, { value: 'inactive', label: 'Chưa khai giảng' },
            { value: 'completed', label: 'Đã kết thúc' }, { value: 'cancelled', label: 'Đã huỷ' },
          ]} />

        {/* Hàng 3: Giáo viên · Phòng học · Sĩ số */}
        <Select label="Giáo viên" value={form.teacherId} onChange={v => set('teacherId', v)}
          options={[
            { value: '', label: 'Chưa phân công' },
            ...(teachers ?? []).map(t => ({ value: t.id, label: t.full_name })),
          ]} />
        <Select label="Phòng học" value={form.roomId} onChange={v => set('roomId', v)}
          options={[
            { value: '', label: 'Chưa chọn phòng' },
            ...(rooms ?? []).map(r => ({ value: r.id, label: r.name })),
          ]} />
        <Input label="Tổng số buổi" value={form.totalSessions} onChange={v => set('totalSessions', v)} type="number" placeholder="VD: 24" />
        <Input label="Sĩ số tối đa" value={form.maxStudents} onChange={v => set('maxStudents', v)} type="number" placeholder="15" />

        {/* Trợ giảng — full width, chọn nhiều */}
        <div style={{ gridColumn: '1/-1' }}>
          <SelectBoxMultiple
            label="Trợ giảng"
            options={(teachers ?? [])
              .filter(t => t.id !== form.teacherId)
              .map(t => ({ value: t.id, label: t.full_name }))}
            value={form.assistantIds}
            onChange={v => setForm(f => ({ ...f, assistantIds: v }))}
            placeholder="Chọn trợ giảng (tuỳ chọn)..."
          />
        </div>

        {/* Hàng 4: Cơ sở · Năm học · Học phí (chỉ khi thêm mới) */}
        {!isEdit ? (
          <>
            <Select label="Cơ sở *" value={form.branchId} onChange={v => set('branchId', v)}
              options={[
                { value: '', label: 'Chọn cơ sở...' },
                ...(branches ?? []).map(b => ({ value: b.id, label: b.name })),
              ]} />
            <Select label="Năm học *" value={form.academicYearId} onChange={v => set('academicYearId', v)}
              options={[
                { value: '', label: 'Chọn năm học...' },
                ...(years ?? []).map(y => ({ value: y.id, label: y.name })),
              ]} />
            <Input label="Học phí/tháng (VNĐ)" value={form.feePerMonth} onChange={v => set('feePerMonth', v)} type="number" placeholder="1500000" />
          </>
        ) : (
          <Input label="Học phí/tháng (VNĐ)" value={form.feePerMonth} onChange={v => set('feePerMonth', v)} type="number" placeholder="1500000" />
        )}

        {/* Hàng 5: Ngày khai giảng · Ngày bế giảng */}
        <Input label="Ngày khai giảng" value={form.startDate} onChange={v => set('startDate', v)} type="date" />
        <Input label="Ngày bế giảng" value={form.endDate} onChange={v => set('endDate', v)} type="date" />

        {/* Lịch học — chỉ khi thêm mới, full width */}
        {!isEdit && (
          <div style={{ gridColumn: '1/-1', paddingTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Lịch học</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {DAY_LABELS.map((label, i) => (
                <button key={i} onClick={() => toggleDay(i)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)',
                    background: form.schedDays.includes(i) ? 'var(--primary)' : 'var(--hover-bg)',
                    color: form.schedDays.includes(i) ? '#fff' : 'var(--text-3)',
                    transition: 'all 0.15s',
                  }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Input label="Giờ bắt đầu" value={form.schedStart} onChange={v => set('schedStart', v)} type="time" />
              <Input label="Giờ kết thúc" value={form.schedEnd} onChange={v => set('schedEnd', v)} type="time" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', fontSize: 13, color: '#ef4444' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center' }}>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button icon={saving ? undefined : 'check'} onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Mở lớp'}
        </Button>
      </div>
    </Modal>
  )
}
