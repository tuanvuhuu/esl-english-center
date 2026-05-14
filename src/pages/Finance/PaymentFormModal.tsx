import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, Button, useToast } from '../../components'
import { createPayment, updatePayment, getStudents, getClasses } from '../../services'
import { useQuery } from '../../hooks'
import type { DbPayment } from '../../types/database'

interface PaymentFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  studentId?: string
  classId?: string
  editItem?: DbPayment | null
}

interface Form {
  studentId: string
  classId: string
  amount: string
  type: string
  method: string
  periodMonth: string
  periodYear: string
  dueDate: string
  paymentDate: string
  status: string
  notes: string
}

const now = new Date()
const emptyForm = (studentId?: string, classId?: string): Form => ({
  studentId: studentId ?? '', classId: classId ?? '', amount: '',
  type: 'tuition', method: 'cash',
  periodMonth: String(now.getMonth() + 1),
  periodYear: String(now.getFullYear()),
  dueDate: '',
  paymentDate: new Date().toISOString().split('T')[0],
  status: 'paid',
  notes: '',
})

const fromDb = (p: DbPayment): Form => ({
  studentId:   p.student_id,
  classId:     p.class_id ?? '',
  amount:      String(p.amount ?? ''),
  type:        p.type ?? 'tuition',
  method:      p.payment_method ?? 'cash',
  periodMonth: String(p.period_month ?? (now.getMonth() + 1)),
  periodYear:  String(p.period_year  ?? now.getFullYear()),
  dueDate:     p.due_date ?? '',
  paymentDate: p.payment_date ?? '',
  status:      p.status ?? 'paid',
  notes:       p.notes ?? '',
})

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  open, onClose, onSuccess, studentId, classId, editItem,
}) => {
  const toast = useToast()
  const isEdit = !!editItem
  const [form, setForm] = useState<Form>(() => editItem ? fromDb(editItem) : emptyForm(studentId, classId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: studentsRaw } = useQuery(getStudents)
  const { data: classesRaw } = useQuery(getClasses)

  useEffect(() => {
    if (!open) return
    setForm(editItem ? fromDb(editItem) : emptyForm(studentId, classId))
    setError(null)
  }, [open, editItem, studentId, classId])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.studentId) { setError('Vui lòng chọn học viên'); return }
    if (!form.amount || isNaN(Number(form.amount))) { setError('Vui lòng nhập số tiền hợp lệ'); return }
    setSaving(true)
    setError(null)
    try {
      const payload: Partial<DbPayment> = {
        student_id:     form.studentId,
        class_id:       form.classId || null,
        amount:         parseFloat(form.amount),
        type:           form.type as any,
        payment_method: form.method as any,
        period_month:   parseInt(form.periodMonth),
        period_year:    parseInt(form.periodYear),
        due_date:       form.dueDate || null,
        payment_date:   form.status === 'paid' ? (form.paymentDate || new Date().toISOString().split('T')[0]) : (form.paymentDate || null),
        status:         form.status as any,
        notes:          form.notes || null,
      }

      if (isEdit && editItem) {
        await updatePayment(editItem.id, payload)
        toast.success('Đã cập nhật phiếu thu')
      } else {
        await createPayment(payload)
        toast.success('Tạo phiếu thu thành công')
      }
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message || 'Đã có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` }))
  const years  = [2024, 2025, 2026, 2027].map(y => ({ value: String(y), label: String(y) }))

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa phiếu thu' : 'Tạo phiếu thu'} width={560}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Select label="Học viên *" value={form.studentId} onChange={v => set('studentId', v)}
            options={[
              { value: '', label: 'Chọn học viên...' },
              ...(studentsRaw ?? []).map(s => ({ value: s.id, label: s.full_name })),
            ]} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <Select label="Lớp học" value={form.classId} onChange={v => set('classId', v)}
            options={[
              { value: '', label: 'Không thuộc lớp nào' },
              ...(classesRaw ?? []).map(c => ({ value: c.id, label: c.name })),
            ]} />
        </div>
        <Input label="Số tiền (VNĐ) *" value={form.amount} onChange={v => set('amount', v)} type="number" placeholder="1500000" />
        <Select label="Trạng thái" value={form.status} onChange={v => set('status', v)}
          options={[
            { value: 'paid',      label: 'Đã thu' },
            { value: 'pending',   label: 'Chờ thu' },
            { value: 'overdue',   label: 'Quá hạn' },
            { value: 'cancelled', label: 'Đã huỷ' },
          ]} />
        <Select label="Loại phiếu" value={form.type} onChange={v => set('type', v)}
          options={[
            { value: 'tuition',  label: 'Học phí' },
            { value: 'material', label: 'Học liệu' },
            { value: 'exam_fee', label: 'Phí thi' },
            { value: 'other',    label: 'Khác' },
          ]} />
        <Select label="Phương thức" value={form.method} onChange={v => set('method', v)}
          options={[
            { value: 'cash',          label: 'Tiền mặt' },
            { value: 'bank_transfer', label: 'Chuyển khoản' },
            { value: 'momo',          label: 'MoMo' },
            { value: 'vnpay',         label: 'VNPay' },
          ]} />
        <Select label="Tháng kỳ" value={form.periodMonth} onChange={v => set('periodMonth', v)} options={months} />
        <Select label="Năm kỳ" value={form.periodYear} onChange={v => set('periodYear', v)} options={years} />
        <Input label="Hạn đóng" value={form.dueDate} onChange={v => set('dueDate', v)} type="date" />
        <Input label="Ngày thu" value={form.paymentDate} onChange={v => set('paymentDate', v)} type="date" />
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Ghi chú" value={form.notes} onChange={v => set('notes', v)} placeholder="Ghi chú thêm (nếu có)..." />
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', fontSize: 13, color: '#ef4444' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button icon={saving ? undefined : 'check'} onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo phiếu thu'}
        </Button>
      </div>
    </Modal>
  )
}
