import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { PageHeader, Button, Card, Avatar, Icon, useConfirm, useToast } from '../../components'
import { useQuery } from '../../hooks/useSupabase'
import { getClasses, getEnrollmentsByClass } from '../../services/classes'
import {
  getAttendanceByClassDate,
  upsertAttendance,
  bulkUpsertAttendance,
  getClassAttendanceStats,
  getClassDailyAttendance,
  AttendanceStatus,
  DbAttendance,
} from '../../services/attendance'
import { StudentAttendanceModal } from './components/StudentAttendanceModal'
import { exportAttendanceReport } from './attendanceReport'
import { MiniDonutChart } from '../Dashboard/components/MiniDonutChart'
import { MiniBarChart } from '../Dashboard/components/MiniBarChart'

interface Enrollment {
  id: string
  student: { id: string; full_name: string; level: string | null; status: string }
}

const STATUSES: { value: AttendanceStatus; label: string; color: string; bg: string }[] = [
  { value: 'present', label: 'Có mặt',    color: '#16a34a', bg: '#dcfce7' },
  { value: 'late',    label: 'Muộn',      color: '#d97706', bg: '#fef3c7' },
  { value: 'excused', label: 'Vắng phép', color: '#2563eb', bg: '#dbeafe' },
  { value: 'absent',  label: 'Vắng',      color: '#dc2626', bg: '#fee2e2' },
]
const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.value, s])) as Record<AttendanceStatus, typeof STATUSES[0]>
const today = () => new Date().toISOString().slice(0, 10)

/* ─── Note cell ─────────────────────────────────────────── */
const NoteCell: React.FC<{ id: string; notes: string; onSave: (id: string, n: string) => void }> = ({ id, notes, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const start = () => { setDraft(notes); setEditing(true) }
  const commit = () => { onSave(id, draft); setEditing(false) }
  if (editing) return (
    <input
      autoFocus value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      placeholder="Ghi chú..."
      style={{
        width: '100%', height: 30, padding: '0 10px', boxSizing: 'border-box',
        borderRadius: 7, border: '1.5px solid var(--primary)',
        fontSize: 12, fontFamily: 'var(--font)', outline: 'none',
        background: 'var(--card)', color: 'var(--text-1)',
      }}
    />
  )
  return (
    <span
      onClick={start}
      style={{
        cursor: 'pointer', fontSize: 12, display: 'block', padding: '4px 2px',
        color: notes ? 'var(--text-2)' : 'var(--text-4)',
        fontStyle: notes ? 'normal' : 'italic',
      }}
    >
      {notes || '+ Ghi chú'}
    </span>
  )
}

/* ─── Row ────────────────────────────────────────────────── */
interface RowProps {
  index: number
  enrollment: Enrollment
  status: AttendanceStatus | null
  notes: string
  saving: boolean
  onStatus: (s: AttendanceStatus) => void
  onNote: (n: string) => void
  onHistory: () => void
}

const Row: React.FC<RowProps> = ({ index, enrollment: e, status, notes, saving, onStatus, onNote, onHistory }) => {
  const [hov, setHov] = useState(false)
  const si = status ? STATUS_MAP[status] : null

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 1fr 268px 180px',
        alignItems: 'center',
        minHeight: 56,
        borderBottom: '1px solid var(--border-light)',
        background: hov ? 'var(--hover-bg)' : 'transparent',
        transition: 'background 0.12s',
        position: 'relative',
        paddingLeft: 4,
      }}
    >
      {/* Status accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 8, bottom: 8, width: 3,
        borderRadius: '0 3px 3px 0',
        background: si?.color ?? 'transparent',
        transition: 'background 0.2s',
      }} />

      {/* # */}
      <div style={{ paddingLeft: 16, fontSize: 12, color: 'var(--text-4)', fontWeight: 500 }}>
        {index + 1}
      </div>

      {/* Student */}
      <button
        onClick={onHistory}
        style={{ background: 'none', border: 'none', padding: '0 12px 0 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}
      >
        <Avatar initials={e.student.full_name[0]} size={34} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)', lineHeight: 1.3 }}>
            {e.student.full_name}
          </div>
          {e.student.level && (
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{e.student.level}</div>
          )}
        </div>
      </button>

      {/* Segmented status control */}
      <div style={{
        display: 'inline-flex', background: 'var(--hover-bg)',
        borderRadius: 10, padding: 3, gap: 2,
      }}>
        {STATUSES.map(s => {
          const active = status === s.value
          return (
            <button
              key={s.value}
              onClick={() => onStatus(s.value)}
              disabled={saving}
              title={s.label}
              style={{
                padding: '5px 11px', borderRadius: 7, border: 'none',
                fontSize: 12, fontWeight: active ? 700 : 500,
                background: active ? s.bg : 'transparent',
                color: active ? s.color : 'var(--text-4)',
                cursor: saving ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {saving && active
                ? <Icon name="loader" size={12} style={{ animation: 'spin 0.8s linear infinite', display: 'block' }} />
                : s.label}
            </button>
          )
        })}
      </div>

      {/* Note */}
      <div style={{ paddingRight: 20, paddingLeft: 12 }}>
        <NoteCell id={e.id} notes={notes} onSave={onNote} />
      </div>
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
interface AttendanceProps {
  params?: { classId?: string }
}

export const Attendance: React.FC<AttendanceProps> = ({ params }) => {
  const confirm  = useConfirm()
  const toast    = useToast()

  const [selClassId,    setSelClassId]    = useState('')
  const [date,          setDate]          = useState(today())
  const [search,        setSearch]        = useState('')
  const [att,           setAtt]           = useState<Record<string, DbAttendance | { status: AttendanceStatus; notes: string | null }>>({})
  const [savingId,      setSavingId]      = useState<string | null>(null)
  const [bulkSaving,    setBulkSaving]    = useState(false)
  const [historyStudent,setHistoryStudent]= useState<{ id: string; name: string } | null>(null)
  const [stats,         setStats]         = useState<{ rate: number; totalSessions: number } | null>(null)
  const [daily,         setDaily]         = useState<{ date: string; rate: number; total: number }[]>([])

  /* stable refs so callbacks stay referentially stable */
  const attRef  = useRef(att);  useEffect(() => { attRef.current  = att  }, [att])
  const dateRef = useRef(date); useEffect(() => { dateRef.current = date }, [date])

  const { data: classes } = useQuery(() => getClasses({ status: 'active' }))
  useEffect(() => {
    if (params?.classId) {
      setSelClassId(params.classId)
    } else if (!selClassId && classes?.length) {
      setSelClassId((classes[0] as any).id)
    }
  }, [classes, selClassId, params])

  const fetchEnrollments = useCallback(
    () => selClassId ? getEnrollmentsByClass(selClassId) : Promise.resolve([]),
    [selClassId],
  )
  const { data: enrollments, loading } = useQuery(fetchEnrollments, [selClassId])

  useEffect(() => {
    if (!selClassId || !date) { setAtt({}); return }
    getAttendanceByClassDate(selClassId, date).then(setAtt).catch(console.error)
  }, [selClassId, date])

  useEffect(() => {
    if (!selClassId) { setStats(null); setDaily([]); return }
    const from30 = new Date(); from30.setDate(from30.getDate() - 30)
    getClassAttendanceStats(selClassId, from30.toISOString().slice(0, 10), today())
      .then(s => setStats({ rate: s.rate, totalSessions: s.totalSessions }))
      .catch(console.error)

    const from14 = new Date(); from14.setDate(from14.getDate() - 13)
    getClassDailyAttendance(selClassId, from14.toISOString().slice(0, 10), today())
      .then(d => setDaily(d.map(x => ({ date: x.date, rate: x.rate, total: x.total }))))
      .catch(console.error)
  }, [selClassId])

  const all = useMemo(() => (enrollments as unknown as Enrollment[] | undefined) ?? [], [enrollments])
  const filtered = useMemo(() => {
    if (!search.trim()) return all
    const q = search.toLowerCase()
    return all.filter(e => e.student.full_name.toLowerCase().includes(q))
  }, [all, search])

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, excused: 0, absent: 0, unmarked: 0 }
    for (const e of all) {
      const a = att[e.id]
      if (!a) c.unmarked++; else c[a.status as AttendanceStatus]++
    }
    return c
  }, [att, all])

  const total       = all.length
  const marked      = total - counts.unmarked
  const progressPct = total > 0 ? Math.round((marked / total) * 100) : 0

  /* ─── Chart data ─── */
  const donutSegments = useMemo(() => ([
    { value: counts.present,  color: '#16a34a', label: 'Có mặt' },
    { value: counts.late,     color: '#d97706', label: 'Muộn' },
    { value: counts.excused,  color: '#2563eb', label: 'Vắng phép' },
    { value: counts.absent,   color: '#dc2626', label: 'Vắng' },
    { value: counts.unmarked, color: '#e5e7eb', label: 'Chưa điểm' },
  ].filter(s => s.value > 0)), [counts])

  const dailySeries = useMemo(() => {
    const map = new Map(daily.map(d => [d.date, d]))
    const todayStr = today()
    const series: { value: number; label: string; highlight: boolean; date: string; total: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i)
      const ds = dt.toISOString().slice(0, 10)
      let rate = 0, totalDay = 0
      if (ds === todayStr) {
        // live override with current counts
        const t = counts.present + counts.late + counts.absent + counts.excused
        rate = t > 0 ? Math.round(((counts.present + counts.late) / t) * 100) : (map.get(ds)?.rate ?? 0)
        totalDay = t || (map.get(ds)?.total ?? 0)
      } else {
        rate = map.get(ds)?.rate ?? 0
        totalDay = map.get(ds)?.total ?? 0
      }
      series.push({
        value: rate, total: totalDay,
        label: `${dt.getDate()}/${dt.getMonth() + 1}`,
        highlight: ds === date, date: ds,
      })
    }
    return series
  }, [daily, counts, date])

  /* stable callbacks */
  const handleStatus = useCallback(async (enrollmentId: string, status: AttendanceStatus) => {
    setSavingId(enrollmentId)
    try {
      const result = await upsertAttendance({
        enrollment_id: enrollmentId, session_date: dateRef.current, status,
        notes: (attRef.current[enrollmentId] as any)?.notes ?? null,
      })
      setAtt(p => ({ ...p, [enrollmentId]: result }))
    } finally { setSavingId(null) }
  }, [])

  const handleNote = useCallback(async (enrollmentId: string, notes: string) => {
    setSavingId(enrollmentId)
    try {
      const status = (attRef.current[enrollmentId] as any)?.status ?? 'present'
      const result = await upsertAttendance({
        enrollment_id: enrollmentId, session_date: dateRef.current, status,
        notes: notes.trim() || null,
      })
      setAtt(p => ({ ...p, [enrollmentId]: result }))
    } finally { setSavingId(null) }
  }, [])

  const handleBulkPresent = async () => {
    if (!all.length) return
    const ok = await confirm({ title: 'Điểm danh hàng loạt', message: `Đặt ${all.length} học viên thành "Có mặt"?`, confirmLabel: 'Xác nhận', variant: 'primary' })
    if (!ok) return
    setBulkSaving(true)
    try {
      await bulkUpsertAttendance(all.map(e => ({ enrollment_id: e.id, session_date: date, status: 'present' as AttendanceStatus })))
      setAtt(await getAttendanceByClassDate(selClassId, date))
      toast.success(`Đã điểm danh ${all.length} học viên`)
    } catch (e: any) { toast.error('Lỗi: ' + e.message) }
    finally { setBulkSaving(false) }
  }

  const handleExport = async () => {
    if (!all.length) return
    const klass = (classes as any[] | undefined)?.find(c => c.id === selClassId)
    const from = new Date(); from.setDate(from.getDate() - 30)
    const fromStr = from.toISOString().slice(0, 10); const toStr = today()
    const { getStudentAttendanceHistory } = await import('../../services/attendance')
    const rows = await Promise.all(all.map(async e => {
      const hist = await getStudentAttendanceHistory(e.student.id, fromStr, toStr)
      const c = { present: 0, absent: 0, late: 0, excused: 0 }
      hist.forEach(h => c[h.status as AttendanceStatus]++)
      const t = c.present + c.absent + c.late + c.excused
      return { studentName: e.student.full_name, level: e.student.level, ...c, rate: t > 0 ? Math.round(((c.present + c.late) / t) * 100) : 0 }
    }))
    exportAttendanceReport({ className: klass?.name ?? 'Lớp', fromDate: fromStr, toDate: toStr, rows, totalSessions: stats?.totalSessions ?? 0 })
  }

  const selectedClass = (classes as any[] | undefined)?.find(c => c.id === selClassId)

  /* ── Render ── */
  return (
    <div>
      <PageHeader
        title="Điểm danh"
        subtitle={selectedClass
          ? `${selectedClass.name} · ${new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}`
          : 'Chọn lớp để bắt đầu'}
        actions={<Button icon="download" variant="outline" onClick={handleExport}>Xuất báo cáo tháng</Button>}
      />

      {/* ── Controls ── */}
      <Card animate style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px', flexWrap: 'wrap' }}>

          <select
            value={selClassId} onChange={e => setSelClassId(e.target.value)}
            style={{
              height: 36, padding: '0 30px 0 12px', borderRadius: 8, minWidth: 180,
              border: '1.5px solid var(--border)', background: 'var(--card)',
              color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font)',
              outline: 'none', cursor: 'pointer', appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
            }}
          >
            {(classes as any[] | undefined)?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <input
            type="date" value={date} onChange={e => setDate(e.target.value)} max={today()}
            style={{
              height: 36, padding: '0 10px', borderRadius: 8,
              border: '1.5px solid var(--border)', background: 'var(--card)',
              color: 'var(--text-1)', fontSize: 13, outline: 'none', fontFamily: 'var(--font)',
            }}
          />

          <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
            <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} />
            <input
              placeholder="Tìm học viên..." value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: 36, paddingLeft: 30, paddingRight: 10,
                boxSizing: 'border-box', borderRadius: 8,
                border: '1.5px solid var(--border)', background: 'var(--card)',
                color: 'var(--text-1)', fontSize: 13, outline: 'none', fontFamily: 'var(--font)',
              }}
            />
          </div>

          <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />
          <Button size="sm" variant="outline" icon="check" loading={bulkSaving} onClick={handleBulkPresent}>
            Tất cả có mặt
          </Button>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          padding: '8px 16px', background: 'var(--hover-bg)',
          borderTop: '1px solid var(--border-light)', flexWrap: 'wrap', rowGap: 6,
        }}>
          {[
            { label: 'Có mặt',    val: counts.present,  color: '#16a34a' },
            { label: 'Muộn',      val: counts.late,     color: '#d97706' },
            { label: 'Vắng phép', val: counts.excused,  color: '#2563eb' },
            { label: 'Vắng',      val: counts.absent,   color: '#dc2626' },
            { label: 'Chưa điểm',val: counts.unmarked, color: 'var(--text-3)' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <span style={{ margin: '0 10px', color: 'var(--border)', fontSize: 14 }}>·</span>}
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                <strong style={{ color: s.color, fontWeight: 700 }}>{s.val}</strong>
                {' '}{s.label}
              </span>
            </React.Fragment>
          ))}

          <div style={{ flex: 1 }} />

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 100, height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${progressPct}%`,
                background: progressPct === 100 ? '#16a34a' : 'var(--primary)',
                transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
              {marked}/{total}
            </span>
            {stats && stats.totalSessions > 0 && (
              <>
                <span style={{ color: 'var(--border)', fontSize: 14 }}>·</span>
                <Icon name="trending-up" size={13} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{stats.rate}%</span>
                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>chuyên cần</span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ── Charts ── */}
      <Card animate delay={40} style={{ padding: 0, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>

          {/* Donut: distribution */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', minWidth: 280 }}>
            <div style={{ position: 'relative' }}>
              {donutSegments.length > 0 ? (
                <MiniDonutChart segments={donutSegments} size={120} strokeWidth={14} />
              ) : (
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  border: '14px solid var(--hover-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-3)' }}>0</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)' }}>học viên</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                Phân bố ngày
              </div>
              {([
                { color: '#16a34a', label: 'Có mặt',    val: counts.present  },
                { color: '#d97706', label: 'Muộn',      val: counts.late     },
                { color: '#2563eb', label: 'Vắng phép', val: counts.excused  },
                { color: '#dc2626', label: 'Vắng',      val: counts.absent   },
                { color: '#9ca3af', label: 'Chưa điểm',val: counts.unmarked },
              ]).map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-3)', minWidth: 70 }}>{item.label}</span>
                  <strong style={{ color: 'var(--text-1)', fontWeight: 700, marginLeft: 'auto' }}>{item.val}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1, background: 'var(--border-light)', flexShrink: 0 }} />

          {/* Bar chart: 14-day trend */}
          <div style={{ flex: 1, minWidth: 360, padding: '14px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tỷ lệ chuyên cần 14 ngày qua
              </div>
              {stats && stats.totalSessions > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="trending-up" size={13} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{stats.rate}%</span>
                  <span style={{ fontSize: 11, color: 'var(--text-4)' }}>TB 30 ngày</span>
                </div>
              )}
            </div>
            <MiniBarChart
              data={dailySeries.map(d => ({ value: d.value, label: d.label, highlight: d.highlight }))}
              width={520}
              height={120}
            />
          </div>
        </div>
      </Card>

      {/* ── Student list ── */}
      <Card animate delay={60} style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table head */}
        <div style={{
          display: 'grid', gridTemplateColumns: '48px 1fr 268px 180px',
          padding: '9px 0 9px 4px',
          background: 'var(--hover-bg)', borderBottom: '2px solid var(--border)',
        }}>
          {['#', 'Học viên', 'Trạng thái', 'Ghi chú'].map((h, i) => (
            <div key={h} style={{
              fontSize: 11, fontWeight: 700, color: 'var(--text-4)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              paddingLeft: i === 0 ? 16 : i === 2 ? 0 : i === 3 ? 12 : 0,
              textAlign: i === 2 ? 'center' : 'left',
            }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-4)' }}>
            <Icon name="loader" size={22} style={{ display: 'block', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} />
            Đang tải danh sách học viên...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-4)' }}>
            <Icon name="users" size={30} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.2 }} />
            {search ? 'Không tìm thấy học viên phù hợp' : 'Lớp chưa có học viên'}
          </div>
        ) : (
          filtered.map((e, i) => (
            <Row
              key={e.id}
              index={i}
              enrollment={e}
              status={(att[e.id]?.status as AttendanceStatus) ?? null}
              notes={(att[e.id] as any)?.notes ?? ''}
              saving={savingId === e.id}
              onStatus={s => handleStatus(e.id, s)}
              onNote={n => handleNote(e.id, n)}
              onHistory={() => setHistoryStudent({ id: e.student.id, name: e.student.full_name })}
            />
          ))
        )}
      </Card>

      {historyStudent && (
        <StudentAttendanceModal
          open
          onClose={() => setHistoryStudent(null)}
          studentId={historyStudent.id}
          studentName={historyStudent.name}
        />
      )}
    </div>
  )
}

export default Attendance
