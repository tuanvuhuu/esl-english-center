import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, Button, useToast } from '../../components'
import { createRoom, updateRoom, getBranches, notify } from '../../services'
import { useQuery } from '../../hooks'
import type { Room } from '../../types/data'

interface RoomFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  room?: Room | null
}

interface Form {
  name: string
  branchId: string
  floor: string
  capacity: string
  type: string
  status: string
  equipment: string
}

const EMPTY: Form = {
  name: '', branchId: '', floor: '1', capacity: '20',
  type: 'Multi', status: 'available', equipment: '',
}

export const RoomFormModal: React.FC<RoomFormModalProps> = ({ open, onClose, onSuccess, room }) => {
  const isEdit = !!room
  const toast = useToast()
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: branches } = useQuery(getBranches)

  useEffect(() => {
    if (room) {
      setForm({
        name: room.name ?? '',
        branchId: '',
        floor: room.floor ?? '1',
        capacity: String(room.capacity ?? 20),
        type: room.type ?? 'Multi',
        status: room.status ?? 'available',
        equipment: Array.isArray(room.equipment) ? room.equipment.join(', ') : '',
      })
    } else {
      setForm(EMPTY)
    }
    setError(null)
  }, [room, open])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vui lòng nhập tên phòng'); return }
    if (!form.branchId && !isEdit) { setError('Vui lòng chọn cơ sở'); return }
    setSaving(true)
    setError(null)
    try {
      const equipArr = form.equipment
        ? form.equipment.split(',').map(s => s.trim()).filter(Boolean)
        : []
      const payload: any = {
        name: form.name,
        floor: form.floor || null,
        capacity: parseInt(form.capacity) || null,
        type: form.type as any,
        status: form.status as any,
        equipment: equipArr,
      }
      if (!isEdit) payload.branch_id = form.branchId

      if (isEdit && room) {
        await updateRoom(String(room.id), payload)
      } else {
        await createRoom(payload)
      }
      toast.success(isEdit ? 'Cập nhật phòng học thành công' : 'Thêm phòng học thành công')
      notify(
        isEdit ? 'Cập nhật phòng học' : 'Thêm phòng học mới',
        isEdit ? `Đã cập nhật phòng ${form.name}` : `Phòng ${form.name} đã được thêm`,
        'info',
        { entityType: 'room' }
      )
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa phòng học' : 'Thêm phòng học'} width={480}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Tên phòng *" value={form.name} onChange={v => set('name', v)} placeholder="VD: P101, Lab A..." />
        </div>
        {!isEdit && (
          <div style={{ gridColumn: '1/-1' }}>
            <Select label="Cơ sở *" value={form.branchId} onChange={v => set('branchId', v)}
              options={[
                { value: '', label: 'Chọn cơ sở...' },
                ...(branches ?? []).map(b => ({ value: b.id, label: b.name })),
              ]} />
          </div>
        )}
        <Input label="Tầng" value={form.floor} onChange={v => set('floor', v)} placeholder="1" />
        <Input label="Sức chứa (người)" value={form.capacity} onChange={v => set('capacity', v)} type="number" placeholder="20" />
        <Select label="Loại phòng" value={form.type} onChange={v => set('type', v)}
          options={[
            { value: 'Kids', label: 'Kids' },
            { value: 'Teens', label: 'Teens' },
            { value: 'Multi', label: 'Multi-purpose' },
            { value: 'Tutorial', label: 'Tutorial' },
          ]} />
        <Select label="Trạng thái" value={form.status} onChange={v => set('status', v)}
          options={[
            { value: 'available', label: 'Sẵn sàng' },
            { value: 'in-use', label: 'Đang sử dụng' },
            { value: 'maintenance', label: 'Bảo trì' },
          ]} />
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Trang thiết bị (cách nhau bởi dấu phẩy)" value={form.equipment}
            onChange={v => set('equipment', v)} placeholder="Máy chiếu, TV, Điều hoà..." />
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
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm phòng'}
        </Button>
      </div>
    </Modal>
  )
}
