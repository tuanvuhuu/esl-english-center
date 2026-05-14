import React, { useState, useEffect } from 'react'
import { Modal, Button, Badge } from '../../../components'
import type { DbTest, DbTestResult } from '../../../types/database'
import { generateStudentFeedback } from '../aiInsights'

interface ScoreEntryModalProps {
  open: boolean
  onClose: () => void
  test: DbTest
  studentName: string
  existing: DbTestResult | null
  onSave: (payload: Partial<DbTestResult>) => Promise<void>
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
  textAlign: 'center',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-3)',
  marginBottom: 5,
  display: 'block',
  textAlign: 'center',
}

function computeTotal(r: number | null, l: number | null, s: number | null, w: number | null): number | null {
  const vals = [r, l, s, w].filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

export const ScoreEntryModal: React.FC<ScoreEntryModalProps> = ({
  open, onClose, test, studentName, existing, onSave, saving,
}) => {
  const [reading,   setReading]   = useState('')
  const [listening, setListening] = useState('')
  const [speaking,  setSpeaking]  = useState('')
  const [writing,   setWriting]   = useState('')
  const [total,     setTotal]     = useState('')
  const [feedback,  setFeedback]  = useState('')
  const [aiPreview, setAiPreview] = useState('')

  useEffect(() => {
    if (open) {
      setReading(existing?.score_reading   != null ? String(existing.score_reading)   : '')
      setListening(existing?.score_listening != null ? String(existing.score_listening) : '')
      setSpeaking(existing?.score_speaking  != null ? String(existing.score_speaking)  : '')
      setWriting(existing?.score_writing   != null ? String(existing.score_writing)   : '')
      setTotal(existing?.total_score       != null ? String(existing.total_score)     : '')
      setFeedback(existing?.teacher_feedback ?? '')
      setAiPreview('')
    }
  }, [open, existing])

  // Auto-compute total when skill scores change
  useEffect(() => {
    const r = reading   ? Number(reading)   : null
    const l = listening ? Number(listening) : null
    const s = speaking  ? Number(speaking)  : null
    const w = writing   ? Number(writing)   : null
    const computed = computeTotal(r, l, s, w)
    if (computed !== null) setTotal(String(computed))
  }, [reading, listening, speaking, writing])

  const numOrNull = (v: string) => v.trim() !== '' ? Number(v) : null

  const totalNum = numOrNull(total)
  const isPassed = totalNum !== null ? totalNum >= test.pass_threshold : null

  const handleGenerateFeedback = () => {
    const mockResult: DbTestResult = {
      id: '',
      test_id: test.id,
      student_id: '',
      score_reading:   numOrNull(reading),
      score_listening: numOrNull(listening),
      score_speaking:  numOrNull(speaking),
      score_writing:   numOrNull(writing),
      total_score:     totalNum,
      is_passed:       isPassed,
      teacher_feedback: null,
      ai_feedback: null,
      is_deleted: false,
      created_at: '',
      created_by: null,
      updated_at: '',
      updated_by: null,
      student: { id: '', full_name: studentName, level: null, status: 'active' },
    }
    setAiPreview(generateStudentFeedback(mockResult, test))
  }

  const handleSave = async () => {
    const totalVal = totalNum
    await onSave({
      score_reading:    numOrNull(reading),
      score_listening:  numOrNull(listening),
      score_speaking:   numOrNull(speaking),
      score_writing:    numOrNull(writing),
      total_score:      totalVal,
      is_passed:        totalVal !== null ? totalVal >= test.pass_threshold : null,
      teacher_feedback: feedback.trim() || null,
      ai_feedback:      aiPreview || null,
    })
    onClose()
  }

  const scoreField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        style={inputStyle}
        type="number"
        min="0"
        max="100"
        placeholder="—"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title={`Nhập điểm — ${studentName}`} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Skill scores */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 10 }}>
            Điểm theo kỹ năng (0–100)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            {scoreField('Đọc',  reading,   setReading)}
            {scoreField('Nghe', listening, setListening)}
            {scoreField('Nói',  speaking,  setSpeaking)}
            {scoreField('Viết', writing,   setWriting)}
          </div>
        </div>

        {/* Total */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...labelStyle, textAlign: 'left' }}>Tổng điểm</label>
            <input
              style={{ ...inputStyle, textAlign: 'left', fontWeight: 700, fontSize: 16 }}
              type="number"
              min="0"
              max="100"
              placeholder="0–100"
              value={total}
              onChange={e => setTotal(e.target.value)}
            />
          </div>
          {isPassed !== null && (
            <div style={{ paddingTop: 20 }}>
              <Badge variant={isPassed ? 'success' : 'error'}>
                {isPassed ? '✓ Đạt' : '✗ Chưa đạt'}
              </Badge>
            </div>
          )}
        </div>

        {/* Teacher feedback */}
        <div>
          <label style={{ ...labelStyle, textAlign: 'left' }}>Nhận xét của giáo viên</label>
          <textarea
            style={{
              ...inputStyle,
              textAlign: 'left',
              height: 72,
              padding: '8px 12px',
              resize: 'none',
            }}
            placeholder="Nhận xét về tiến độ học, điểm mạnh/yếu..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          />
        </div>

        {/* AI Feedback */}
        <div style={{
          background: 'var(--hover-bg)',
          borderRadius: 12,
          padding: 14,
          border: '1px solid var(--border-light)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: aiPreview ? 10 : 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
              ✨ Phân tích AI
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateFeedback}
              disabled={totalNum === null}
            >
              Tạo phân tích
            </Button>
          </div>
          {aiPreview && (
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
              {aiPreview}
            </p>
          )}
          {!aiPreview && (
            <p style={{ fontSize: 12, color: 'var(--text-4)', margin: '8px 0 0' }}>
              Nhập điểm rồi nhấn "Tạo phân tích" để nhận nhận xét tự động.
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button
            variant="primary"
            icon="check"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu điểm'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
