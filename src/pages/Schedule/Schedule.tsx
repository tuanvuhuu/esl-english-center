import React, { useState, useMemo, useRef } from 'react'
import { PageHeader, Button, Card, Tabs, Icon, Modal, InfoRow, Badge, StatusBadge } from '../../components'
import { getClasses, getEnrollmentsByClass, getTeachers } from '../../services'
import { useQuery } from '../../hooks'
import { mapClass, mapTeacher } from '../../lib/mappers'
import type { Class } from '../../types/data'

// ─── helpers ─────────────────────────────────────────────────────────────────

const LVL_C: Record<string, string> = {
  A1: '#FF6B35', A2: '#3B82F6', B1: '#10B981', B2: '#8B5CF6',
  'B2+': '#8B5CF6', 'A1-A2': '#F59E0B', All: '#EC4899',
}

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
// dayMap[i] = day_of_week value (1=Mon…6=Sat, 0=Sun)
const DAY_MAP = [1, 2, 3, 4, 5, 6, 0]

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
               '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

function getPos(t: string): number {
  if (!t) return 0
  const [h, m] = t.split(':').map(Number)
  return (h - 8) * 60 + (m || 0)
}
function getDuration(s: string, e: string): number {
  return getPos(e) - getPos(s)
}

/** Monday of the week containing `date` */
function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function fmtDateFull(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface ClassBlockProps {
  c: Class
  top: number
  height: number
  di?: number
  onSelect?: (c: Class) => void
}

const ClassBlock: React.FC<ClassBlockProps> = ({ c, top, height, di = 0, onSelect }) => {
  const [hovered, setHovered] = useState(false)
  const color = LVL_C[c.level] || 'var(--text-4)'
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect?.(c)}
      style={{
        position: 'absolute',
        top,
        left: 4,
        right: 4,
        height: height - 4,
        background: color + '18',
        border: `1.5px solid ${color}40`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        padding: '6px 8px',
        cursor: 'pointer',
        overflow: 'hidden',
        fontSize: 11,
        transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s',
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
        boxShadow: hovered ? `0 4px 16px ${color}30` : 'none',
        zIndex: hovered ? 10 : 1,
        animation: `scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) ${di * 40}ms both`,
      }}
    >
      <div style={{ fontWeight: 700, color, fontSize: 12, lineHeight: 1.2, marginBottom: 2 }}>{c.name}</div>
      <div style={{ color: 'var(--text-3)', lineHeight: 1.3 }}>{c.teacher.split(' ').pop()}</div>
      <div style={{ color: 'var(--text-4)' }}>
        {c.room || '—'} · {c.students} HV
      </div>
      {c.assistantNames && c.assistantNames.length > 0 && height > 80 && (
        <div style={{ color: 'var(--text-4)', marginTop: 2 }}>
          TG: {c.assistantNames.join(', ')}
        </div>
      )}
    </div>
  )
}

// ─── Week view ───────────────────────────────────────────────────────────────

interface WeekViewProps {
  classes: Class[]
  monday: Date
  onSelect: (c: Class) => void
}

const WeekView: React.FC<WeekViewProps> = ({ classes, monday, onSelect }) => {
  const classesForDay = (di: number) =>
    classes.filter(c => c.days?.includes(DAY_MAP[di]))

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)', minWidth: 900 }}>
        {/* Header row */}
        <div style={{ padding: '14px 8px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border-light)', background: 'var(--table-header)' }} />
        {DAY_LABELS.map((d, i) => {
          const dayDate = addDays(monday, i)
          const isToday = fmtDateFull(dayDate) === fmtDateFull(new Date())
          return (
            <div
              key={i}
              style={{
                padding: '14px 12px',
                borderBottom: '1px solid var(--border)',
                borderRight: i < 6 ? '1px solid var(--border-light)' : 'none',
                background: isToday ? 'var(--primary-bg, rgba(99,102,241,0.06))' : 'var(--table-header)',
                textAlign: 'center',
                transition: 'background 0.35s',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? 'var(--primary)' : 'var(--text-3)' }}>{d}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--text-1)', marginTop: 1 }}>
                {fmtDate(dayDate)}
              </div>
            </div>
          )
        })}

        {/* Time column */}
        <div style={{ position: 'relative', borderRight: '1px solid var(--border-light)' }}>
          {HOURS.map((h, i) => (
            <div key={i} style={{ height: 60, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>{h}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAY_LABELS.map((_, di) => {
          const dc = classesForDay(di)
          const isWeekend = di >= 5
          return (
            <div
              key={di}
              style={{
                position: 'relative',
                height: HOURS.length * 60,
                borderRight: di < 6 ? '1px solid var(--border-light)' : 'none',
                background: isWeekend ? 'var(--table-header)' : 'transparent',
                transition: 'background 0.35s',
              }}
            >
              {HOURS.map((_, hi) => (
                <div key={hi} style={{ position: 'absolute', top: hi * 60, left: 0, right: 0, height: 1, background: 'var(--border-light)' }} />
              ))}
              {dc.map(c => (
                <ClassBlock
                  key={c.id}
                  c={c}
                  top={(getPos(c.time || '08:00') / 60) * 60}
                  height={(getDuration(c.time || '08:00', c.endTime || '09:00') / 60) * 60}
                  di={di}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Day view ────────────────────────────────────────────────────────────────

interface DayViewProps {
  classes: Class[]
  date: Date
  onPrev: () => void
  onNext: () => void
  onSelect: (c: Class) => void
}

const DayView: React.FC<DayViewProps> = ({ classes, date, onPrev, onNext, onSelect }) => {
  const jsDay = date.getDay() // 0=Sun
  // day_of_week matches DAY_MAP: 0=Sun,1=Mon,...6=Sat
  const dayClasses = classes.filter(c => c.days?.includes(jsDay))
  const label = DAY_LABELS[jsDay === 0 ? 6 : jsDay - 1]

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Day selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <button onClick={onPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
          <Icon name="chevron-left" size={18} />
        </button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{label} · {fmtDateFull(date)}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{dayClasses.length} lớp học</div>
        </div>
        <button onClick={onNext} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
          <Icon name="chevron-right" size={18} />
        </button>
      </div>

      {dayClasses.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-4)', fontSize: 14 }}>
          <Icon name="calendar" size={32} style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          Không có lớp học ngày này
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', minWidth: 600 }}>
          {/* Time column */}
          <div style={{ borderRight: '1px solid var(--border-light)' }}>
            {HOURS.map((h, i) => (
              <div key={i} style={{ height: 80, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>{h}</span>
              </div>
            ))}
          </div>

          {/* Classes column */}
          <div style={{ position: 'relative', height: HOURS.length * 80 }}>
            {HOURS.map((_, hi) => (
              <div key={hi} style={{ position: 'absolute', top: hi * 80, left: 0, right: 0, height: 1, background: 'var(--border-light)' }} />
            ))}
            {dayClasses.map(c => {
              const top = (getPos(c.time || '08:00') / 60) * 80
              const height = (getDuration(c.time || '08:00', c.endTime || '09:00') / 60) * 80
              const color = LVL_C[c.level] || 'var(--text-4)'
              return (
                <div
                  key={c.id}
                  onClick={() => onSelect(c)}
                  style={{
                    position: 'absolute',
                    top,
                    left: 8,
                    right: 8,
                    height: height - 6,
                    background: color + '18',
                    border: `1.5px solid ${color}40`,
                    borderLeft: `4px solid ${color}`,
                    borderRadius: 12,
                    padding: '10px 14px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    animation: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color, fontSize: 14 }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{c.time}–{c.endTime}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                    <span><Icon name="graduation" size={11} style={{ marginRight: 4 }} />{c.teacher || 'Chưa phân công'}</span>
                    {c.assistantNames && c.assistantNames.length > 0 && (
                      <span><Icon name="users" size={11} style={{ marginRight: 4 }} />{c.assistantNames.join(', ')}</span>
                    )}
                    <span><Icon name="building" size={11} style={{ marginRight: 4 }} />{c.room || '—'}</span>
                    <span><Icon name="users" size={11} style={{ marginRight: 4 }} />{c.students}/{c.maxStudents} HV</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Class detail modal ───────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
}

interface ClassDetailModalProps {
  c: Class
  onClose: () => void
}

const ClassDetailModal: React.FC<ClassDetailModalProps> = ({ c, onClose }) => {
  const [showStudents, setShowStudents] = useState(false)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentError, setStudentError] = useState<string | null>(null)

  const color    = LVL_C[c.level] || 'var(--text-4)'
  const pct      = Math.round((c.students / c.maxStudents) * 100)
  const barColor = pct > 85 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981'

  const STATUS_LABEL: Record<string, string> = {
    active: 'Đang học', trial: 'Học thử', paused: 'Tạm nghỉ', inactive: 'Nghỉ học',
  }
  const STATUS_COLOR: Record<string, string> = {
    active: '#10B981', trial: '#3B82F6', paused: '#F59E0B', inactive: '#6B7280',
  }

  const handleViewStudents = async () => {
    setLoadingStudents(true)
    setStudentError(null)
    try {
      const rows = await getEnrollmentsByClass(String(c.id))
      setEnrollments(rows)
    } catch (err) {
      setStudentError(err instanceof Error ? err.message : 'Không thể tải danh sách học viên')
      setEnrollments([])
    } finally {
      setLoadingStudents(false)
      setShowStudents(true)
    }
  }

  return (
    <>
      <Modal open onClose={onClose} title="Chi tiết lớp học" width={560}>
        {/* Header banner */}
        <div style={{ padding: '16px 20px', background: color + '12', borderRadius: 14, marginBottom: 20, borderLeft: `4px solid ${color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)' }}>{c.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>
                {c.level}{c.ageGroup ? ` · ${c.ageGroup} tuổi` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <StatusBadge status={c.status} />
              <button
                onClick={handleViewStudents}
                disabled={loadingStudents}
                title="Xem danh sách học viên"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: (pct > 85 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981') + '18',
                  color: pct > 85 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981',
                  border: 'none', borderRadius: 8, padding: '4px 10px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
                }}
              >
                {c.students}/{c.maxStudents} học viên
                <Icon name="eye" size={13} />
              </button>
            </div>
          </div>
          <div style={{ marginTop: 12, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <InfoRow icon="graduation" label="Giáo viên"  value={c.teacher || 'Chưa phân công'} />
          <InfoRow icon="users"      label="Trợ giảng"  value={c.assistantNames?.join(', ') || 'Chưa có'} />
          <InfoRow icon="calendar"   label="Lịch học"   value={c.schedule || '—'} />
          <InfoRow icon="clock"      label="Giờ học"    value={c.time && c.endTime ? `${c.time} – ${c.endTime}` : '—'} />
          <InfoRow icon="building"   label="Phòng"      value={c.room || '—'} />
          <InfoRow icon="wallet"     label="Học phí"    value={c.fee || 'Miễn phí'} />
          <InfoRow icon="clock"      label="Khoá học"   value={`${c.startDate || '?'} → ${c.endDate || '?'}`} />
        </div>

      </Modal>

      {/* Student list modal */}
      {showStudents && (
        <Modal open onClose={() => setShowStudents(false)} title={`Học viên · ${c.name}`} width={560}>
          {studentError ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--error)', fontSize: 14 }}>
              <Icon name="alert" size={32} style={{ display: 'block', margin: '0 auto 12px' }} />
              {studentError}
            </div>
          ) : enrollments.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-4)', fontSize: 14 }}>
              <Icon name="users" size={32} style={{ display: 'block', margin: '0 auto 12px' }} />
              Chưa có học viên
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {enrollments.map((e: any) => {
                const s = e.student
                if (!s) return null
                const statusColor = STATUS_COLOR[s.status] ?? '#6B7280'
                return (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', background: 'var(--hover-bg)', borderRadius: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: statusColor + '22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: statusColor, flexShrink: 0,
                    }}>
                      {initials(s.full_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 14,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.full_name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>
                        {s.level || 'N/A'} · Nhập học {e.enrolled_date ? e.enrolled_date.split('-').reverse().join('/') : '—'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                      background: statusColor + '18', color: statusColor,
                    }}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Modal>
      )}
    </>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export const Schedule: React.FC = () => {
  const [viewType, setViewType] = useState<'week' | 'day'>('week')
  const [baseDate, setBaseDate] = useState(() => new Date())
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [teacherFilter, setTeacherFilter] = useState<string>('')
  const [exporting, setExporting] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const handleExportPDF = async () => {
    if (!calendarRef.current) return
    setExporting(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: getComputedStyle(document.documentElement)
          .getPropertyValue('--bg') || '#ffffff',
      })
      const imgW = 297  // A4 landscape width mm
      const imgH = (canvas.height * imgW) / canvas.width
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH)
      const label = viewType === 'week'
        ? `lich-hoc-tuan-${weekLabel.replace(/\//g, '-')}`
        : `lich-hoc-ngay-${fmtDateFull(baseDate).replace(/\//g, '-')}`
      pdf.save(`${label}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  const { data: rawClasses, loading } = useQuery(getClasses)
  const { data: rawTeachers } = useQuery(getTeachers)

  const teachers = useMemo(
    () => (rawTeachers ?? []).map(mapTeacher).filter(t => t.status === 'active'),
    [rawTeachers],
  )

  const classes: Class[] = useMemo(() => {
    const active = (rawClasses ?? []).map(mapClass).filter(c => c.status === 'active')
    if (!teacherFilter) return active
    return active.filter(c =>
      String(c.teacherId) === teacherFilter ||
      (c.assistantIds ?? []).includes(teacherFilter)
    )
  }, [rawClasses, teacherFilter])

  const monday = useMemo(() => weekStart(baseDate), [baseDate])

  const weekLabel = useMemo(() => {
    const sun = addDays(monday, 6)
    return `${fmtDate(monday)} – ${fmtDate(sun)}/${sun.getFullYear()}`
  }, [monday])

  const goWeekPrev = () => setBaseDate(d => addDays(d, -7))
  const goWeekNext = () => setBaseDate(d => addDays(d, 7))
  const goDayPrev  = () => setBaseDate(d => addDays(d, -1))
  const goDayNext  = () => setBaseDate(d => addDays(d, 1))
  const goToday    = () => setBaseDate(new Date())

  return (
    <div>
      <PageHeader
        title="Lịch học"
        subtitle={viewType === 'week' ? `Tuần · ${weekLabel}` : `Ngày · ${fmtDateFull(baseDate)}`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={teacherFilter}
              onChange={e => setTeacherFilter(e.target.value)}
              style={{
                height: 32, padding: '0 10px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--border)', background: 'var(--card-bg)',
                color: teacherFilter ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer', fontFamily: 'var(--font)', outline: 'none',
                minWidth: 160,
              }}
            >
              <option value=''>Tất cả giáo viên</option>
              {teachers.map(t => (
                <option key={t.id} value={String(t.id)}>{t.name}</option>
              ))}
            </select>
            {viewType === 'week' && (
              <>
                <button onClick={goWeekPrev} title="Tuần trước"
                  style={{ background: 'var(--hover-bg)', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                  <Icon name="chevron-left" size={16} />
                </button>
                <button onClick={goWeekNext} title="Tuần sau"
                  style={{ background: 'var(--hover-bg)', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
                  <Icon name="chevron-right" size={16} />
                </button>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={goToday}>Hôm nay</Button>
            <Tabs
              tabs={[
                { id: 'week', label: 'Tuần' },
                { id: 'day',  label: 'Ngày' },
              ]}
              active={viewType}
              onChange={v => setViewType(v as 'week' | 'day')}
            />
            <Button icon="download" variant="secondary" size="sm" onClick={handleExportPDF} disabled={exporting}>
              {exporting ? 'Đang xuất…' : 'Xuất PDF'}
            </Button>
          </div>
        }
      />

      <div ref={calendarRef}>
      <Card animate style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-4)' }}>Đang tải lịch học…</div>
        ) : viewType === 'week' ? (
          <WeekView classes={classes} monday={monday} onSelect={setSelectedClass} />
        ) : (
          <DayView classes={classes} date={baseDate} onPrev={goDayPrev} onNext={goDayNext} onSelect={setSelectedClass} />
        )}
      </Card>
      </div>

      {selectedClass && (
        <ClassDetailModal c={selectedClass} onClose={() => setSelectedClass(null)} />
      )}
    </div>
  )
}

export default Schedule
