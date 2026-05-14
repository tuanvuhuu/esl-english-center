import React, { useEffect, useState } from 'react'
import { Modal, Badge, Icon } from '../../../components'
import { getStudentTestHistory } from '../../../services/tests'
import type { DbTest, DbTestResult } from '../../../types/database'

interface Props {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
}

type HistoryItem = DbTestResult & { test: DbTest }

const SKILL_LABELS = {
  score_reading: 'Đọc',
  score_listening: 'Nghe',
  score_speaking: 'Nói',
  score_writing: 'Viết',
} as const
const SKILL_COLORS = {
  score_reading: '#3B82F6',
  score_listening: '#10B981',
  score_speaking: '#F59E0B',
  score_writing: '#EF4444',
} as const

export const StudentProgressModal: React.FC<Props> = ({ open, onClose, studentId, studentName }) => {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !studentId) return
    setLoading(true)
    getStudentTestHistory(studentId)
      .then(h => setHistory(h as HistoryItem[]))
      .finally(() => setLoading(false))
  }, [open, studentId])

  // Build chart data
  const W = 600
  const H = 220
  const PAD = { l: 40, r: 20, t: 20, b: 40 }
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b

  const points = history.filter(h => h.total_score != null)
  const xStep = points.length > 1 ? innerW / (points.length - 1) : 0
  const yFor = (score: number) => PAD.t + innerH - (score / 100) * innerH
  const xFor = (i: number) => PAD.l + i * xStep

  const skillSeries = (['score_reading', 'score_listening', 'score_speaking', 'score_writing'] as const).map(skill => ({
    skill,
    label: SKILL_LABELS[skill],
    color: SKILL_COLORS[skill],
    pts: points.map((p, i) => p[skill] != null ? { x: xFor(i), y: yFor(p[skill]!), v: p[skill]! } : null),
  }))

  // Trend per skill: compare last 3 vs first 3
  const trends = skillSeries.map(s => {
    const valid = s.pts.filter(p => p !== null) as { v: number }[]
    if (valid.length < 2) return { ...s, trend: 0, latest: null as number | null }
    const half = Math.max(1, Math.floor(valid.length / 2))
    const early = valid.slice(0, half).reduce((sum, p) => sum + p.v, 0) / half
    const late = valid.slice(-half).reduce((sum, p) => sum + p.v, 0) / half
    return { ...s, trend: Math.round((late - early) * 10) / 10, latest: valid[valid.length - 1].v }
  })

  return (
    <Modal open={open} onClose={onClose} title={`Lịch sử học tập — ${studentName}`} width={900}>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Đang tải...</div>
      ) : history.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Icon name="clipboard" size={32} style={{ color: 'var(--text-4)', display: 'block', margin: '0 auto 10px' }} />
          <div style={{ color: 'var(--text-3)', fontSize: 14 }}>Chưa có dữ liệu bài kiểm tra nào</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Trend cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {trends.map(t => (
              <div key={t.skill} style={{
                padding: 12, borderRadius: 10,
                background: 'var(--hover-bg)', border: '1px solid var(--border-light)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>{t.label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>
                  {t.latest ?? '—'}
                </div>
                {t.latest != null && Math.abs(t.trend) >= 0.5 && (
                  <div style={{
                    fontSize: 11, fontWeight: 600, marginTop: 2,
                    color: t.trend > 0 ? 'var(--success)' : 'var(--error)',
                    display: 'flex', alignItems: 'center', gap: 2,
                  }}>
                    <Icon name={t.trend > 0 ? 'trending-up' : 'trending-down'} size={11} />
                    {t.trend > 0 ? '+' : ''}{t.trend}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Line chart */}
          <div style={{
            padding: 16, borderRadius: 12,
            background: 'var(--hover-bg)', border: '1px solid var(--border-light)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10 }}>
              Biểu đồ tiến bộ ({points.length} bài kiểm tra)
            </div>
            <svg width={W} height={H} style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}>
              {/* Y axis grid */}
              {[0, 25, 50, 75, 100].map(y => (
                <g key={y}>
                  <line
                    x1={PAD.l} x2={W - PAD.r}
                    y1={yFor(y)} y2={yFor(y)}
                    stroke="var(--border-light)" strokeWidth={1}
                    strokeDasharray={y === 0 ? 'none' : '3 3'}
                  />
                  <text x={PAD.l - 6} y={yFor(y) + 3} textAnchor="end"
                    fontSize="10" fill="var(--text-4)">{y}</text>
                </g>
              ))}

              {/* X axis labels (test dates) */}
              {points.map((p, i) => (
                <text key={p.id} x={xFor(i)} y={H - PAD.b + 16}
                  textAnchor="middle" fontSize="10" fill="var(--text-3)">
                  {new Date(p.test.test_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </text>
              ))}

              {/* Skill lines */}
              {skillSeries.map(s => {
                const validPts = s.pts.map((p, i) => p ? `${p.x},${p.y}` : null).filter(Boolean).join(' ')
                return (
                  <g key={s.skill}>
                    <polyline
                      points={validPts}
                      fill="none" stroke={s.color} strokeWidth={2}
                      strokeLinecap="round" strokeLinejoin="round"
                    />
                    {s.pts.map((p, i) => p && (
                      <circle key={i} cx={p.x} cy={p.y} r={3} fill={s.color} />
                    ))}
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              {skillSeries.map(s => (
                <div key={s.skill} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <div style={{ width: 12, height: 3, borderRadius: 2, background: s.color }} />
                  <span style={{ color: 'var(--text-3)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* History table */}
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--hover-bg)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Bài kiểm tra</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Ngày</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Tổng</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Kết quả</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-1)', fontWeight: 600 }}>{h.test.name}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
                      {new Date(h.test.test_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: 'var(--text-1)' }}>
                      {h.total_score ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {h.is_passed != null
                        ? <Badge variant={h.is_passed ? 'success' : 'error'}>{h.is_passed ? 'Đạt' : 'Chưa đạt'}</Badge>
                        : <span style={{ color: 'var(--text-4)', fontSize: 12 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}
