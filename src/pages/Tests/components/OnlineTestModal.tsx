import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button, Icon, Badge } from '../../../components'
import { getTestQuestions, upsertTestResult, uploadStudentAudioForQuestion } from '../../../services/tests'
import { getEnrollmentsByClass } from '../../../services/classes'
import type { DbTest, DbTestQuestion, DbTestResult } from '../../../types/database'
import { AudioRecorder } from './AudioRecorder'

interface Props {
  open: boolean
  onClose: () => void
  test: DbTest | null
}

type Phase = 'pick-student' | 'instructions' | 'taking' | 'done'

interface Student { id: string; full_name: string; level: string | null }

export const OnlineTestModal: React.FC<Props> = ({ open, onClose, test }) => {
  const [phase, setPhase]         = useState<Phase>('pick-student')
  const [students, setStudents]   = useState<Student[]>([])
  const [studentId, setStudentId] = useState<string>('')
  const [questions, setQuestions] = useState<DbTestQuestion[]>([])
  const [answers, setAnswers]     = useState<Record<string, string>>({})  // qId → optionId or text
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft]   = useState(0)
  const [loading, setLoading]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultScore, setResultScore] = useState<number | null>(null)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Immediate feedback state
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [feedbackAnswer, setFeedbackAnswer] = useState<string>('')
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load students + questions when modal opens
  useEffect(() => {
    if (!open || !test) return
    setPhase('pick-student')
    setStudentId('')
    setAnswers({})
    setCurrentIdx(0)
    setResultScore(null)
    setTabSwitchCount(0)
    setLoading(true)

    Promise.all([
      getEnrollmentsByClass(test.class_id),
      getTestQuestions(test.id),
    ]).then(([enrollments, qs]) => {
      setStudents((enrollments as any[]).filter(e => e.student).map(e => e.student))
      setQuestions(qs)
    }).finally(() => setLoading(false))
  }, [open, test])

  // Timer
  useEffect(() => {
    if (phase !== 'taking') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  // Tab switch detection (anti-cheat lite)
  useEffect(() => {
    if (phase !== 'taking') return
    const onVis = () => {
      if (document.hidden) setTabSwitchCount(c => c + 1)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [phase])

  // Anti-cheat threshold check
  useEffect(() => {
    if (phase === 'taking' && tabSwitchCount >= 3) {
      alert("Con đã chuyển tab quá 3 lần. Hệ thống tự động nộp bài thi!")
      handleSubmit()
    }
  }, [tabSwitchCount, phase])

  // Auto-save progress
  useEffect(() => {
    if (phase !== 'taking' || !test || !studentId) return
    const savedKey = `online_test_${test.id}_${studentId}`
    localStorage.setItem(savedKey, JSON.stringify({ answers, timeLeft }))
  }, [answers, timeLeft, phase, test, studentId])

  const clearSavedProgress = () => {
    if (test && studentId) {
      localStorage.removeItem(`online_test_${test.id}_${studentId}`)
    }
  }

  const startTest = () => {
    if (!studentId || !test) return
    const savedKey = `online_test_${test.id}_${studentId}`
    const saved = localStorage.getItem(savedKey)
    if (saved) {
      try {
        const { answers: savedAnswers, timeLeft: savedTime } = JSON.parse(saved)
        setAnswers(savedAnswers || {})
        setTimeLeft(savedTime || (questions.length * 60))
      } catch (e) {
        setTimeLeft(questions.length * 60)
        setAnswers({})
      }
    } else {
      setTimeLeft(questions.length * 60)
      setAnswers({})
    }
    setPhase('taking')
  }

  // Check if selected option is correct
  const checkIfCorrect = (q: DbTestQuestion, optionId: string): boolean => {
    const opts = (q as any).options as { id: string; is_correct: boolean }[] | undefined
    if (!opts || opts.length === 0) return false
    return !!opts.find(o => o.id === optionId)?.is_correct
  }

  // MCQ: show instant feedback then auto-advance after 1.8s
  const handleMcqAnswer = (qId: string, optionId: string) => {
    if (feedback !== null) return  // locked while showing feedback
    const q = questions.find(q => q.id === qId)
    if (!q) return
    setAnswers(prev => ({ ...prev, [qId]: optionId }))
    setFeedbackAnswer(optionId)
    setFeedback(checkIfCorrect(q, optionId) ? 'correct' : 'wrong')
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null)
      setFeedbackAnswer('')
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(i => i + 1)
      } else {
        handleSubmit()
      }
    }, 1800)
  }

  // Non-MCQ (textarea / audio): plain update
  const handleAnswer = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }))
  }

  const computeScore = (): { raw: number; scaled: number; bySkill: Record<string, number>; maxBySkill: Record<string, number>; hasNonMcq: boolean } => {
    let earned = 0
    const bySkill: Record<string, number> = {}
    const maxBySkill: Record<string, number> = {}
    let hasNonMcq = false

    for (const q of questions) {
      const opts = (q as any).options as { id: string; is_correct: boolean }[] | undefined
      const skill = q.skill || 'general'
      maxBySkill[skill] = (maxBySkill[skill] || 0) + q.points

      if (!opts || opts.length === 0) {
        hasNonMcq = true
        continue // Non-MCQ: cần giáo viên chấm tay sau
      }

      const answerId = answers[q.id]
      if (answerId && opts.find(o => o.id === answerId)?.is_correct) {
        earned += q.points
        bySkill[skill] = (bySkill[skill] || 0) + q.points
      }
    }

    const totalPossible = questions.reduce((s, q) => s + q.points, 0)
    return {
      raw: earned,
      scaled: totalPossible > 0 ? Math.round((earned / totalPossible) * 100) : 0,
      bySkill,
      maxBySkill,
      hasNonMcq,
    }
  }

  const handleSubmit = async () => {
    if (!test || !studentId) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSubmitting(true)
    try {
      const result = computeScore()
      const hasNonMcq = result.hasNonMcq
      const gradingStatus = hasNonMcq ? 'pending' : 'graded'
      const isPassed = hasNonMcq ? null : result.raw >= test.pass_threshold
      const totalScore = hasNonMcq ? null : result.raw

      // Tính điểm từng kỹ năng (scale theo trọng số max của kỹ năng đó)
      const skillScore = (skill: string): number | null => {
        const max = result.maxBySkill[skill]
        if (!max) return null
        const earned = result.bySkill[skill] || 0
        const skillHasNonMcq = questions.some(q => q.skill === skill && (!q.options || q.options.length === 0))
        if (skillHasNonMcq) return null
        return Math.round((earned / max) * 100)
      }

      await upsertTestResult({
        test_id:          test.id,
        student_id:       studentId,
        total_score:      totalScore,
        is_passed:        isPassed,
        score_reading:    skillScore('reading'),
        score_listening:  skillScore('listening'),
        score_speaking:   skillScore('speaking'),
        score_writing:    skillScore('writing'),
        answers:          answers,
        grading_status:   gradingStatus,
      } as Partial<DbTestResult>)

      clearSavedProgress()
      setResultScore(totalScore)
      setPhase('done')
    } catch (err: any) {
      console.error(err)
      alert('Nộp bài lỗi: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  }

  const currentQ = questions[currentIdx]
  const answered = Object.keys(answers).length

  const content = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--card)',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
            {test?.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {test?.class?.name} · Chế độ làm bài trực tuyến
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {phase === 'taking' && (
            <>
              <div style={{
                fontFamily: 'monospace', fontSize: 18, fontWeight: 700,
                padding: '6px 14px', borderRadius: 8,
                background: timeLeft < 60 ? 'var(--error-light)' : 'var(--hover-bg)',
                color: timeLeft < 60 ? 'var(--error)' : 'var(--text-1)',
              }}>
                <Icon name="clock" size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                {fmtTime(timeLeft)}
              </div>
              <Badge variant="info">
                Đã trả lời: {answered}/{questions.length}
              </Badge>
              {tabSwitchCount > 0 && (
                <Badge variant="warning">
                  ⚠️ Chuyển tab {tabSwitchCount}x
                </Badge>
              )}
            </>
          )}
          {(phase === 'pick-student' || phase === 'done') && (
            <Button variant="ghost" icon="x" onClick={onClose} size="sm">Đóng</Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>
        ) : phase === 'pick-student' ? (
          <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
            <Icon name="user" size={48} style={{ color: 'var(--primary)', display: 'block', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Chào con! Con tên là gì?</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
              Chọn tên của con trong danh sách bên dưới để bắt đầu làm bài
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10,
              maxHeight: 400, overflowY: 'auto', padding: 8,
            }}>
              {students.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStudentId(s.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: `2px solid ${studentId === s.id ? 'var(--primary)' : 'var(--border)'}`,
                    background: studentId === s.id ? 'var(--primary-light)' : 'var(--card)',
                    color: studentId === s.id ? 'var(--primary)' : 'var(--text-1)',
                    fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {s.full_name}
                </button>
              ))}
            </div>

            {studentId && (
              <Button
                variant="primary"
                onClick={() => setPhase('instructions')}
                style={{ marginTop: 24 }}
                icon="chevron-right"
              >
                Tiếp tục
              </Button>
            )}
          </div>
        ) : phase === 'instructions' ? (
          <div style={{ maxWidth: 600, margin: '40px auto' }}>
            <Icon name="alert" size={48} style={{ color: 'var(--warning-dark)', display: 'block', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 16 }}>Hướng dẫn</h2>
            <div style={{
              padding: 20, borderRadius: 12,
              background: 'var(--hover-bg)', fontSize: 14, lineHeight: 1.8,
            }}>
              <p>📝 <strong>{questions.length} câu hỏi</strong>, mỗi câu có 1 phút.</p>
              <p>⏰ Tổng thời gian: <strong>{fmtTime(questions.length * 60)}</strong>.</p>
              <p>🎯 Tổng điểm bài thi: <strong>{test?.total_score ?? 100} điểm</strong>.</p>
              <p>💡 Đọc kỹ câu hỏi, chọn đáp án đúng nhất.</p>
              <p>⚠️ Không được chuyển sang tab khác trong khi làm bài!</p>
              <p>🎯 Nhớ kiểm tra lại các câu trả lời trước khi nộp.</p>
              {(() => {
                const nonMcqCount = questions.filter(q => {
                  const opts = (q as any).options
                  return !opts || opts.length === 0
                }).length
                return nonMcqCount > 0 ? (
                  <p style={{ color: 'var(--warning-dark)', fontWeight: 600 }}>
                    📋 Lưu ý: Có {nonMcqCount} câu tự luận/điền từ sẽ được cô chấm riêng sau.
                  </p>
                ) : null
              })()}
            </div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button variant="primary" size="lg" icon="check" onClick={startTest}>
                Sẵn sàng — Bắt đầu!
              </Button>
            </div>
          </div>
        ) : phase === 'taking' ? (
          currentQ && (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {/* Progress */}
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  height: 8, borderRadius: 4, background: 'var(--border)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${((currentIdx + 1) / questions.length) * 100}%`,
                    background: 'var(--primary)',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                  Câu {currentIdx + 1} / {questions.length}
                </div>
              </div>

              {/* Question */}
              <div style={{
                padding: 24, borderRadius: 16,
                background: 'var(--card)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 16 }}>
                  {currentQ.question_text}
                </div>

                {currentQ.image_url && (
                  <img src={currentQ.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, marginBottom: 16 }} />
                )}

                {/* Options / Input */}
                {(currentQ as any).options && (currentQ as any).options.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(currentQ as any).options.map((opt: any, i: number) => {
                      const isThisSelected = feedbackAnswer === opt.id && feedback !== null
                      const wasPrevSelected = answers[currentQ.id] === opt.id && feedback === null
                      const isCorrectOpt = !!(opt as any).is_correct
                      // Colours
                      let border = 'var(--border)'
                      let bg = 'var(--card)'
                      let dotBg = 'var(--hover-bg)'
                      let dotColor = 'var(--text-3)'
                      if (feedback !== null) {
                        if (isThisSelected && feedback === 'correct') {
                          border = '#22c55e'; bg = '#f0fdf4'; dotBg = '#22c55e'; dotColor = '#fff'
                        } else if (isThisSelected && feedback === 'wrong') {
                          border = '#ef4444'; bg = '#fef2f2'; dotBg = '#ef4444'; dotColor = '#fff'
                        } else if (!isThisSelected && isCorrectOpt && feedback === 'wrong') {
                          border = '#22c55e'; bg = '#f0fdf4'; dotBg = '#22c55e'; dotColor = '#fff'
                        }
                      } else if (wasPrevSelected) {
                        border = 'var(--primary)'; bg = 'var(--primary-light)'; dotBg = 'var(--primary)'; dotColor = '#fff'
                      }
                      const dotLabel = feedback !== null && isThisSelected
                        ? (feedback === 'correct' ? '✓' : '✗')
                        : feedback !== null && !isThisSelected && isCorrectOpt && feedback === 'wrong'
                          ? '✓'
                          : String.fromCharCode(65 + i)
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleMcqAnswer(currentQ.id, opt.id)}
                          disabled={feedback !== null}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '13px 16px', borderRadius: 12,
                            border: `2px solid ${border}`,
                            background: bg, color: 'var(--text-1)',
                            fontSize: 14, textAlign: 'left',
                            cursor: feedback !== null ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: dotBg, color: dotColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 13, flexShrink: 0,
                            transition: 'all 0.2s ease',
                          }}>
                            {dotLabel}
                          </div>
                          <span style={{ flex: 1 }}>{opt.option_text}</span>
                        </button>
                      )
                    })}

                    {/* Immediate feedback banner */}
                    {feedback !== null && (
                      <div style={{
                        marginTop: 4, padding: '14px 18px', borderRadius: 12,
                        background: feedback === 'correct' ? '#f0fdf4' : '#fef2f2',
                        border: `2px solid ${feedback === 'correct' ? '#22c55e' : '#ef4444'}`,
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                      }}>
                        <span style={{ fontSize: 22, lineHeight: 1 }}>
                          {feedback === 'correct' ? '🎉' : '💡'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 700, fontSize: 14,
                            color: feedback === 'correct' ? '#15803d' : '#b91c1c',
                            marginBottom: feedback === 'wrong' && currentQ.explanation ? 4 : 0,
                          }}>
                            {feedback === 'correct' ? 'Chính xác! 🌟' : 'Chưa đúng!'}
                          </div>
                          {feedback === 'wrong' && currentQ.explanation && (
                            <div style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.5 }}>
                              {currentQ.explanation}
                            </div>
                          )}
                          {feedback === 'wrong' && !currentQ.explanation && (
                            <div style={{ fontSize: 13, color: '#7f1d1d' }}>
                              Đáp án đúng đã được đánh dấu màu xanh bên trên.
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', paddingTop: 2 }}>
                          ⏱ tự động chuyển...
                        </div>
                      </div>
                    )}
                  </div>
                ) : currentQ.type === 'speaking_prompt' ? (
                  <div style={{ padding: 12, borderRadius: 10, background: 'var(--hover-bg)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
                      Ghi âm câu trả lời nói của con:
                    </div>
                    <AudioRecorder
                      existingUrl={answers[currentQ.id]}
                      onRecorded={async (blob) => {
                        try {
                          const url = await uploadStudentAudioForQuestion(test!.id, studentId, currentQ.id, blob)
                          handleAnswer(currentQ.id, url)
                        } catch (e: any) {
                          alert('Không thể tải file ghi âm lên: ' + e.message)
                        }
                      }}
                      onRemove={() => handleAnswer(currentQ.id, '')}
                    />
                  </div>
                ) : (
                  <textarea
                    style={{
                      width: '100%', minHeight: 100, padding: 12,
                      borderRadius: 10, border: '1px solid var(--border)',
                      fontSize: 14, fontFamily: 'var(--font)', outline: 'none',
                    }}
                    value={answers[currentQ.id] ?? ''}
                    onChange={e => handleAnswer(currentQ.id, e.target.value)}
                    placeholder="Trả lời..."
                  />
                )}
              </div>

              {/* Navigation — only for textarea/speaking; MCQ auto-advances */}
              {(!(currentQ as any).options || (currentQ as any).options.length === 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 10 }}>
                  <Button
                    variant="secondary" icon="chevron-left"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(i => i - 1)}
                  >
                    Câu trước
                  </Button>
                  {currentIdx < questions.length - 1 ? (
                    <Button variant="primary" icon="chevron-right" onClick={() => setCurrentIdx(i => i + 1)}>
                      Câu tiếp
                    </Button>
                  ) : (
                    <Button variant="primary" icon="check" loading={submitting} onClick={handleSubmit}>
                      Nộp bài
                    </Button>
                  )}
                </div>
              )}

              {/* Question grid */}
              <div style={{
                marginTop: 24, padding: 16, borderRadius: 10,
                background: 'var(--hover-bg)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>
                  Tất cả câu hỏi
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {questions.map((q, i) => {
                    const isAnswered = !!answers[q.id]
                    const isCurrent = i === currentIdx
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(i)}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          cursor: 'pointer',
                          fontWeight: 700, fontSize: 12,
                          background: isCurrent ? 'var(--primary)' : isAnswered ? 'var(--success)' : 'var(--card)',
                          color: isCurrent || isAnswered ? '#fff' : 'var(--text-3)',
                          border: isCurrent ? 'none' : '1px solid var(--border)',
                        }}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        ) : phase === 'done' ? (
          <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center' }}>
            {resultScore !== null ? (
              <>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: (resultScore ?? 0) >= (test?.pass_threshold ?? 60) ? 'var(--success)' : 'var(--warning)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 28, fontWeight: 800,
                  flexDirection: 'column', lineHeight: 1.2,
                }}>
                  <span>{resultScore}</span>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>/ {test?.total_score ?? 100}</span>
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                  Hoàn thành bài kiểm tra!
                </h2>
                <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 8 }}>
                  Cảm ơn con đã làm bài. Cô sẽ nhận xét chi tiết và gửi cho ba mẹ con sớm nhất.
                </p>
                {(resultScore ?? 0) >= (test?.pass_threshold ?? 60) ? (
                  <p style={{ color: 'var(--success)', fontSize: 15, fontWeight: 700, marginBottom: 24 }}>🎉 Đạt!</p>
                ) : (
                  <p style={{ color: 'var(--warning-dark)', fontSize: 15, fontWeight: 700, marginBottom: 24 }}>Cần cố gắng thêm nhé!</p>
                )}
              </>
            ) : (
              <>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%',
                  background: 'var(--info)',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 32,
                  flexDirection: 'column',
                }}>
                  <Icon name="clock" size={36} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                  Đã nộp bài thành công!
                </h2>
                <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                  Bài kiểm tra của con có phần tự luận và nói. Cô sẽ nghe và chấm điểm chi tiết rồi gửi kết quả cho ba mẹ con sớm nhé!
                </p>
              </>
            )}
            <Button variant="primary" onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
