import React, { useState, useEffect } from 'react'
import { Modal, Button, Badge, useToast } from '../../../components'
import { getTestQuestions, upsertTestResult } from '../../../services/tests'
import type { DbTest, DbTestQuestion, DbTestResult, DbQuestionOption } from '../../../types/database'

interface StudentRow {
  studentId: string
  studentName: string
  level: string | null
  result: DbTestResult | null
}

interface GradingModalProps {
  open: boolean
  onClose: () => void
  test: DbTest
  studentRow: StudentRow
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px', fontSize: 11, fontWeight: 700,
  color: 'var(--text-3)', textAlign: 'left',
  borderBottom: '1px solid var(--border)',
}
const tdStyle: React.CSSProperties = {
  padding: '12px', fontSize: 13,
  borderBottom: '1px solid var(--border-light)',
}

const SKILL_LABELS: Record<string, string> = {
  reading: 'Đọc', listening: 'Nghe', speaking: 'Nói', writing: 'Viết', general: 'Tổng hợp'
}

export const GradingModal: React.FC<GradingModalProps> = ({
  open,
  onClose,
  test,
  studentRow
}) => {
  const toast = useToast()
  const [questions, setQuestions] = useState<DbTestQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Local state for question scores (qId -> string value of score)
  const [scores, setScores] = useState<Record<string, string>>({})
  // Teacher comments per question (qId -> comment string)
  const [comments, setComments] = useState<Record<string, string>>({})
  
  // Student's original answers JSON
  const studentAnswers = studentRow.result?.answers || {}

  useEffect(() => {
    if (open && test.id) {
      setLoading(true)
      getTestQuestions(test.id)
        .then(qs => {
          setQuestions(qs)
          
          // Initialize scores
          const initialScores: Record<string, string> = {}
          qs.forEach(q => {
            const isMcq = q.options && q.options.length > 0
            if (isMcq) {
              // MCQ: auto-grade
              const opts = q.options as DbQuestionOption[]
              const studentChoice = studentAnswers[q.id]
              const correctOpt = opts.find(o => o.is_correct)
              const isCorrect = studentChoice && correctOpt && studentChoice === correctOpt.id
              initialScores[q.id] = isCorrect ? String(q.points) : '0'
            } else {
              // Essay/Speaking: read from saved _score_qId, default to '0'
              const savedScore = studentAnswers[`_score_${q.id}`]
              initialScores[q.id] = savedScore !== undefined ? String(savedScore) : '0'
            }
          })
          setScores(initialScores)

          // Initialize comments from saved _comment_qId keys
          const initialComments: Record<string, string> = {}
          qs.forEach(q => {
            const saved = studentAnswers[`_comment_${q.id}`]
            if (saved) initialComments[q.id] = String(saved)
          })
          setComments(initialComments)
        })
        .catch(err => {
          console.error(err)
          toast.error('Lỗi khi tải câu hỏi bài thi.')
        })
        .finally(() => setLoading(false))
    }
  }, [open, test.id])

  const handleScoreChange = (qId: string, maxPoints: number, val: string) => {
    let num = parseFloat(val)
    if (isNaN(num)) {
      setScores(prev => ({ ...prev, [qId]: '' }))
      return
    }
    if (num < 0) num = 0
    if (num > maxPoints) num = maxPoints
    setScores(prev => ({ ...prev, [qId]: String(num) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Calculate totals and skill breakdown
      const bySkillEarned: Record<string, number> = {}
      const bySkillMax: Record<string, number> = {}
      let totalEarned = 0

      questions.forEach(q => {
        const skill = q.skill || 'general'
        const qMax = q.points || 0
        const qEarned = parseFloat(scores[q.id]) || 0

        bySkillMax[skill] = (bySkillMax[skill] || 0) + qMax
        bySkillEarned[skill] = (bySkillEarned[skill] || 0) + qEarned
        totalEarned += qEarned
      })

      // Compile updated answers with scores + comments embedded
      const updatedAnswers = { ...studentAnswers }
      questions.forEach(q => {
        const isMcq = q.options && q.options.length > 0
        if (!isMcq) {
          updatedAnswers[`_score_${q.id}`] = scores[q.id] || '0'
          if (comments[q.id]?.trim()) {
            updatedAnswers[`_comment_${q.id}`] = comments[q.id].trim()
          }
        }
      })

      // Calculate skill score percentages (0-100)
      const getSkillPercent = (skill: string): number | null => {
        const max = bySkillMax[skill]
        if (!max) return null
        const earned = bySkillEarned[skill] || 0
        return Math.round((earned / max) * 100)
      }

      await upsertTestResult({
        test_id:          test.id,
        student_id:       studentRow.studentId,
        total_score:      Math.round(totalEarned * 10) / 10,
        is_passed:        totalEarned >= test.pass_threshold,
        score_reading:    getSkillPercent('reading'),
        score_listening:  getSkillPercent('listening'),
        score_speaking:   getSkillPercent('speaking'),
        score_writing:    getSkillPercent('writing'),
        answers:          updatedAnswers,
        grading_status:   'graded',
      } as Partial<DbTestResult>)

      toast.success('Lưu điểm thành công!')
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi khi lưu điểm: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const overallTotal = questions.reduce((sum, q) => sum + (parseFloat(scores[q.id]) || 0), 0)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chấm bài thi: ${studentRow.studentName}`}
      width={800}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{test.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            Trình độ: {studentRow.level || 'A1'} · Ngưỡng đạt: {test.pass_threshold}/{test.total_score} điểm
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Đang tải câu hỏi...</div>
        ) : (
          <>
            <div style={{ maxHeight: '55vh', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--hover-bg)' }}>
                    <th style={{ ...thStyle, width: 60 }}>Câu</th>
                    <th style={{ ...thStyle, width: 90 }}>Kỹ năng</th>
                    <th style={thStyle}>Đề bài & Bài làm</th>
                    <th style={{ ...thStyle, width: 120, textAlign: 'center' }}>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, idx) => {
                    const isMcq = q.options && q.options.length > 0
                    const studentAnswer = studentAnswers[q.id] || ''
                    const isAudio = studentAnswer.startsWith('http') && studentAnswer.includes('audio')

                    return (
                      <tr key={q.id}>
                        {/* Question index */}
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{idx + 1}</span>
                        </td>
                        
                        {/* Skill badge */}
                        <td style={tdStyle}>
                          <Badge variant={q.skill === 'speaking' ? 'primary' : q.skill === 'writing' ? 'error' : q.skill === 'reading' ? 'info' : 'success'}>
                            {SKILL_LABELS[q.skill] || q.skill}
                          </Badge>
                        </td>

                        {/* Content & Answer */}
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
                            {q.question_text}
                          </div>
                          {q.image_url && (
                            <img src={q.image_url} alt="" style={{ maxHeight: 100, borderRadius: 6, marginBottom: 8, display: 'block' }} />
                          )}
                          
                          {/* Student answer rendering */}
                          <div style={{
                            padding: '8px 12px',
                            background: 'var(--hover-bg)',
                            borderRadius: 8,
                            border: '1px solid var(--border-light)',
                            fontSize: 12,
                          }}>
                            {isMcq ? (
                              <div>
                                <span style={{ color: 'var(--text-3)' }}>Đã chọn: </span>
                                {(() => {
                                  const opts = q.options as DbQuestionOption[]
                                  const selectedOpt = opts.find(o => o.id === studentAnswer)
                                  const correctOpt = opts.find(o => o.is_correct)
                                  
                                  if (!selectedOpt) return <span style={{ fontStyle: 'italic', color: 'var(--text-4)' }}>Không trả lời</span>
                                  const isCorrect = selectedOpt.is_correct
                                  return (
                                    <span style={{ fontWeight: 600, color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                                      {selectedOpt.option_text} {isCorrect ? '✅ (Đúng)' : `❌ (Sai - Đáp án đúng: ${correctOpt?.option_text})`}
                                    </span>
                                  )
                                })()}
                              </div>
                            ) : isAudio ? (
                              <div>
                                <div style={{ color: 'var(--text-3)', marginBottom: 4 }}>Bài ghi âm nói:</div>
                                <audio controls src={studentAnswer} style={{ height: 32, width: '100%' }} />
                              </div>
                            ) : studentAnswer ? (
                              <div>
                                <div style={{ color: 'var(--text-3)', marginBottom: 4 }}>Bài làm tự luận:</div>
                                <div style={{ color: 'var(--text-1)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                  {studentAnswer}
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontStyle: 'italic', color: 'var(--text-4)' }}>Không trả lời</span>
                            )}
                          </div>
                        </td>

                        {/* Input Score */}
                        <td style={{ ...tdStyle, textAlign: 'center', verticalAlign: 'top', width: 160 }}>
                          {isMcq ? (
                            <div style={{ fontSize: 14, fontWeight: 700, color: parseFloat(scores[q.id]) > 0 ? 'var(--success)' : 'var(--text-4)' }}>
                              {scores[q.id]} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)' }}>/ {q.points}đ</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                              {/* Quick score buttons: 0 | half | full */}
                              <div style={{ display: 'flex', gap: 4 }}>
                                {([
                                  { label: '0', val: 0, color: '#ef4444', bg: '#fef2f2' },
                                  { label: '1/2', val: q.points / 2, color: '#f59e0b', bg: '#fffbeb' },
                                  { label: 'Full', val: q.points, color: '#22c55e', bg: '#f0fdf4' },
                                ] as { label: string; val: number; color: string; bg: string }[]).map(btn => {
                                  const isActive = parseFloat(scores[q.id]) === btn.val
                                  return (
                                    <button
                                      key={btn.label}
                                      onClick={() => setScores(prev => ({ ...prev, [q.id]: String(btn.val) }))}
                                      style={{
                                        padding: '3px 7px', borderRadius: 6,
                                        border: `1.5px solid ${isActive ? btn.color : 'var(--border)'}`,
                                        background: isActive ? btn.bg : 'var(--card)',
                                        color: isActive ? btn.color : 'var(--text-3)',
                                        fontWeight: 700, fontSize: 11, cursor: 'pointer',
                                        transition: 'all 0.15s',
                                      }}
                                    >
                                      {btn.label}
                                    </button>
                                  )
                                })}
                              </div>
                              {/* Manual number input */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                  type="number" step="0.5" min={0} max={q.points}
                                  style={{
                                    width: 46, height: 26, textAlign: 'center',
                                    border: '1.5px solid var(--primary)', borderRadius: 6,
                                    fontSize: 13, fontWeight: 700, outline: 'none'
                                  }}
                                  value={scores[q.id] || ''}
                                  onChange={e => handleScoreChange(q.id, q.points, e.target.value)}
                                />
                                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>/{q.points}đ</span>
                              </div>
                              {/* Teacher comment */}
                              <textarea
                                placeholder="Nhận xét cho học sinh..."
                                value={comments[q.id] || ''}
                                onChange={e => setComments(prev => ({ ...prev, [q.id]: e.target.value }))}
                                style={{
                                  width: 140, minHeight: 52, padding: '5px 8px',
                                  fontSize: 11, fontFamily: 'var(--font)', lineHeight: 1.4,
                                  border: '1px solid var(--border)', borderRadius: 6,
                                  outline: 'none', resize: 'vertical',
                                  color: 'var(--text-1)', background: 'var(--input-bg)',
                                }}
                                onFocus={e => { e.target.style.borderColor = 'var(--primary)' }}
                                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Points summary footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 18px', background: 'var(--hover-bg)', borderRadius: 12,
              border: '1px solid var(--border)',
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Tổng điểm đạt được: </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: overallTotal >= test.pass_threshold ? 'var(--success)' : 'var(--error)' }}>
                  {overallTotal.toFixed(1)} / {test.total_score}
                </span>
                <span style={{ marginLeft: 8 }}>
                  <Badge variant={overallTotal >= test.pass_threshold ? 'success' : 'error'}>
                    {overallTotal >= test.pass_threshold ? 'ĐẠT' : 'CHƯA ĐẠT'}
                  </Badge>
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
                <Button variant="primary" icon="check" onClick={handleSave} loading={saving}>Lưu kết quả chấm</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
