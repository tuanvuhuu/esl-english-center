import React, { useMemo, useCallback, useRef, useState } from 'react'
import { Card, Badge, Icon, Button, Modal, useConfirm, useToast } from '../../../components'
import { TextWithEllipse } from '../../../components/common/TextWithEllipse'
import { useQuery } from '../../../hooks/useSupabase'
import { getEnrollmentsByClass } from '../../../services/classes'
import { getTestResults, upsertTestResult } from '../../../services/tests'
import type { DbTest, DbTestResult } from '../../../types/database'
import { generateStudentFeedback } from '../aiInsights'
import { generateParentReport } from '../parentReport'
import { StudentProgressModal } from './StudentProgressModal'
import { ImportScoresModal } from './ImportScoresModal'
import { AudioRecorder } from './AudioRecorder'
import { uploadStudentAudio } from '../../../services/tests'
import { GradingModal } from './GradingModal'

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
  // Tổng điểm = trung bình các kỹ năng đã nhập điểm
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
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
  const confirm = useConfirm()
  const toast = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft]         = useState<Draft>(toDraft(null))
  const [savingId, setSavingId]   = useState<string | null>(null)
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkDone, setBulkDone]   = useState(0)
  const [gradingStudent, setGradingStudent] = useState<StudentRow | null>(null)
  const [progressStudent, setProgressStudent] = useState<{ id: string; name: string } | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [audioStudent, setAudioStudent] = useState<StudentRow | null>(null)
  const [uploadingAudio, setUploadingAudio] = useState(false)

  const handleExportReport = async (row: StudentRow) => {
    if (!selectedTest || !row.result || row.result.total_score == null) {
      toast.warning('Học sinh chưa có điểm để xuất báo cáo.')
      return
    }
    const fb = row.result.teacher_feedback || generateStudentFeedback(
      { ...row.result, student: { id: row.studentId, full_name: row.studentName, level: row.level, status: '' } } as DbTestResult,
      selectedTest
    )
    try {
      const { blobUrl, fileName } = await generateParentReport({
        test: selectedTest,
        studentName: row.studentName,
        level: row.level,
        result: row.result,
        classAvg: stats?.avg ?? null,
        feedback: fb,
      })
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      a.click()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (err: any) {
      console.error(err)
      toast.error('Lỗi khi xuất PDF cho ' + row.studentName)
    }
  }

  const handleBulkExport = async () => {
    if (!selectedTest) return
    const targets = rows.filter(r => r.result?.total_score != null)
    if (targets.length === 0) { toast.warning('Chưa có học sinh nào có điểm.'); return }
    const ok = await confirm({
      title: 'Xuất báo cáo hàng loạt',
      message: `Xuất ${targets.length} báo cáo PDF gửi phụ huynh?`,
      confirmLabel: 'Xuất PDF',
      variant: 'primary',
    })
    if (!ok) return
    targets.forEach((row, i) => setTimeout(() => handleExportReport(row), i * 300))
    toast.success(`Đang xuất ${targets.length} báo cáo...`)
  }
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

  const handleBulkAi = async () => {
    if (!selectedTest) return
    const targets = rows.filter(r => r.result?.total_score != null && !r.result?.teacher_feedback)
    if (targets.length === 0) {
      toast.info('Tất cả học sinh có điểm đã có nhận xét rồi.')
      return
    }
    const ok = await confirm({
      title: 'Nhận xét AI cả lớp',
      message: `Tạo nhận xét AI cho ${targets.length} học sinh chưa có nhận xét?`,
      confirmLabel: 'Tạo nhận xét',
      variant: 'primary',
    })
    if (!ok) return

    setBulkRunning(true)
    setBulkDone(0)
    try {
      for (const row of targets) {
        const fb = generateStudentFeedback(
          { ...row.result!, student: { id: row.studentId, full_name: row.studentName, level: row.level, status: '' } } as DbTestResult,
          selectedTest
        )
        await upsertTestResult({
          test_id:          selectedTest.id,
          student_id:       row.studentId,
          score_reading:    row.result!.score_reading,
          score_listening:  row.result!.score_listening,
          score_speaking:   row.result!.score_speaking,
          score_writing:    row.result!.score_writing,
          total_score:      row.result!.total_score,
          is_passed:        row.result!.is_passed,
          teacher_feedback: fb,
        })
        setBulkDone(prev => prev + 1)
      }
      await refetchResults()
    } finally {
      setBulkRunning(false)
      setBulkDone(0)
    }
  }

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
      <Card style={{ padding: '8px 0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
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
              display: 'block',
              width: 'calc(100% - 16px)',
              margin: '4px 8px',
              textAlign: 'left',
              padding: '10px 14px',
              borderRadius: 8,
              background: selectedTest?.id === t.id ? 'var(--sidebar-hover)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              paddingLeft: selectedTest?.id === t.id ? '20px' : '14px',
            }}
          >
            {selectedTest?.id === t.id && (
              <div style={{
                position: 'absolute',
                left: 6,
                top: '20%',
                bottom: '20%',
                width: 3,
                borderRadius: 2,
                background: 'var(--primary)',
              }} />
            )}
            <div style={{ 
              fontSize: 13, 
              fontWeight: 600, 
              color: selectedTest?.id === t.id ? 'var(--primary)' : 'var(--text-1)', 
              marginBottom: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: t.status === 'upcoming' ? 'var(--warning)' : 'var(--success)',
                flexShrink: 0,
              }} title={t.status === 'upcoming' ? 'Sắp diễn ra' : 'Hoàn tất'} />
              <span>{t.name}</span>
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
                    {selectedTest.class?.name} · Ngưỡng đạt: {threshold}/{selectedTest.total_score ?? 100}
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
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 16px', borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
                  Click ô điểm để sửa · Enter lưu · Esc hủy
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    icon="zap"
                    loading={bulkRunning}
                    onClick={handleBulkAi}
                  >
                    {bulkRunning ? `Đang tạo ${bulkDone}...` : 'Nhận xét AI cả lớp'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon="upload"
                    onClick={() => setShowImport(true)}
                  >
                    Import Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon="download"
                    onClick={handleBulkExport}
                  >
                    Xuất PDF cả lớp
                  </Button>
                </div>
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
                          <button
                            onClick={e => { e.stopPropagation(); setProgressStudent({ id: row.studentId, name: row.studentName }) }}
                            style={{
                              background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}
                            title="Xem lịch sử học tập"
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: 13, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>
                                {row.studentName}
                              </div>
                              {row.level && <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{row.level}</div>}
                            </div>
                            <Icon name="trending-up" size={12} style={{ color: 'var(--text-4)' }} />
                          </button>
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
                          {row.result?.grading_status === 'pending' ? (
                            <Badge variant="warning">Chờ chấm</Badge>
                          ) : row.result?.is_passed != null ? (
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

                        {/* Edit / status / export */}
                        <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                          {isSaving ? (
                            <Icon name="loader" size={14} style={{ color: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
                          ) : isEditing ? (
                            <Icon name="check" size={14} style={{ color: 'var(--success)' }} />
                          ) : (
                            <div style={{ display: 'inline-flex', gap: 4 }}>
                              <button
                                onClick={e => { e.stopPropagation(); startEdit(row) }}
                                title="Sửa điểm"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4 }}
                              >
                                <Icon name="edit" size={14} style={{ color: 'var(--text-3)' }} />
                              </button>
                              {row.result?.answers && Object.keys(row.result.answers).length > 0 && (
                                <button
                                  onClick={e => { e.stopPropagation(); setGradingStudent(row) }}
                                  title="Chấm bài tự luận/nói"
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4 }}
                                >
                                  <Icon name="zap" size={14} style={{ color: row.result.grading_status === 'pending' ? 'var(--warning-dark)' : 'var(--success)' }} />
                                </button>
                              )}
                              {row.result?.total_score != null && (
                                <button
                                  onClick={e => { e.stopPropagation(); handleExportReport(row) }}
                                  title="Xuất báo cáo PDF gửi phụ huynh"
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4 }}
                                >
                                  <Icon name="file-text" size={14} style={{ color: 'var(--primary)' }} />
                                </button>
                              )}
                              {selectedTest?.type === 'speaking' && (
                                <button
                                  onClick={e => { e.stopPropagation(); setAudioStudent(row) }}
                                  title="Ghi âm bài nói"
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4 }}
                                >
                                  <Icon
                                    name="zap"
                                    size={14}
                                    style={{ color: row.result?.speaking_audio_url ? 'var(--success)' : 'var(--text-3)' }}
                                  />
                                </button>
                              )}
                            </div>
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

      {progressStudent && (
        <StudentProgressModal
          open={!!progressStudent}
          onClose={() => setProgressStudent(null)}
          studentId={progressStudent.id}
          studentName={progressStudent.name}
        />
      )}

      <ImportScoresModal
        open={showImport}
        onClose={() => setShowImport(false)}
        test={selectedTest}
        rows={rows}
        threshold={threshold}
        onDone={refetchResults}
      />

      {audioStudent && selectedTest && (
        <Modal
          open={!!audioStudent}
          onClose={() => setAudioStudent(null)}
          title={`Ghi âm bài nói — ${audioStudent.studentName}`}
          width={560}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>
              Nhấn "Bắt đầu ghi âm" để ghi âm bài nói của học sinh. Tối đa 2 phút.
            </div>
            <AudioRecorder
              existingUrl={audioStudent.result?.speaking_audio_url}
              onRecorded={async (blob) => {
                setUploadingAudio(true)
                try {
                  const url = await uploadStudentAudio(selectedTest.id, audioStudent.studentId, blob)
                  await upsertTestResult({
                    test_id: selectedTest.id,
                    student_id: audioStudent.studentId,
                    score_reading: audioStudent.result?.score_reading ?? null,
                    score_listening: audioStudent.result?.score_listening ?? null,
                    score_speaking: audioStudent.result?.score_speaking ?? null,
                    score_writing: audioStudent.result?.score_writing ?? null,
                    total_score: audioStudent.result?.total_score ?? null,
                    is_passed: audioStudent.result?.is_passed ?? null,
                    teacher_feedback: audioStudent.result?.teacher_feedback ?? null,
                    speaking_audio_url: url,
                  })
                  await refetchResults()
                } catch (e: any) {
                  toast.error('Upload audio thất bại: ' + e.message)
                } finally {
                  setUploadingAudio(false)
                }
              }}
              onRemove={async () => {
                await upsertTestResult({
                  test_id: selectedTest.id,
                  student_id: audioStudent.studentId,
                  speaking_audio_url: null,
                })
                await refetchResults()
                setAudioStudent(null)
              }}
            />
            {uploadingAudio && (
              <div style={{ fontSize: 12, color: 'var(--primary)' }}>Đang upload...</div>
            )}
          </div>
        </Modal>
      )}

      {gradingStudent && selectedTest && (
        <GradingModal
          open={!!gradingStudent}
          onClose={() => { setGradingStudent(null); refetchResults() }}
          test={selectedTest}
          studentRow={gradingStudent}
        />
      )}
    </div>
  )
}
