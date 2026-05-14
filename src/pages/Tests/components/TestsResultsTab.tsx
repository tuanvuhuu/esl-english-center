import React, { useMemo, useCallback, useRef, useState } from 'react'
import { Card, Badge, Icon } from '../../../components'
import { TextWithEllipse } from '../../../components/common/TextWithEllipse'
import { useQuery } from '../../../hooks/useSupabase'
import { getEnrollmentsByClass } from '../../../services/classes'
import { getTestResults, upsertTestResult } from '../../../services/tests'
import type { DbTest, DbTestResult } from '../../../types/database'
import { generateStudentFeedback } from '../aiInsights'

const PASS_THRESHOLD_DEFAULT = 60

interface StudentRow {
  studentId: string
  studentName: string
  level: string | null
  result: DbTestResult | null
}

interface Draft {
  score_reading:    string
  score_listening:  string
  score_speaking:   string
  score_writing:    string
  teacher_feedback: string
}

const toDraft = (r: DbTestResult | null): Draft => ({
  score_reading:    r?.score_reading   != null ? String(r.score_reading)   : '',
  score_listening:  r?.score_listening != null ? String(r.score_listening) : '',
  score_speaking:   r?.score_speaking  != null ? String(r.score_speaking)  : '',
  score_writing:    r?.score_writing   != null ? String(r.score_writing)   : '',
  teacher_feedback: r?.teacher_feedback ?? '',
})

const autoTotal = (d: Draft): number | null => {
  const vals = [d.score_reading, d.score_listening, d.score_speaking, d.score_writing]
    .map(v => parseFloat(v))
    .filter(n => !isNaN(n))
  if (vals.length === 0) return null
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
}

function ScoreDisplay({ val }: { val: number | null | undefined }) {
  if (val == null) return <span style={{ color: 'var(--text-4)' }}>—</span>
  const color = val >= 80 ? 'var(--success)' : val >= 60 ? 'var(--warning-dark)' : 'var(--error-dark)'
  return <span style={{ fontWeight: 600, color }}>{val}</span>
}

interface TestsResultsTabProps {
  tests: DbTest[]
  selectedTest: DbTest | null
  onSelectTest: (t: DbTest) => void
}

export const TestsResultsTab: React.FC<TestsResultsTabProps> = ({
  tests, selectedTest, onSelectTest,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft]         = useState<Draft>(toDraft(null))
  const [savingId, setSavingId]   = useState<string | null>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchEnrollments = useCallback(
    () => selectedTest ? getEnrollmentsByClass(selectedTest.class_id) : Promise.resolve([]),
    [selectedTest?.id],
  )
  const { data: enrollments } = useQuery(fetchEnrollments, [selectedTest?.id])

  const fetchResults = useCallback(
    () => selectedTest ? getTestResults(selectedTest.id) : Promise.resolve([]),
    [selectedTest?.id],
  )
  const { data: results, refetch: refetchResults } = useQuery(fetchResults, [selectedTest?.id])

  const rows: StudentRow[] = useMemo(() => {
    if (!enrollments) return []
    const resultMap = new Map<string, DbTestResult>((results ?? []).map(r => [r.student_id, r]))
    return (enrollments as any[])
      .filter(e => e.student)
      .map(e => ({
        studentId:   e.student.id,
        studentName: e.student.full_name,
        level:       e.student.level,
        result:      resultMap.get(e.student.id) ?? null,
      }))
  }, [enrollments, results])

  const stats = useMemo(() => {
    const withScore = rows.filter(r => r.result?.total_score != null)
    if (withScore.length === 0) return null
    const scores = withScore.map(r => r.result!.total_score!)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const passCount = withScore.filter(r => r.result!.is_passed).length
    return { avg: Math.round(avg * 10) / 10, passCount, total: withScore.length }
  }, [rows])

  const threshold = selectedTest?.pass_threshold ?? PASS_THRESHOLD_DEFAULT

  const startEdit = (row: StudentRow) => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setEditingId(row.studentId)
    setDraft(toDraft(row.result))
  }

  const saveEdit = async (studentId: string) => {
    if (!selectedTest || savingId) return
    const total = autoTotal(draft)
    setSavingId(studentId)
    try {
      await upsertTestResult({
        test_id:         selectedTest.id,
        student_id:      studentId,
        score_reading:   draft.score_reading   !== '' ? parseFloat(draft.score_reading)   : null,
        score_listening: draft.score_listening !== '' ? parseFloat(draft.score_listening) : null,
        score_speaking:  draft.score_speaking  !== '' ? parseFloat(draft.score_speaking)  : null,
        score_writing:   draft.score_writing   !== '' ? parseFloat(draft.score_writing)   : null,
        total_score:      total,
        is_passed:        total != null ? total >= threshold : null,
        teacher_feedback: draft.teacher_feedback.trim() || null,
      })
      await refetchResults()
    } finally {
      setSavingId(null)
      setEditingId(null)
    }
  }

  const handleInputFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current)
  }

  const handleInputBlur = (studentId: string) => {
    blurTimer.current = setTimeout(() => saveEdit(studentId), 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent, studentId: string) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(studentId) }
    if (e.key === 'Escape') { setEditingId(null) }
  }

  const setField = (field: keyof Draft, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }))
  }

  const inputStyle: React.CSSProperties = {
    width: 52, height: 28, textAlign: 'center',
    border: '1.5px solid var(--primary)',
    borderRadius: 6, fontSize: 13, fontWeight: 600,
    background: 'var(--primary-light)', color: 'var(--text-1)',
    outline: 'none', fontFamily: 'var(--font)',
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 12px', fontSize: 11, fontWeight: 700,
    color: 'var(--text-3)', textAlign: 'center',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em',
  }
  const tdStyle: React.CSSProperties = {
    padding: '8px 12px', fontSize: 13, textAlign: 'center',
    borderBottom: '1px solid var(--border-light)',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
      {/* Left: test list */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Chọn bài kiểm tra
        </div>
        {tests.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-4)' }}>
            Chưa có bài kiểm tra
          </div>
        )}
        {tests.map(t => (
          <button
            key={t.id}
            onClick={() => { onSelectTest(t); setEditingId(null) }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '12px 16px', background: selectedTest?.id === t.id ? 'var(--primary-light)' : 'transparent',
              border: 'none', borderBottom: '1px solid var(--border-light)',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: selectedTest?.id === t.id ? 'var(--primary)' : 'var(--text-1)', marginBottom: 2 }}>
              {t.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
              {t.class?.name} · {new Date(t.test_date).toLocaleDateString('vi-VN')}
            </div>
          </button>
        ))}
      </Card>

      {/* Right */}
      <div>
        {!selectedTest ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Icon name="clipboard" size={36} style={{ color: 'var(--text-4)', display: 'block', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, color: 'var(--text-3)' }}>Chọn một bài kiểm tra để xem kết quả</div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <Card style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{selectedTest.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    {selectedTest.class?.name} · Ngưỡng đạt: {threshold}/100
                  </div>
                </div>
                {stats && (
                  <div style={{ display: 'flex', gap: 20 }}>
                    {[
                      { label: 'Trung bình', value: stats.avg, color: 'var(--primary)' },
                      { label: 'Tỷ lệ đạt',  value: `${Math.round((stats.passCount / stats.total) * 100)}%`, color: 'var(--success)' },
                      { label: 'Đã có điểm', value: stats.total, color: 'var(--text-1)' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Table */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-4)' }}>
                Click vào ô điểm để chỉnh sửa · Enter để lưu · Esc để hủy
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--hover-bg)' }}>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Học viên</th>
                    <th style={thStyle}>Đọc</th>
                    <th style={thStyle}>Nghe</th>
                    <th style={thStyle}>Nói</th>
                    <th style={thStyle}>Viết</th>
                    <th style={thStyle}>Tổng</th>
                    <th style={thStyle}>Kết quả</th>
                    <th style={{ ...thStyle, textAlign: 'left', minWidth: 200 }}>Nhận xét</th>
                    <th style={{ ...thStyle, width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const isEditing = editingId === row.studentId
                    const isSaving  = savingId  === row.studentId

                    const scoreInput = (field: keyof Draft) => (
                      <input
                        style={inputStyle}
                        type="number"
                        min={0} max={100}
                        value={draft[field]}
                        onChange={e => setField(field, e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={() => handleInputBlur(row.studentId)}
                        onKeyDown={e => handleKeyDown(e, row.studentId)}
                        autoFocus={field === 'score_reading'}
                      />
                    )

                    return (
                      <tr
                        key={row.studentId}
                        style={{
                          background: isEditing ? 'var(--primary-light)' : '',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = 'var(--hover-bg)' }}
                        onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = '' }}
                      >
                        {/* Name */}
                        <td style={{ ...tdStyle, textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13 }}>{row.studentName}</div>
                          {row.level && <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{row.level}</div>}
                        </td>

                        {/* Score cells */}
                        {(['score_reading', 'score_listening', 'score_speaking', 'score_writing'] as const).map(field => (
                          <td
                            key={field}
                            style={{ ...tdStyle, cursor: isEditing ? 'default' : 'pointer' }}
                            onClick={() => !isEditing && startEdit(row)}
                          >
                            {isEditing ? scoreInput(field) : <ScoreDisplay val={row.result?.[field] ?? null} />}
                          </td>
                        ))}

                        {/* Total — readonly, auto-calculated */}
                        <td style={tdStyle}>
                          {isEditing ? (
                            <span style={{
                              fontSize: 14, fontWeight: 800,
                              color: autoTotal(draft) != null ? 'var(--primary)' : 'var(--text-4)',
                            }}>
                              {autoTotal(draft) ?? '—'}
                            </span>
                          ) : (
                            row.result?.total_score != null
                              ? <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{row.result.total_score}</span>
                              : <span style={{ color: 'var(--text-4)' }}>—</span>
                          )}
                        </td>

                        {/* Pass/fail */}
                        <td style={tdStyle}>
                          {row.result?.is_passed != null ? (
                            <Badge variant={row.result.is_passed ? 'success' : 'error'}>
                              {row.result.is_passed ? 'Đạt' : 'Chưa đạt'}
                            </Badge>
                          ) : (
                            <span style={{ color: 'var(--text-4)', fontSize: 12 }}>Chưa nhập</span>
                          )}
                        </td>

                        {/* Feedback */}
                        <td
                          style={{ ...tdStyle, textAlign: 'left', cursor: isEditing ? 'default' : 'pointer', maxWidth: 260 }}
                          onClick={() => !isEditing && startEdit(row)}
                        >
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  onMouseDown={e => {
                                    e.preventDefault()
                                    if (!selectedTest) return
                                    const fb = generateStudentFeedback(
                                      {
                                        ...row.result,
                                        score_reading:   draft.score_reading   !== '' ? parseFloat(draft.score_reading)   : null,
                                        score_listening: draft.score_listening !== '' ? parseFloat(draft.score_listening) : null,
                                        score_speaking:  draft.score_speaking  !== '' ? parseFloat(draft.score_speaking)  : null,
                                        score_writing:   draft.score_writing   !== '' ? parseFloat(draft.score_writing)   : null,
                                        total_score:     autoTotal(draft),
                                        is_passed:       autoTotal(draft) != null ? (autoTotal(draft)! >= threshold) : null,
                                        student: { id: row.studentId, full_name: row.studentName, level: row.level, status: '' },
                                      } as DbTestResult,
                                      selectedTest
                                    )
                                    setDraft(p => ({ ...p, teacher_feedback: fb }))
                                  }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    fontSize: 11, fontWeight: 600,
                                    padding: '2px 8px', borderRadius: 6,
                                    border: '1px solid var(--primary)',
                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Icon name="zap" size={11} /> Nhận xét nhanh
                                </button>
                              </div>
                              <textarea
                                style={{
                                  width: '100%', minHeight: 64, padding: '6px 8px',
                                  border: '1.5px solid var(--primary)', borderRadius: 6,
                                  fontSize: 12, fontFamily: 'var(--font)',
                                  background: 'var(--card)', color: 'var(--text-1)',
                                  outline: 'none', resize: 'vertical',
                                }}
                                value={draft.teacher_feedback}
                                placeholder="Nhập nhận xét..."
                                onChange={e => setDraft(p => ({ ...p, teacher_feedback: e.target.value }))}
                                onFocus={handleInputFocus}
                                onBlur={() => handleInputBlur(row.studentId)}
                                onKeyDown={e => { if (e.key === 'Escape') setEditingId(null) }}
                              />
                            </div>
                          ) : row.result?.teacher_feedback ? (
                            <TextWithEllipse
                              text={row.result.teacher_feedback.replace(/\*\*(.+?)\*\*/g, '$1')}
                              lineNumber={2}
                              allowToggleText
                              style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}
                            />
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-4)', fontStyle: 'italic' }}>
                              Chưa có nhận xét
                            </span>
                          )}
                        </td>

                        {/* Edit / status */}
                        <td
                          style={{ ...tdStyle, cursor: isEditing || isSaving ? 'default' : 'pointer' }}
                          onClick={() => !isEditing && !isSaving && startEdit(row)}
                        >
                          {isSaving ? (
                            <Icon name="loader" size={14} style={{ color: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
                          ) : isEditing ? (
                            <Icon name="check" size={14} style={{ color: 'var(--success)' }} />
                          ) : (
                            <Icon name="edit" size={14} style={{ color: 'var(--text-4)' }} className="row-edit-icon" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
                        Lớp chưa có học viên đăng ký
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
