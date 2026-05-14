import React, { useMemo, useCallback } from 'react'
import { Card, Badge, Button, Icon } from '../../../components'
import { useQuery } from '../../../hooks/useSupabase'
import { getEnrollmentsByClass } from '../../../services/classes'
import { getTestResults, upsertTestResult } from '../../../services/tests'
import type { DbTest, DbTestResult } from '../../../types/database'
import { ScoreEntryModal } from './ScoreEntryModal'

const PASS_THRESHOLD_DEFAULT = 60

interface StudentRow {
  studentId: string
  studentName: string
  level: string | null
  result: DbTestResult | null
}

function scoreCell(val: number | null) {
  if (val === null) return <span style={{ color: 'var(--text-4)' }}>—</span>
  const color =
    val >= 80 ? 'var(--success)' :
    val >= 60 ? 'var(--warning-dark)' : 'var(--error-dark)'
  return <span style={{ fontWeight: 600, color }}>{val}</span>
}

interface TestsResultsTabProps {
  tests: DbTest[]
  selectedTest: DbTest | null
  onSelectTest: (t: DbTest) => void
}

export const TestsResultsTab: React.FC<TestsResultsTabProps> = ({
  tests,
  selectedTest,
  onSelectTest,
}) => {
  const [scoreModal, setScoreModal] = React.useState<{ open: boolean; studentId: string; studentName: string; existing: DbTestResult | null }>({
    open: false, studentId: '', studentName: '', existing: null,
  })
  const [saving, setSaving] = React.useState(false)

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
        studentId: e.student.id,
        studentName: e.student.full_name,
        level: e.student.level,
        result: resultMap.get(e.student.id) ?? null,
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

  const openModal = (row: StudentRow) => {
    setScoreModal({ open: true, studentId: row.studentId, studentName: row.studentName, existing: row.result })
  }

  const handleSave = async (payload: Partial<DbTestResult>) => {
    if (!selectedTest || !scoreModal.studentId) return
    setSaving(true)
    try {
      await upsertTestResult({
        ...payload,
        test_id: selectedTest.id,
        student_id: scoreModal.studentId,
      })
      await refetchResults()
    } finally {
      setSaving(false)
    }
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-3)',
    textAlign: 'center',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  }
  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: 13,
    textAlign: 'center',
    borderBottom: '1px solid var(--border-light)',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>
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
            onClick={() => onSelectTest(t)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '12px 16px',
              background: selectedTest?.id === t.id ? 'var(--primary-light)' : 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border-light)',
              cursor: 'pointer',
              transition: 'background 0.15s',
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

      {/* Right: results table */}
      <div>
        {!selectedTest ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Icon name="clipboard" size={36} style={{ color: 'var(--text-4)', display: 'block', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
              Chọn một bài kiểm tra để xem kết quả
            </div>
          </div>
        ) : (
          <>
            {/* Test info + stats */}
            <Card style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
                    {selectedTest.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                    {selectedTest.class?.name} · Ngưỡng đạt: {threshold}/100
                  </div>
                </div>
                {stats && (
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{stats.avg}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Trung bình</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>
                        {Math.round((stats.passCount / stats.total) * 100)}%
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Tỷ lệ đạt</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{stats.total}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Đã có điểm</div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Score table */}
            <Card style={{ padding: 0, overflow: 'hidden' }}>
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
                    <th style={{ ...thStyle, width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr
                      key={row.studentId}
                      style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ ...tdStyle, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13 }}>
                          {row.studentName}
                        </div>
                        {row.level && (
                          <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{row.level}</div>
                        )}
                      </td>
                      <td style={tdStyle}>{scoreCell(row.result?.score_reading ?? null)}</td>
                      <td style={tdStyle}>{scoreCell(row.result?.score_listening ?? null)}</td>
                      <td style={tdStyle}>{scoreCell(row.result?.score_speaking ?? null)}</td>
                      <td style={tdStyle}>{scoreCell(row.result?.score_writing ?? null)}</td>
                      <td style={tdStyle}>
                        {row.result?.total_score != null ? (
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>
                            {row.result.total_score}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-4)' }}>—</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {row.result?.is_passed != null ? (
                          <Badge variant={row.result.is_passed ? 'success' : 'error'}>
                            {row.result.is_passed ? 'Đạt' : 'Chưa đạt'}
                          </Badge>
                        ) : (
                          <span style={{ color: 'var(--text-4)', fontSize: 12 }}>Chưa nhập</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="edit"
                          onClick={() => openModal(row)}
                        >
                          {row.result ? 'Sửa' : 'Nhập'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
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

      {/* Score entry modal */}
      {selectedTest && (
        <ScoreEntryModal
          open={scoreModal.open}
          onClose={() => setScoreModal(p => ({ ...p, open: false }))}
          test={selectedTest}
          studentName={scoreModal.studentName}
          existing={scoreModal.existing}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}
