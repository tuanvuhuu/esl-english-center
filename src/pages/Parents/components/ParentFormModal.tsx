import React, { useEffect, useState } from 'react'
import { Modal, Input, Select, Button, useToast } from '../../../components'
import { createParent, updateParent } from '../../../services'
import type { Parent } from '../../../types/database'
import type { DbParent } from '../../../services/parents'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  parent?: DbParent | null
}

interface Form {
  full_name: string
  gender: string
  dob: string
  phone: string
  phone_secondary: string
  email: string
  address: string
  occupation: string
  notes: string
}

const EMPTY: Form = {
  full_name: '', gender: '', dob: '', phone: '', phone_secondary: '',
  email: '', address: '', occupation: '', notes: '',
}

const fromDb = (p: DbParent): Form => ({
  full_name:       p.full_name ?? '',
  gender:          p.gender ?? '',
  dob:             p.dob ?? '',
  phone:           p.phone ?? '',
  phone_secondary: p.phone_secondary ?? '',
  email:           p.email ?? '',
  address:         p.address ?? '',
  occupation:      p.occupation ?? '',
  notes:           p.notes ?? '',
})

const VN_PHONE_RE = /^0[2-9]\d{8}$/
const EMAIL_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._+\-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

export const ParentFormModal: React.FC<Props> = ({ open, onClose, onSuccess, parent }) => {
  const toast = useToast()
  const isEdit = !!parent
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(parent ? fromDb(parent) : EMPTY)
    setError(null)
  }, [open, parent])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      setError('Họ tên phụ huynh không hợp lệ'); return
    }
    if (!form.phone.trim() || !VN_PHONE_RE.test(form.phone.trim())) {
      setError('SĐT chính phải là số VN 10 chữ số (vd. 0901234567)'); return
    }
    if (form.phone_secondary && !VN_PHONE_RE.test(form.phone_secondary.trim())) {
      setError('SĐT phụ không hợp lệ'); return
    }
    if (form.email && !EMAIL_RE.test(form.email.trim())) {
      setError('Email không hợp lệ'); return
    }
    setSaving(true); setError(null)
    try {
      const payload: Partial<Parent> = {
        full_name:       form.full_name.trim(),
        gender:          (form.gender as 'M' | 'F') || null,
        dob:             form.dob || null,
        phone:           form.phone.trim(),
        phone_secondary: form.phone_secondary.trim() || null,
        email:           form.email.trim() || null,
        address:         form.address.trim() || null,
        occupation:      form.occupation.trim() || null,
        notes:           form.notes.trim() || null,
      }
      if (isEdit && parent) {
        await updateParent(parent.id, payload)
        toast.success('Đã cập nhật phụ huynh')
      } else {
        await createParent(payload)
        toast.success('Đã thêm phụ huynh mới')
      }
      onSuccess(); onClose()
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message || 'Đã có lỗi xảy ra')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa phụ huynh' : 'Thêm phụ huynh'} width={560}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Họ tên phụ huynh *" value={form.full_name} onChange={v => set('full_name', v)} placeholder="Nguyễn Văn A" />
        </div>
        <Input label="Ngày sinh" value={form.dob} onChange={v => set('dob', v)} type="date" />
        <Select label="Giới tính" value={form.gender} onChange={v => set('gender', v)}
          options={[{ value: '', label: 'Chưa rõ' }, { value: 'M', label: 'Nam' }, { value: 'F', label: 'Nữ' }]} />

        <Input label="SĐT chính *" value={form.phone} onChange={v => set('phone', v)} placeholder="0901234567" />
        <Input label="SĐT phụ / Zalo" value={form.phone_secondary} onChange={v => set('phone_secondary', v)} placeholder="0987654321" />

        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Email" value={form.email} onChange={v => set('email', v)} type="email" placeholder="email@example.com" />
        </div>
        <Input label="Nghề nghiệp" value={form.occupation} onChange={v => set('occupation', v)} placeholder="VD: Kỹ sư, Giáo viên..." />
        <Input label="Địa chỉ" value={form.address} onChange={v => set('address', v)} placeholder="Số nhà, đường, quận..." />

        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Ghi chú" value={form.notes} onChange={v => set('notes', v)} placeholder="Ghi chú thêm (nếu có)" />
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.1)', fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button icon={saving ? undefined : 'check'} onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm phụ huynh'}
        </Button>
      </div>
    </Modal>
  )
}
