import React, { useState, useEffect } from 'react'
import { Modal, Input, Button, useToast } from '../../../components'
import { createAcademicYear, updateAcademicYear } from '../../../services'
import type { AcademicYear } from '../../../types/database'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  year?: AcademicYear | null
}

interface Form { name: string; startDate: string; endDate: string; notes: string }

const EMPTY: Form = { name: '', startDate: '', endDate: '', notes: '' }

export const AcademicYearFormModal: React.FC<Props> = ({ open, onClose, onSuccess, year }) => {
  const isEdit = !!year
  const toast = useToast()
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (year) {
      setForm({
        name: year.name ?? '',
        startDate: year.start_date ?? '',
        endDate: year.end_date ?? '',
        notes: year.notes ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setError(null)
  }, [year, open])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vui lòng nhập tên năm học'); return }
    if (!form.startDate) { setError('Vui lòng chọn ngày bắt đầu'); return }
    if (!form.endDate) { setError('Vui lòng chọn ngày kết thúc'); return }
    if (form.startDate >= form.endDate) { setError('Ngày kết thúc phải sau ngày bắt đầu'); return }
    setSaving(true); setError(null)
    try {
      const payload = {
        name: form.name,
        start_date: form.startDate,
        end_date: form.endDate,
        notes: form.notes || null,
      }
      if (isEdit && year) {
        await updateAcademicYear(year.id, payload)
      } else {
        await createAcademicYear(payload)
      }
      toast.success(isEdit ? 'Cập nhật năm học thành công' : 'Thêm năm học thành công')
      onSuccess(); onClose()
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message || 'Đã có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa năm học' : 'Thêm năm học mới'} width={460}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Tên năm học *" value={form.name} onChange={v => set('name', v)} placeholder="2024-2025" />
        </div>
        <Input label="Ngày bắt đầu *" value={form.startDate} onChange={v => set('startDate', v)} type="date" />
        <Input label="Ngày kết thúc *" value={form.endDate} onChange={v => set('endDate', v)} type="date" />
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
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm năm học'}
        </Button>
      </div>
    </Modal>
  )
}
