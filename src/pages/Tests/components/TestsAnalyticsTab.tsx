import React, { useMemo, useCallback, useState } from 'react'
import { Card, Icon, Button, Badge } from '../../../components'
import { DonutChart, BarChart } from '../../../components/charts'
import { useQuery } from '../../../hooks/useSupabase'
import { getTestResults } from '../../../services/tests'
import type { DbTest } from '../../../types/database'
import { RadarChart } from './RadarChart'
import { generateClassInsights } from '../aiInsights'

const RADAR_AXES = [
  { key: 'score_reading',   label: 'Đọc' },
  { key: 'score_listening', label: 'Nghe' },
  { key: 'score_speaking',  label: 'Nói' },
  { key: 'score_writing',   label: 'Viết' },
]

function avg(nums: (number | null | undefined)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null && n !== undefined)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function buildHistogram(scores: number[]): { label: string; value: number; highlight: boolean }[] {
  const buckets = [
    { label: '0–39',  min: 0,  max: 40  },
    { label: '40–59', min: 40, max: 60  },
    { label: '60–69', min: 60, max: 70  },
    { label: '70–79', min: 70, max: 80  },
    { label: '80–89', min: 80, max: 90  },
    { label: '90–100',min: 90, max: 101 },
  ]
  return buckets.map(b => ({
    label: b.label,
    value: scores.filter(s => s >= b.min && s < b.max).length,
    highlight: b.min >= 60 && b.min < 80,
  }))
}

interface TestsAnalyticsTabProps {
  tests: DbTest[]
  selectedTest: DbTest | null
  onSelectTest: (t: DbTest) => void
}

export const TestsAnalyticsTab: React.FC<TestsAnalyticsTabProps> = ({
  tests, selectedTest, onSelectTest,
}) => {
  const [aiInsight, setAiInsight] = useState('')
  const [generatingAi, setGeneratingAi] = useState(false)

  const fetchResults = useCallback(
    () => selectedTest ? getTestResults(selectedTest.id) : Promise.resolve([]),
    [selectedTest?.id],
  )
  const { data: results, loading } = useQuery(fetchResults, [selectedTest?.id])

  const withScores = useMemo(
    () => (results ?? []).filter(r => r.total_score !== null),
    [results],
  )

  const skillAvg = useMemo(() => ({
    score_reading:   avg((results ?? []).map(r => r.score_reading)),
    score_listening: avg((results ?? []).map(r => r.score_listening)),
    score_speaking:  avg((results ?? []).map(r => r.score_speaking)),
    score_writing:   avg((results ?? []).map(r => r.score_writing)),
  }), [results])

  const histogram = useMemo(
    () => buildHistogram(withScores.map(r => r.total_score!)),
    [withScores],
  )

  const passCount  = withScores.filter(r => r.is_passed).length
  const failCount  = withScores.length - passCount
  const totalAvg   = useMemo(() => avg(withScores.map(r => r.total_score)), [withScores])
  const passRate   = withScores.length ? Math.round((passCount / withScores.length) * 100) : 0

  const handleGenerateAi = () => {
    if (!selectedTest || !results) return
    setGeneratingAi(true)
    // Small timeout for perceived AI "thinking"
    setTimeout(() => {
      setAiInsight(generateClassInsights(results, selectedTest))
      setGeneratingAi(false)
    }, 600)
  }

  const statBox = (label: string, value: string | number, sub?: string, color?: string) => (
    <div style={{
      flex: 1,
      minWidth: 100,
      padding: '14px 16px',
      background: 'var(--hover-bg)',
      borderRadius: 12,
      border: '1px solid var(--border-light)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color ?? 'var(--text-1)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
      {/* Test selector sidebar */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Chọn bài kiểm tra
        </div>
        {tests.filter(t => t.status === 'completed').length === 0 ? (
          <div style={{ padding: 20, fontSize: 13, color: 'var(--text-4)', textAlign: 'center' }}>
            Chưa có bài đã hoàn thành
          </div>
        ) : (
          tests.filter(t => t.status === 'completed').map(t => (
            <button
              key={t.id}
              onClick={() => { onSelectTest(t); setAiInsight('') }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 16px', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid var(--border-light)',
                background: selectedTest?.id === t.id ? 'var(--primary-light)' : 'transparent',
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
          ))
        )}
      </Card>

      {/* Analytics content */}
      <div>
        {!selectedTest ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Icon name="bar-chart" size={36} style={{ color: 'var(--text-4)', display: 'block', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
              Chọn bài kiểm tra để xem phân tích
            </div>
          </div>
        ) : loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Đang tải...</div>
        ) : withScores.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Icon name="alert" size={36} style={{ color: 'var(--text-4)', display: 'block', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, color: 'var(--text-3)' }}>
              Chưa có dữ liệu điểm số cho bài kiểm tra này
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Summary stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {statBox('Trung bình lớp', totalAvg?.toFixed(1) ?? '—', undefined, 'var(--primary)')}
              {statBox('Tỷ lệ đạt', `${passRate}%`, `${passCount}/${withScores.length} học viên`, 'var(--success)')}
              {statBox('Cao nhất', Math.max(...withScores.map(r => r.total_score!)), undefined, 'var(--info-dark)')}
              {statBox('Thấp nhất', Math.min(...withScores.map(r => r.total_score!)), undefined, 'var(--warning-dark)')}
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Radar chart */}
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16 }}>
                  Biểu đồ kỹ năng (trung bình lớp)
                </div>
                {Object.values(skillAvg).some(v => v !== null) ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <RadarChart
                      axes={RADAR_AXES}
                      series={[{
                        label: 'Lớp',
                        color: 'var(--primary)',
                        values: skillAvg as Record<string, number | null>,
                      }]}
                      size={220}
                    />
                  </div>
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
                    Không có dữ liệu kỹ năng chi tiết
                  </div>
                )}
                {/* Skill legend */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 12 }}>
                  {RADAR_AXES.map(axis => {
                    const val = skillAvg[axis.key as keyof typeof skillAvg]
                    return (
                      <div key={axis.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-3)' }}>{axis.label}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>
                          {val !== null ? val.toFixed(1) : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Pass/fail donut + histogram */}
              <Card>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16 }}>
                  Kết quả đạt / chưa đạt
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                  <DonutChart
                    segments={[
                      { value: passCount,  color: 'var(--success)',      label: 'Đạt' },
                      { value: failCount,  color: 'var(--error-light)',  label: 'Chưa đạt' },
                    ]}
                    size={110}
                    strokeWidth={14}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }} />
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Đạt: <strong>{passCount}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--error-light)' }} />
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Chưa đạt: <strong>{failCount}</strong></span>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8 }}>
                  Phân bố điểm số
                </div>
                <BarChart data={histogram} width={280} height={100} />
              </Card>
            </div>

            {/* AI Analysis */}
            <Card style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--hover-bg) 100%)', border: '1px solid var(--primary-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>✨</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                    Phân tích AI
                  </span>
                  <Badge variant="primary" style={{ fontSize: 10 }}>Beta</Badge>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateAi}
                  disabled={generatingAi}
                >
                  {generatingAi ? 'Đang phân tích...' : 'Phân tích ngay'}
                </Button>
              </div>

              {aiInsight ? (
                <div>
                  {aiInsight.split('\n\n').map((para, i) => (
                    <p
                      key={i}
                      style={{
                        fontSize: 13,
                        color: 'var(--text-2)',
                        lineHeight: 1.7,
                        margin: i === 0 ? '0 0 10px' : '0 0 10px',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                  Nhấn "Phân tích ngay" để nhận nhận xét tổng thể về kết quả lớp, kỹ năng yếu nhất, học viên cần hỗ trợ và đề xuất cải thiện từ hệ thống AI.
                </p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
