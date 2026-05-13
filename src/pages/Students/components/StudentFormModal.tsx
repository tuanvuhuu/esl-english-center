import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, Button } from '../../../components'
import { createStudentWithParent, updateStudent } from '../../../services'
import { useQuery } from '../../../hooks'
import { getClasses } from '../../../services'
import type { Student } from '../../../types/data'
import type { StudentParent } from '../../../types/database'

interface StudentFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  student?: Student | null
}

interface Form {
  name: string
  dob: string
  gender: string
  level: string
  status: string
  parentName: string
  parentPhone: string
  parentEmail: string
  parentRelation: StudentParent['relation']
  classId: string
}

const EMPTY: Form = {
  name: '', dob: '', gender: '', level: 'A1', status: 'active',
  parentName: '', parentPhone: '', parentEmail: '', parentRelation: 'mother', classId: '',
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({ open, onClose, onSuccess, student }) => {
  const isEdit = !!student
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: classesRaw } = useQuery(getClasses)

  useEffect(() => {
    if (student) {
      setForm({
        name: student.name ?? '',
        dob: student.dob ? student.dob.split('/').reverse().join('-') : '',
        gender: student.gender ?? '',
        level: student.level ?? 'A1',
        status: student.status ?? 'active',
        parentName: student.parent ?? '',
        parentPhone: student.phone ?? '',
        parentEmail: student.parentEmail ?? '',
        parentRelation: (student.parentRelation as StudentParent['relation']) ?? 'mother',
        classId: '',
      })
    } else {
      setForm(EMPTY)
    }
    setError(null)
  }, [student, open])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vui lòng nhập họ tên học viên'); return }
    setSaving(true)
    setError(null)
    try {
      if (isEdit && student) {
        await updateStudent(String(student.id), {
          full_name: form.name,
          dob: form.dob || null,
          gender: (form.gender as 'M' | 'F') || null,
          level: form.level,
          status: form.status as any,
        })
      } else {
        await createStudentWithParent(
          {
            full_name: form.name,
            dob: form.dob || null,
            gender: (form.gender as 'M' | 'F') || null,
            level: form.level,
            status: form.status as any,
          },
          {
            full_name: form.parentName || form.name + ' (PH)',
            phone: form.parentPhone || '0000000000',
            email: form.parentEmail || null,
          },
          form.parentRelation,
        )
      }
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const classOptions = [
    { value: '', label: 'Chưa xếp lớp' },
    ...(classesRaw ?? []).map(c => ({ value: c.id, label: c.name })),
  ]

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa học viên' : 'Thêm học viên mới'} width={560}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Họ tên học viên *" value={form.name} onChange={v => set('name', v)} placeholder="Nguyễn Văn A" />
        </div>
        <Input label="Ngày sinh" value={form.dob} onChange={v => set('dob', v)} type="date" />
        <Select label="Giới tính" value={form.gender} onChange={v => set('gender', v)}
          options={[{ value: '', label: 'Chưa rõ' }, { value: 'M', label: 'Nam' }, { value: 'F', label: 'Nữ' }]} />
        <Select label="Trình độ" value={form.level} onChange={v => set('level', v)}
          options={[
            { value: 'A1', label: 'A1 · Starter' }, { value: 'A2', label: 'A2 · Elementary' },
            { value: 'B1', label: 'B1 · Pre-Inter' }, { value: 'B2', label: 'B2 · Intermediate' },
          ]} />
        <Select label="Trạng thái" value={form.status} onChange={v => set('status', v)}
          options={[
            { value: 'active', label: 'Đang học' }, { value: 'trial', label: 'Học thử' },
            { value: 'paused', label: 'Tạm nghỉ' }, { value: 'inactive', label: 'Đã nghỉ' },
          ]} />

        {!isEdit && (
          <>
            <div style={{ gridColumn: '1/-1', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12 }}>Thông tin phụ huynh</div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Input label="Họ tên phụ huynh" value={form.parentName} onChange={v => set('parentName', v)} placeholder="Nguyễn Văn B" />
            </div>
            <Input label="Số điện thoại" value={form.parentPhone} onChange={v => set('parentPhone', v)} placeholder="0912 345 678" />
            <Input label="Email phụ huynh" value={form.parentEmail} onChange={v => set('parentEmail', v)} placeholder="email@gmail.com" />
            <Select label="Quan hệ" value={form.parentRelation} onChange={v => set('parentRelation', v as StudentParent['relation'])}
              options={[
                { value: 'mother', label: 'Mẹ' }, { value: 'father', label: 'Bố' },
                { value: 'grandfather', label: 'Ông' }, { value: 'grandmother', label: 'Bà' },
                { value: 'guardian', label: 'Người giám hộ' }, { value: 'other', label: 'Khác' },
              ]} />
            <Select label="Lớp học" value={form.classId} onChange={v => set('classId', v)} options={classOptions} />
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', fontSize: 13, color: '#ef4444' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button icon={saving ? undefined : 'check'} onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Lưu học viên'}
        </Button>
      </div>
    </Modal>
  )
}
