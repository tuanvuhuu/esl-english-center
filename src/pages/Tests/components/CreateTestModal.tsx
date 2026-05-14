import React, { useState } from 'react'
import { Modal, Button } from '../../../components'
import type { DbTest, TestType } from '../../../types/database'
import type { Class } from '../../../types/data'

const TEST_TYPES: { value: TestType; label: string }[] = [
  { value: 'quiz',       label: 'Quiz' },
  { value: 'unit_test',  label: 'Unit Test' },
  { value: 'midterm',    label: 'Giữa kỳ' },
  { value: 'final',      label: 'Cuối kỳ' },
  { value: 'speaking',   label: 'Kiểm tra Nói' },
  { value: 'placement',  label: 'Xếp lớp' },
]

interface CreateTestModalProps {
  open: boolean
  onClose: () => void
  classes: Class[]
  onSave: (payload: Partial<DbTest>) => Promise<void>
  saving?: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 36,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--card-bg)',
  color: 'var(--text-1)',
  fontSize: 14,
  fontFamily: 'var(--font)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-3)',
  marginBottom: 6,
  display: 'block',
}

export const CreateTestModal: React.FC<CreateTestModalProps> = ({
  open,
  onClose,
  classes,
  onSave,
  saving,
}) => {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    name: '',
    class_id: '',
    type: 'quiz' as TestType,
    test_date: today,
    pass_threshold: '60',
    description: '',
  })

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!form.name.trim() || !form.class_id || !form.test_date) return
    await onSave({
      name: form.name.trim(),
      class_id: form.class_id,
      type: form.type,
      test_date: form.test_date,
      total_score: 100,
      pass_threshold: Number(form.pass_threshold) || 60,
      description: form.description.trim() || null,
      status: 'upcoming',
    })
    setForm({
      name: '',
      class_id: '',
      type: 'quiz',
      test_date: today,
      pass_threshold: '60',
      description: '',
    })
    onClose()
  }

  const isValid = form.name.trim() && form.class_id && form.test_date

  return (
    <Modal open={open} onClose={onClose} title="Tạo bài kiểm tra" width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Tên bài */}
        <div>
          <label style={labelStyle}>Tên bài kiểm tra *</label>
          <input
            style={inputStyle}
            placeholder="VD: Unit 5 Quiz, Mid-term Test..."
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>

        {/* Lớp học */}
        <div>
          <label style={labelStyle}>Lớp học *</label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.class_id}
            onChange={e => set('class_id', e.target.value)}
          >
            <option value="">— Chọn lớp —</option>
            {classes.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Loại + Ngày */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Loại kiểm tra</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={form.type}
              onChange={e => set('type', e.target.value)}
            >
              {TEST_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ngày kiểm tra *</label>
            <input
              style={inputStyle}
              type="date"
              value={form.test_date}
              onChange={e => set('test_date', e.target.value)}
            />
          </div>
        </div>

        {/* Ngưỡng đạt */}
        <div>
          <label style={labelStyle}>Ngưỡng điểm đạt (%)</label>
          <input
            style={{ ...inputStyle, width: 100 }}
            type="number"
            min="0"
            max="100"
            value={form.pass_threshold}
            onChange={e => set('pass_threshold', e.target.value)}
          />
        </div>

        {/* Mô tả */}
        <div>
          <label style={labelStyle}>Ghi chú</label>
          <textarea
            style={{
              ...inputStyle,
              height: 72,
              padding: '8px 12px',
              resize: 'none',
            }}
            placeholder="Nội dung kiểm tra, lưu ý..."
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button
            variant="primary"
            icon="check"
            onClick={handleSave}
            disabled={!isValid || saving}
          >
            {saving ? 'Đang lưu...' : 'Tạo bài kiểm tra'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
