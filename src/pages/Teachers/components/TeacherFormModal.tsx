import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, Button, useToast } from '../../../components'
import { createTeacher, updateTeacher } from '../../../services'
import type { Teacher } from '../../../types/data'

interface TeacherFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  teacher?: Teacher | null
}

interface Form {
  name: string
  nationality: string
  phone: string
  email: string
  status: string
  color: string
  bio: string
}

const EMPTY: Form = {
  name: '', nationality: 'Việt Nam', phone: '', email: '',
  status: 'active', color: '#6366f1', bio: '',
}

const COLORS = ['#6366f1', '#FF6B35', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444']

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({ open, onClose, onSuccess, teacher }) => {
  const isEdit = !!teacher
  const toast = useToast()
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (teacher) {
      setForm({
        name: teacher.name ?? '',
        nationality: teacher.nationality ?? 'Việt Nam',
        phone: teacher.phone ?? '',
        email: teacher.email ?? '',
        status: teacher.status ?? 'active',
        color: teacher.color ?? '#6366f1',
        bio: teacher.bio ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setError(null)
  }, [teacher, open])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vui lòng nhập họ tên giáo viên'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        full_name: form.name,
        nationality: form.nationality,
        phone: form.phone || null,
        email: form.email || null,
        status: form.status as any,
        color: form.color,
        bio: form.bio || null,
      }
      if (isEdit && teacher) {
        await updateTeacher(String(teacher.id), payload)
      } else {
        await createTeacher(payload)
      }
      toast.success(isEdit ? 'Cập nhật giáo viên thành công' : 'Thêm giáo viên thành công')
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa giáo viên' : 'Thêm giáo viên mới'} width={520}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Họ tên giáo viên *" value={form.name} onChange={v => set('name', v)} placeholder="Nguyễn Thị B" />
        </div>
        <Input label="Quốc tịch" value={form.nationality} onChange={v => set('nationality', v)} placeholder="Việt Nam" />
        <Select label="Trạng thái" value={form.status} onChange={v => set('status', v)}
          options={[
            { value: 'active', label: 'Đang dạy' },
            { value: 'on-leave', label: 'Nghỉ phép' },
            { value: 'inactive', label: 'Nghỉ việc' },
          ]} />
        <Input label="Số điện thoại" value={form.phone} onChange={v => set('phone', v)} placeholder="0912 345 678" />
        <Input label="Email" value={form.email} onChange={v => set('email', v)} placeholder="teacher@esl.edu.vn" />
        <div style={{ gridColumn: '1/-1' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Màu sắc</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => set('color', c)}
                style={{
                  width: 32, height: 32, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                  outline: form.color === c ? `3px solid ${c}` : 'none',
                  outlineOffset: 2, transition: 'all 0.15s',
                  transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                }} />
            ))}
          </div>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Giới thiệu" value={form.bio} onChange={v => set('bio', v)} placeholder="Giáo viên IELTS, 5 năm kinh nghiệm..." />
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', fontSize: 13, color: '#ef4444' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center' }}>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button icon={saving ? undefined : 'check'} onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm giáo viên'}
        </Button>
      </div>
    </Modal>
  )
}
