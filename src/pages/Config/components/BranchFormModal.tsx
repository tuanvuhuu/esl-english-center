import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, Button, useToast } from '../../../components'
import { createBranch, updateBranch } from '../../../services'
import type { Branch } from '../../../types/database'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  branch?: Branch | null
}

interface Form {
  code: string; name: string; address: string
  phone: string; email: string; status: string; notes: string
}

const EMPTY: Form = { code: '', name: '', address: '', phone: '', email: '', status: 'active', notes: '' }

export const BranchFormModal: React.FC<Props> = ({ open, onClose, onSuccess, branch }) => {
  const isEdit = !!branch
  const toast = useToast()
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (branch) {
      setForm({
        code: branch.code ?? '',
        name: branch.name ?? '',
        address: branch.address ?? '',
        phone: branch.phone ?? '',
        email: branch.email ?? '',
        status: branch.status ?? 'active',
        notes: branch.notes ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setError(null)
  }, [branch, open])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.code.trim()) { setError('Vui lòng nhập mã cơ sở'); return }
    if (!form.name.trim()) { setError('Vui lòng nhập tên cơ sở'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        status: form.status as 'active' | 'inactive',
        notes: form.notes || null,
      }
      if (isEdit && branch) {
        await updateBranch(branch.id, payload)
      } else {
        await createBranch(payload)
      }
      toast.success(isEdit ? 'Cập nhật cơ sở thành công' : 'Thêm cơ sở thành công')
      onSuccess(); onClose()
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message || 'Đã có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'} width={500}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <Input label="Mã cơ sở *" value={form.code} onChange={v => set('code', v)} placeholder="CS1" />
        <Input label="Tên cơ sở *" value={form.name} onChange={v => set('name', v)} placeholder="Cơ sở Quận 1" />
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Địa chỉ" value={form.address} onChange={v => set('address', v)} placeholder="123 Nguyễn Huệ, Q.1" />
        </div>
        <Input label="Điện thoại" value={form.phone} onChange={v => set('phone', v)} placeholder="028 1234 5678" />
        <Input label="Email" value={form.email} onChange={v => set('email', v)} placeholder="cs1@esl.edu.vn" />
        <Select label="Trạng thái" value={form.status} onChange={v => set('status', v)}
          options={[{ value: 'active', label: 'Đang hoạt động' }, { value: 'inactive', label: 'Ngừng hoạt động' }]} />
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Ghi chú" value={form.notes} onChange={v => set('notes', v)} placeholder="Ghi chú thêm..." />
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
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm cơ sở'}
        </Button>
      </div>
    </Modal>
  )
}
