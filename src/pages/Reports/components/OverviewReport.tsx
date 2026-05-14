import React, { useMemo } from 'react'
import { Card, Icon } from '../../../components'
import { useQuery } from '../../../hooks'
import { getStudents, getTeachers, getClasses, getPayments, getTests } from '../../../services'
import { KpiStat, VND_SHORT, inRange, getDateRange, type RangePreset, addMonths, monthKey, monthLabel } from './reportShared'
import { MiniAreaChart } from '../../Dashboard/components/MiniAreaChart'

interface OverviewReportProps {
  range: RangePreset
  onJump: (tab: string) => void
}

export const OverviewReport: React.FC<OverviewReportProps> = ({ range, onJump }) => {
  const { data: students }  = useQuery(getStudents)
  const { data: teachers }  = useQuery(getTeachers)
  const { data: classes }   = useQuery(() => getClasses())
  const { data: payments }  = useQuery(() => getPayments())
  const { data: tests }     = useQuery(getTests)

  const dateRange = useMemo(() => getDateRange(range), [range])

  /* ── Stats ── */
  const studentStats = useMemo(() => {
    const all = students ?? []
    const active = all.filter(s => s.status === 'active').length
    const trial  = all.filter(s => s.status === 'trial').length
    const inRangeCount = all.filter(s => inRange(s.enroll_date, dateRange)).length
    return { total: all.length, active, trial, newInRange: inRangeCount }
  }, [students, dateRange])

  const financeStats = useMemo(() => {
    const all = payments ?? []
    const periodRows = all.filter(p => inRange(p.payment_date ?? p.due_date, dateRange))
    const paid = periodRows.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount ?? 0), 0)
    const pending = all.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + (p.amount ?? 0), 0)
    return { paid, pending, count: periodRows.length }
  }, [payments, dateRange])

  const classStats = useMemo(() => {
    const all = (classes ?? []) as any[]
    const active = all.filter(c => c.status === 'active').length
    return { total: all.length, active }
  }, [classes])

  const testStats = useMemo(() => {
    const all = (tests ?? []) as any[]
    const upcoming = all.filter(t => t.status === 'upcoming').length
    const completed = all.filter(t => t.status === 'completed').length
    return { total: all.length, upcoming, completed }
  }, [tests])

  /* ── Revenue 6-month sparkline ── */
  const revenueSpark = useMemo(() => {
    const now = new Date()
    const series: { value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const dt = addMonths(now, -i)
      const k = monthKey(dt)
      const sum = (payments ?? []).reduce((s, p) => {
        if (p.status !== 'paid' || !p.payment_date) return s
        return monthKey(new Date(p.payment_date)) === k ? s + (p.amount ?? 0) : s
      }, 0)
      series.push({ value: sum })
    }
    return series
  }, [payments])

  /* ── 12-month student growth ── */
  const studentGrowth = useMemo(() => {
    const now = new Date()
    const series: { value: number; label: string }[] = []
    for (let i = 5; i >= 0; i--) {
      const dt = addMonths(now, -i)
      const k = monthKey(dt)
      const count = (students ?? []).filter(s => s.enroll_date && monthKey(new Date(s.enroll_date)) === k).length
      series.push({ value: count, label: monthLabel(dt) })
    }
    return series
  }, [students])

  const teacherCount  = (teachers ?? []).filter(t => t.status === 'active').length

  return (
    <div>
      {/* ── Hero KPI grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <KpiStat
          label="Học viên"
          value={studentStats.total}
          sub={<span>{studentStats.active} đang học · +{studentStats.newInRange} mới</span>}
          icon="users" color="#FF6B35" bg="var(--primary-light)" delay={0}
        />
        <KpiStat
          label="Doanh thu kỳ"
          value={VND_SHORT(financeStats.paid) + 'đ'}
          sub={<span>{financeStats.count} phiếu thu</span>}
          icon="dollar" color="#16a34a" bg="#dcfce7" delay={70}
        />
        <KpiStat
          label="Công nợ"
          value={VND_SHORT(financeStats.pending) + 'đ'}
          sub={<span>cần thu</span>}
          icon="alert-circle" color="#d97706" bg="#fef3c7" delay={140}
        />
        <KpiStat
          label="Lớp đang dạy"
          value={classStats.active}
          sub={<span>{classStats.total} tổng số lớp</span>}
          icon="book" color="#2563eb" bg="#dbeafe" delay={210}
        />
        <KpiStat
          label="Giáo viên"
          value={teacherCount}
          sub={<span>đang hoạt động</span>}
          icon="graduation" color="#8b5cf6" bg="#ede9fe" delay={280}
        />
        <KpiStat
          label="Bài kiểm tra"
          value={testStats.total}
          sub={<span>{testStats.upcoming} sắp tới · {testStats.completed} đã chấm</span>}
          icon="clipboard" color="#ec4899" bg="#fce7f3" delay={350}
        />
      </div>

      {/* ── Trends row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 14 }}>
        <Card animate delay={420} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            Doanh thu 6 tháng
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
            {VND_SHORT(revenueSpark.reduce((s, r) => s + r.value, 0))}đ
          </div>
          <MiniAreaChart data={revenueSpark} width={260} height={50} color="#16a34a" />
        </Card>
        <Card animate delay={490} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            Học viên mới 6 tháng
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
            +{studentGrowth.reduce((s, r) => s + r.value, 0)}
          </div>
          <MiniAreaChart data={studentGrowth} width={260} height={50} color="#FF6B35" />
        </Card>
        <Card animate delay={560} style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
            Tỷ lệ thu trong kỳ
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>
            {financeStats.paid + financeStats.pending > 0
              ? Math.round((financeStats.paid / (financeStats.paid + financeStats.pending)) * 100) + '%'
              : '—'}
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'var(--hover-bg)', overflow: 'hidden', marginTop: 8 }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${financeStats.paid + financeStats.pending > 0 ? (financeStats.paid / (financeStats.paid + financeStats.pending)) * 100 : 0}%`,
              background: '#16a34a',
              transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </Card>
      </div>

      {/* ── Module navigator ── */}
      <Card animate delay={630} style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>
          Xem báo cáo chi tiết
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {([
            { id: 'student',    icon: 'users',      label: 'Học viên',    color: '#FF6B35', bg: 'var(--primary-light)' },
            { id: 'finance',    icon: 'wallet',     label: 'Tài chính',   color: '#16a34a', bg: '#dcfce7' },
            { id: 'attendance', icon: 'clipboard',  label: 'Điểm danh',   color: '#2563eb', bg: '#dbeafe' },
            { id: 'academic',   icon: 'star',       label: 'Học tập',     color: '#8b5cf6', bg: '#ede9fe' },
            { id: 'teacher',    icon: 'graduation', label: 'Giáo viên',   color: '#f59e0b', bg: 'var(--warning-light)' },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => onJump(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                background: 'var(--hover-bg)', border: '1px solid var(--border-light)',
                borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)',
                color: 'var(--text-2)', fontSize: 13, fontWeight: 600, textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = m.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: m.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name={m.icon} size={15} style={{ color: m.color }} />
              </div>
              <span>{m.label}</span>
              <Icon name="chevron-right" size={14} style={{ marginLeft: 'auto', color: 'var(--text-4)' }} />
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
