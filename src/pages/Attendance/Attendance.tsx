import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { PageHeader, Button, Card, Avatar, Icon, useConfirm, useToast } from '../../components'
import { useQuery } from '../../hooks/useSupabase'
import { getClasses, getEnrollmentsByClass } from '../../services/classes'
import {
  getAttendanceByClassDate,
  upsertAttendance,
  bulkUpsertAttendance,
  getClassAttendanceStats,
  AttendanceStatus,
  DbAttendance,
} from '../../services/attendance'
import { StudentAttendanceModal } from './components/StudentAttendanceModal'
import { exportAttendanceReport } from './attendanceReport'

interface Enrollment {
  id: string
  student: {
    id: string
    full_name: string
    level: string | null
    status: string
  }
}

const STATUSES: {
  value: AttendanceStatus
  label: string
  color: string
  bg: string
  icon: 'check' | 'clock' | 'alert-circle' | 'x'
}[] = [
  { value: 'present', label: 'Có mặt',    color: '#16a34a', bg: '#dcfce7', icon: 'check'        },
  { value: 'late',    label: 'Muộn',      color: '#d97706', bg: '#fef3c7', icon: 'clock'        },
  { value: 'excused', label: 'Vắng phép', color: '#2563eb', bg: '#dbeafe', icon: 'alert-circle' },
  { value: 'absent',  label: 'Vắng',      color: '#dc2626', bg: '#fee2e2', icon: 'x'            },
]

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.value, s])) as Record<AttendanceStatus, typeof STATUSES[0]>

const today = () => new Date().toISOString().slice(0, 10)

const inputStyle: React.CSSProperties = {
  height: 38, padding: '0 14px', borderRadius: 10,
  border: '1.5px solid var(--border)', background: 'var(--card)',
  color: 'var(--text-1)', fontSize: 14, outline: 'none',
  fontFamily: 'var(--font)', transition: 'border-color 0.15s',
}

export const Attendance: React.FC = () => {
  const confirm = useConfirm()
  const toast = useToast()
  const [selClassId, setSelClassId] = useState<string>('')
  const [date, setDate] = useState<string>(today())
  const [search, setSearch] = useState('')
  const [att, setAtt] = useState<Record<string, DbAttendance | { status: AttendanceStatus; notes: string | null }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [historyStudent, setHistoryStudent] = useState<{ id: string; name: string } | null>(null)
  const [showNotesFor, setShowNotesFor] = useState<string | null>(null)
  const [stats, setStats] = useState<{ rate: number; totalSessions: number } | null>(null)

  const { data: classes } = useQuery(() => getClasses({ status: 'active' }))

  useEffect(() => {
    if (!selClassId && classes && classes.length > 0) {
      setSelClassId((classes[0] as any).id)
    }
  }, [classes, selClassId])

  const fetchEnrollments = useCallback(
    () => selClassId ? getEnrollmentsByClass(selClassId) : Promise.resolve([]),
    [selClassId],
  )
  const { data: enrollments, loading: loadingEnrolls } = useQuery(fetchEnrollments, [selClassId])

  useEffect(() => {
    if (!selClassId || !date) { setAtt({}); return }
    getAttendanceByClassDate(selClassId, date).then(setAtt).catch(console.error)
  }, [selClassId, date])

  useEffect(() => {
    if (!selClassId) { setStats(null); return }
    const from = new Date(); from.setDate(from.getDate() - 30)
    getClassAttendanceStats(selClassId, from.toISOString().slice(0, 10), today())
      .then(s => setStats({ rate: s.rate, totalSessions: s.totalSessions }))
      .catch(console.error)
  }, [selClassId])

  const filteredEnrollments = useMemo(() => {
    const list = (enrollments as Enrollment[] | undefined) ?? []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(e => e.student.full_name.toLowerCase().includes(q))
  }, [enrollments, search])

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, excused: 0, absent: 0, unmarked: 0 }
    const list = (enrollments as Enrollment[] | undefined) ?? []
    for (const e of list) {
      const a = att[e.id]
      if (!a) c.unmarked++
      else c[a.status as AttendanceStatus]++
    }
    return c
  }, [att, enrollments])

  const total = (enrollments as Enrollment[] | undefined)?.length ?? 0
  const markedCount = total - counts.unmarked
  const progressPct = total > 0 ? Math.round((markedCount / total) * 100) : 0

  const handleSetStatus = async (enrollmentId: string, status: AttendanceStatus) => {
    setSavingId(enrollmentId)
    try {
      const result = await upsertAttendance({
        enrollment_id: enrollmentId,
        session_date: date,
        status,
        notes: (att[enrollmentId] as any)?.notes ?? null,
      })
      setAtt(p => ({ ...p, [enrollmentId]: result }))
    } finally {
      setSavingId(null)
    }
  }

  const handleSetNote = async (enrollmentId: string, notes: string) => {
    setSavingId(enrollmentId)
    try {
      const status = (att[enrollmentId] as any)?.status ?? 'present'
      const result = await upsertAttendance({
        enrollment_id: enrollmentId,
        session_date: date,
        status,
        notes: notes.trim() || null,
      })
      setAtt(p => ({ ...p, [enrollmentId]: result }))
    } finally {
      setSavingId(null)
    }
  }

  const handleBulkSet = async (status: AttendanceStatus) => {
    const list = (enrollments as Enrollment[] | undefined) ?? []
    if (list.length === 0) return
    const ok = await confirm({
      title: 'Điểm danh hàng loạt',
      message: `Đặt ${list.length} học viên thành "${STATUS_MAP[status].label}"?`,
      confirmLabel: 'Xác nhận',
      variant: 'primary',
    })
    if (!ok) return
    setBulkSaving(true)
    try {
      const rows = list.map(e => ({ enrollment_id: e.id, session_date: date, status }))
      await bulkUpsertAttendance(rows)
      const fresh = await getAttendanceByClassDate(selClassId, date)
      setAtt(fresh)
      toast.success(`Đã điểm danh ${list.length} học viên`)
    } catch (e: any) {
      toast.error('Lỗi: ' + e.message)
    } finally {
      setBulkSaving(false)
    }
  }

  const handleExport = async () => {
    const list = (enrollments as Enrollment[] | undefined) ?? []
    if (list.length === 0) return
    const klass = (classes as any[] | undefined)?.find(c => c.id === selClassId)
    const className = klass?.name ?? 'Lớp'

    const from = new Date(); from.setDate(from.getDate() - 30)
    const fromStr = from.toISOString().slice(0, 10)
    const toStr = today()

    const { getStudentAttendanceHistory } = await import('../../services/attendance')
    const rows = await Promise.all(list.map(async e => {
      const hist = await getStudentAttendanceHistory(e.student.id, fromStr, toStr)
      const c = { present: 0, absent: 0, late: 0, excused: 0 }
      hist.forEach(h => c[h.status as AttendanceStatus]++)
      const t = c.present + c.absent + c.late + c.excused
      const rate = t > 0 ? Math.round(((c.present + c.late) / t) * 100) : 0
      return { studentName: e.student.full_name, level: e.student.level, ...c, rate }
    }))

    exportAttendanceReport({ className, fromDate: fromStr, toDate: toStr, rows, totalSessions: stats?.totalSessions ?? 0 })
  }

  const selectedClass = (classes as any[] | undefined)?.find(c => c.id === selClassId)

  return (
    <div>
      <PageHeader
        title="Điểm danh"
        subtitle={selectedClass
          ? `${selectedClass.name} · ${new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}`
          : 'Chọn lớp để bắt đầu'}
        actions={
          <Button icon="download" variant="outline" onClick={handleExport}>
            Xuất báo cáo tháng
          </Button>
        }
      />

      {/* Controls */}
      <Card animate style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selClassId}
            onChange={e => setSelClassId(e.target.value)}
            style={{
              ...inputStyle,
              minWidth: 210,
              paddingRight: 36,
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              cursor: 'pointer',
            }}
          >
            {(classes as any[] | undefined)?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={today()}
            style={inputStyle}
          />

          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Icon name="search" size={14} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text-4)',
            }} />
            <input
              placeholder="Tìm học viên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                ...inputStyle,
                width: '100%', paddingLeft: 36,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />

          <Button
            size="sm"
            variant="outline"
            icon="check"
            loading={bulkSaving}
            onClick={() => handleBulkSet('present')}
          >
            Tất cả có mặt
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 14 }}>
        {([
          { label: 'Có mặt',          val: counts.present,  color: '#16a34a', bg: '#dcfce7', icon: 'check'        },
          { label: 'Muộn',            val: counts.late,     color: '#d97706', bg: '#fef3c7', icon: 'clock'        },
          { label: 'Vắng phép',       val: counts.excused,  color: '#2563eb', bg: '#dbeafe', icon: 'alert-circle' },
          { label: 'Vắng',            val: counts.absent,   color: '#dc2626', bg: '#fee2e2', icon: 'x'            },
          { label: 'Chưa điểm danh', val: counts.unmarked, color: 'var(--text-3)', bg: 'var(--hover-bg)', icon: 'alert' },
        ] as const).map(s => (
          <Card key={s.label} style={{ padding: '16px 14px', textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px',
            }}>
              <Icon name={s.icon} size={20} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-1px' }}>
              {s.val}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Progress bar + 30-day rate */}
      <Card style={{ padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>Tiến độ điểm danh hôm nay</span>
              <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>{markedCount}/{total} học viên</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--hover-bg)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progressPct}%`,
                borderRadius: 99,
                background: progressPct === 100 ? '#16a34a' : 'var(--primary)',
                transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          </div>

          {stats && stats.totalSessions > 0 && (
            <>
              <div style={{ width: 1, height: 40, background: 'var(--border)', flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--primary-light, #ede9fe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="trending-up" size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
                    {stats.rate}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>
                    Chuyên cần · {stats.totalSessions} buổi/30 ngày
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Student list */}
      <Card animate delay={60} style={{ padding: 0, overflow: 'hidden' }}>
        {loadingEnrolls ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
            <Icon
              name="loader"
              size={28}
              style={{ animation: 'spin 0.8s linear infinite', display: 'block', margin: '0 auto 12px' }}
            />
            Đang tải danh sách học viên...
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-4)' }}>
            <Icon name="users" size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.25 }} />
            {search ? 'Không tìm thấy học viên phù hợp' : 'Lớp chưa có học viên'}
          </div>
        ) : (
          <>
            {/* Header row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '44px 1fr 180px 1fr 40px',
              padding: '10px 20px',
              background: 'var(--hover-bg)',
              borderBottom: '1px solid var(--border)',
              fontSize: 11, fontWeight: 700,
              color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              <div>#</div>
              <div>Học viên</div>
              <div style={{ textAlign: 'center' }}>Điểm danh</div>
              <div style={{ paddingLeft: 8 }}>Ghi chú</div>
              <div />
            </div>

            {/* Rows */}
            {filteredEnrollments.map((e, i) => {
              const a = att[e.id]
              const status = (a?.status as AttendanceStatus) ?? null
              const notes = (a as any)?.notes ?? ''
              const isSaving = savingId === e.id
              const isEditingNote = showNotesFor === e.id
              const statusInfo = status ? STATUS_MAP[status] : null

              return (
                <StudentRow
                  key={e.id}
                  index={i}
                  enrollment={e}
                  status={status}
                  statusInfo={statusInfo}
                  notes={notes}
                  isSaving={isSaving}
                  isEditingNote={isEditingNote}
                  onSetStatus={handleSetStatus}
                  onSetNote={handleSetNote}
                  onShowHistory={() => setHistoryStudent({ id: e.student.id, name: e.student.full_name })}
                  onEditNote={() => setShowNotesFor(e.id)}
                  onCancelNote={() => setShowNotesFor(null)}
                />
              )
            })}
          </>
        )}
      </Card>

      {historyStudent && (
        <StudentAttendanceModal
          open={!!historyStudent}
          onClose={() => setHistoryStudent(null)}
          studentId={historyStudent.id}
          studentName={historyStudent.name}
        />
      )}
    </div>
  )
}

/* ── Student row extracted to avoid inline re-renders ── */
interface StudentRowProps {
  index: number
  enrollment: Enrollment
  status: AttendanceStatus | null
  statusInfo: typeof STATUSES[0] | null
  notes: string
  isSaving: boolean
  isEditingNote: boolean
  onSetStatus: (id: string, s: AttendanceStatus) => void
  onSetNote: (id: string, n: string) => void
  onShowHistory: () => void
  onEditNote: () => void
  onCancelNote: () => void
}

const StudentRow: React.FC<StudentRowProps> = ({
  index, enrollment: e, status, statusInfo, notes,
  isSaving, isEditingNote,
  onSetStatus, onSetNote, onShowHistory, onEditNote, onCancelNote,
}) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 180px 1fr 40px',
        alignItems: 'center',
        padding: '11px 20px',
        borderBottom: '1px solid var(--border-light)',
        background: hovered ? 'var(--hover-bg)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      {/* # */}
      <div style={{ fontSize: 12, color: 'var(--text-4)', fontWeight: 500 }}>{index + 1}</div>

      {/* Student */}
      <button
        onClick={onShowHistory}
        title="Xem lịch sử chuyên cần"
        style={{
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left',
        }}
      >
        <Avatar initials={e.student.full_name[0]} size={34} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13.5 }}>
              {e.student.full_name}
            </span>
            {statusInfo && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '2px 8px', borderRadius: 99,
                fontSize: 10, fontWeight: 700,
                background: statusInfo.bg, color: statusInfo.color,
              }}>
                <Icon name={statusInfo.icon} size={10} />
                {statusInfo.label}
              </span>
            )}
            {!status && (
              <span style={{
                padding: '2px 8px', borderRadius: 99,
                fontSize: 10, fontWeight: 600,
                background: 'var(--hover-bg)', color: 'var(--text-4)',
              }}>
                Chưa điểm
              </span>
            )}
          </div>
          {e.student.level && (
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{e.student.level}</div>
          )}
        </div>
      </button>

      {/* Status buttons */}
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
        {STATUSES.map(s => {
          const isActive = status === s.value
          return (
            <button
              key={s.value}
              onClick={() => onSetStatus(e.id, s.value)}
              disabled={isSaving}
              title={s.label}
              style={{
                width: 34, height: 34, borderRadius: 9, border: 'none',
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? s.bg : 'transparent',
                color: isActive ? s.color : 'var(--text-4)',
                transition: 'all 0.15s',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                boxShadow: isActive ? `0 2px 8px ${s.color}40` : 'none',
                outline: 'none',
              }}
            >
              <Icon name={s.icon} size={16} />
            </button>
          )
        })}
      </div>

      {/* Note */}
      <div style={{ paddingLeft: 8 }}>
        {isEditingNote ? (
          <input
            autoFocus
            defaultValue={notes}
            onBlur={e2 => { onSetNote(e.id, e2.target.value); onCancelNote() }}
            onKeyDown={e2 => {
              if (e2.key === 'Enter') (e2.target as HTMLInputElement).blur()
              if (e2.key === 'Escape') onCancelNote()
            }}
            style={{
              width: '100%', height: 30, padding: '0 10px',
              borderRadius: 8, border: '1.5px solid var(--primary)',
              fontSize: 12, fontFamily: 'var(--font)', outline: 'none',
              background: 'var(--card)', color: 'var(--text-1)',
              boxSizing: 'border-box',
            }}
            placeholder="Lý do nghỉ / ghi chú..."
          />
        ) : (
          <button
            onClick={onEditNote}
            style={{
              background: 'none', border: 'none', padding: '4px 6px',
              cursor: 'pointer', textAlign: 'left', borderRadius: 6,
              color: notes ? 'var(--text-2)' : 'var(--text-4)',
              fontSize: 12, fontStyle: notes ? 'normal' : 'italic',
              width: '100%',
            }}
          >
            {notes || '+ Ghi chú'}
          </button>
        )}
      </div>

      {/* Loader */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {isSaving && (
          <Icon name="loader" size={14} style={{ color: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
        )}
      </div>
    </div>
  )
}

export default Attendance
