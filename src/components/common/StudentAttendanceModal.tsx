import React, { useEffect, useState, useMemo } from 'react'
import { Modal } from './Modal'
import { Badge } from './Badge'
import { Icon } from './Icon'
import { getStudentAttendanceHistory, AttendanceStatus } from '../../services/attendance'

interface Props {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
}

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  absent:  'Vắng',
  late:    'Muộn',
  excused: 'Vắng phép',
}

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: '#22c55e',
  absent:  '#ef4444',
  late:    '#f59e0b',
  excused: '#3b82f6',
}

export const StudentAttendanceModal: React.FC<Props> = ({ open, onClose, studentId, studentName }) => {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !studentId) return
    setLoading(true)
    // Lấy lịch sử 90 ngày gần nhất
    const today = new Date()
    const from = new Date(today)
    from.setDate(from.getDate() - 90)
    const fromStr = from.toISOString().slice(0, 10)
    const toStr   = today.toISOString().slice(0, 10)

    getStudentAttendanceHistory(studentId, fromStr, toStr)
      .then(setHistory)
      .finally(() => setLoading(false))
  }, [open, studentId])

  // Stats
  const stats = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 }
    history.forEach(h => { counts[h.status as AttendanceStatus]++ })
    const total = history.length
    const attendRate = total > 0
      ? Math.round(((counts.present + counts.late) / total) * 100)
      : 0
    return { ...counts, total, attendRate }
  }, [history])

  // Build calendar heatmap (12 weeks)
  const heatmap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>()
    history.forEach(h => map.set(h.session_date, h.status))

    const cells: { date: Date; status: AttendanceStatus | null }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      cells.push({ date: d, status: map.get(key) ?? null })
    }
    return cells
  }, [history])

  return (
    <Modal open={open} onClose={onClose} title={`Lịch sử điểm danh — ${studentName}`} width={780}>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Đang tải...</div>
      ) : history.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Icon name="calendar" size={32} style={{ color: 'var(--text-4)', display: 'block', margin: '0 auto 10px' }} />
          <div style={{ fontSize: 14, color: 'var(--text-3)' }}>Chưa có dữ liệu điểm danh 90 ngày qua</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[
              { label: 'Chuyên cần', val: `${stats.attendRate}%`,    color: stats.attendRate >= 90 ? 'var(--success)' : 'var(--warning-dark)' },
              { label: 'Có mặt',     val: stats.present,             color: STATUS_COLOR.present },
              { label: 'Muộn',       val: stats.late,                color: STATUS_COLOR.late },
              { label: 'Vắng phép',  val: stats.excused,             color: STATUS_COLOR.excused },
              { label: 'Vắng',       val: stats.absent,              color: STATUS_COLOR.absent },
            ].map(s => (
              <div key={s.label} style={{
                padding: 12, borderRadius: 10,
                background: 'var(--hover-bg)', border: '1px solid var(--border-light)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Calendar heatmap */}
          <div style={{
            padding: 16, borderRadius: 12,
            background: 'var(--hover-bg)', border: '1px solid var(--border-light)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10 }}>
              Heatmap 12 tuần gần nhất
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: 4,
            }}>
              {Array.from({ length: 12 }, (_, w) => (
                <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {heatmap.slice(w * 7, w * 7 + 7).map((cell, di) => (
                    <div
                      key={di}
                      title={`${cell.date.toLocaleDateString('vi-VN')}: ${cell.status ? STATUS_LABEL[cell.status] : 'Không có buổi học'}`}
                      style={{
                        height: 14, borderRadius: 3,
                        background: cell.status ? STATUS_COLOR[cell.status] : 'var(--border-light)',
                        opacity: cell.status ? 1 : 0.4,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11, color: 'var(--text-4)' }}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLOR[k as AttendanceStatus] }} />
                  {v}
                </div>
              ))}
            </div>
          </div>

          {/* History list */}
          <div style={{ maxHeight: 280, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--hover-bg)', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Ngày</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Lớp</th>
                  <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Trạng thái</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px 12px' }}>{new Date(h.session_date).toLocaleDateString('vi-VN')}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-3)' }}>{h.class_name ?? '—'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <Badge variant={
                        h.status === 'present'  ? 'success' :
                        h.status === 'late'     ? 'warning' :
                        h.status === 'excused'  ? 'info'    : 'error'
                      }>
                        {STATUS_LABEL[h.status as AttendanceStatus]}
                      </Badge>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-3)', fontSize: 12 }}>
                      {h.notes || '—'}
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
