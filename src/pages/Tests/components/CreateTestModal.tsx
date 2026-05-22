import React, { useState, useEffect } from 'react'
import { Modal, Button } from '../../../components'
import type { DbTest, TestType, QuestionSkill } from '../../../types/database'
import type { Class } from '../../../types/data'
import { getTests } from '../../../services/tests'

const TEST_TYPES: { value: TestType; label: string }[] = [
  { value: 'quiz',       label: 'Quiz' },
  { value: 'unit_test',  label: 'Unit Test' },
  { value: 'midterm',    label: 'Giữa kỳ' },
  { value: 'final',      label: 'Cuối kỳ' },
  { value: 'speaking',   label: 'Kiểm tra Nói' },
  { value: 'placement',  label: 'Xếp lớp' },
]

export interface CreateTestPayload {
  testData: Partial<DbTest>
  creationMode: 'blank' | 'clone' | 'ai'
  cloneFromTestId?: string
  aiOptions?: {
    topic: string
    skill: QuestionSkill | 'all'
    count: number
  }
}

interface CreateTestModalProps {
  open: boolean
  onClose: () => void
  classes: Class[]
  onSave: (payload: CreateTestPayload) => Promise<void>
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

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  background: 'var(--border-light)',
  borderRadius: 10,
  padding: 4,
  gap: 4,
  border: '1px solid var(--border)',
  boxSizing: 'border-box',
}

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '8px 12px',
  borderRadius: 8,
  border: 'none',
  background: active ? 'var(--card)' : 'transparent',
  color: active ? 'var(--primary)' : 'var(--text-3)',
  fontSize: 13,
  fontWeight: active ? 700 : 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  boxShadow: active ? 'var(--shadow-sm)' : 'none',
})

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
    total_score: '100',
    pass_threshold: '60',
    description: '',
  })

  // Thang điểm mode: 'preset' = chọn nhanh, 'custom' = nhập tùy ý
  const [scoreMode, setScoreMode] = useState<'preset' | 'custom'>('preset')

  // Mode & mode options states
  const [creationMode, setCreationMode] = useState<'blank' | 'clone' | 'ai'>('blank')
  const [cloneFromTestId, setCloneFromTestId] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const [aiSkill, setAiSkill] = useState<QuestionSkill | 'all'>('all')
  const [aiCount, setAiCount] = useState(10)

  // Past tests cache for cloning
  const [pastTests, setPastTests] = useState<DbTest[]>([])
  const [loadingPastTests, setLoadingPastTests] = useState(false)

  // Load past tests only when cloning is selected
  useEffect(() => {
    if (open && creationMode === 'clone' && pastTests.length === 0) {
      setLoadingPastTests(true)
      getTests()
        .then(setPastTests)
        .catch(err => console.error('Lỗi tải bài kiểm tra cũ:', err))
        .finally(() => setLoadingPastTests(false))
    }
  }, [open, creationMode, pastTests.length])

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      setForm({
        name: '',
        class_id: '',
        type: 'quiz',
        test_date: today,
        total_score: '100',
        pass_threshold: '60',
        description: '',
      })
      setScoreMode('preset')
      setCreationMode('blank')
      setCloneFromTestId('')
      setAiTopic('')
      setAiSkill('all')
      setAiCount(10)
    }
  }, [open, today])

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const isAiValid = creationMode === 'ai' ? (aiTopic.trim().length > 0 && aiCount >= 5 && aiCount <= 20) : true
  const isCloneValid = creationMode === 'clone' ? !!cloneFromTestId : true
  const isValid = form.name.trim() && form.class_id && form.test_date && isAiValid && isCloneValid

  const totalScoreNum = Number(form.total_score) || 100
  const passThresholdNum = Number(form.pass_threshold) || 60
  const passPercent = totalScoreNum > 0 ? Math.round((passThresholdNum / totalScoreNum) * 100) : 0

  const handleSave = async () => {
    if (!isValid) return
    await onSave({
      testData: {
        name: form.name.trim(),
        class_id: form.class_id,
        type: form.type,
        test_date: form.test_date,
        total_score: totalScoreNum,
        pass_threshold: passThresholdNum,
        description: form.description.trim() || null,
        status: 'upcoming',
      },
      creationMode,
      cloneFromTestId: creationMode === 'clone' ? cloneFromTestId : undefined,
      aiOptions: creationMode === 'ai' ? {
        topic: aiTopic.trim(),
        skill: aiSkill,
        count: aiCount,
      } : undefined
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Tạo bài kiểm tra mới" width={480}>
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

        {/* Thang điểm + Ngưỡng đạt */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Thang điểm (tổng điểm bài test)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[10, 50, 100].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setScoreMode('preset')
                    set('total_score', String(v))
                    // Auto adjust pass_threshold proportionally
                    const ratio = Number(form.pass_threshold) / (Number(form.total_score) || 100)
                    set('pass_threshold', String(Math.round(v * ratio)))
                  }}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 8,
                    border: `1.5px solid ${scoreMode === 'preset' && form.total_score === String(v) ? 'var(--primary)' : 'var(--border)'}`,
                    background: scoreMode === 'preset' && form.total_score === String(v) ? 'var(--primary-light)' : 'transparent',
                    color: scoreMode === 'preset' && form.total_score === String(v) ? 'var(--primary)' : 'var(--text-3)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {v}
                </button>
              ))}
              <input
                style={{ ...inputStyle, width: 60, textAlign: 'center', fontSize: 13, fontWeight: 700 }}
                type="number"
                min="1"
                placeholder="..."
                value={scoreMode === 'custom' ? form.total_score : ''}
                onFocus={() => setScoreMode('custom')}
                onChange={e => {
                  setScoreMode('custom')
                  set('total_score', e.target.value)
                }}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>
              Ngưỡng đạt
              {passPercent > 0 && (
                <span style={{ color: 'var(--primary)', fontWeight: 700, marginLeft: 6 }}>
                  = {passPercent}%
                </span>
              )}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                type="number"
                min="0"
                max={totalScoreNum}
                value={form.pass_threshold}
                onChange={e => set('pass_threshold', e.target.value)}
              />
              <span style={{ fontSize: 12, color: 'var(--text-4)' }}>/ {totalScoreNum}</span>
            </div>
          </div>
        </div>

        {/* Chế độ khởi tạo */}
        <div>
          <label style={labelStyle}>Phương thức tạo câu hỏi</label>
          <div style={tabContainerStyle}>
            <button
              type="button"
              style={tabButtonStyle(creationMode === 'blank')}
              onClick={() => setCreationMode('blank')}
            >
              Tạo trống
            </button>
            <button
              type="button"
              style={tabButtonStyle(creationMode === 'clone')}
              onClick={() => setCreationMode('clone')}
            >
              Nhân bản câu hỏi
            </button>
            <button
              type="button"
              style={tabButtonStyle(creationMode === 'ai')}
              onClick={() => setCreationMode('ai')}
            >
              Tự động sinh (AI)
            </button>
          </div>
        </div>

        {/* Chế độ Nhân bản (Clone) */}
        {creationMode === 'clone' && (
          <div style={{ animation: 'slideUp 0.2s ease-out' }}>
            <label style={labelStyle}>Sao chép câu hỏi từ bài kiểm tra *</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={cloneFromTestId}
              onChange={e => setCloneFromTestId(e.target.value)}
              disabled={loadingPastTests}
            >
              <option value="">
                {loadingPastTests ? 'Đang tải danh sách...' : '— Chọn bài kiểm tra cũ —'}
              </option>
              {pastTests.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.class?.name || 'Không rõ lớp'}) - {t.test_date}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Chế độ AI Generation */}
        {creationMode === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'slideUp 0.2s ease-out' }}>
            <div>
              <label style={labelStyle}>Chủ đề câu hỏi (tiếng Anh) *</label>
              <input
                style={inputStyle}
                placeholder="VD: family, animals, school, food, travel..."
                value={aiTopic}
                onChange={e => setAiTopic(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Phạm vi kỹ năng</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={aiSkill}
                  onChange={e => setAiSkill(e.target.value as any)}
                >
                  <option value="all">Tổng hợp (Tất cả kỹ năng)</option>
                  <option value="reading">Reading (Đọc hiểu)</option>
                  <option value="listening">Listening (Nghe hiểu)</option>
                  <option value="speaking">Speaking (Phát âm/Nói)</option>
                  <option value="writing">Writing (Viết câu)</option>
                  <option value="general">Vocabulary & Grammar</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Số lượng câu hỏi</label>
                <input
                  style={inputStyle}
                  type="number"
                  min="5"
                  max="20"
                  value={aiCount}
                  onChange={e => setAiCount(Number(e.target.value) || 10)}
                />
              </div>
            </div>
          </div>
        )}

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
          <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button
            variant="primary"
            icon="check"
            onClick={handleSave}
            disabled={!isValid || saving}
          >
            {saving
              ? (creationMode === 'clone'
                  ? 'Đang sao chép câu hỏi...'
                  : creationMode === 'ai'
                    ? 'Đang sinh câu hỏi bằng AI...'
                    : 'Đang tạo...')
              : 'Tạo bài kiểm tra'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
