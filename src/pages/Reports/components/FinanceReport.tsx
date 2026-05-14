import React, { useMemo } from 'react'
import { Card, Avatar, DataGrid, Badge } from '../../../components'
import type { DataGridColumn } from '../../../components'
import { useQuery } from '../../../hooks'
import { getPayments } from '../../../services'
import { KpiStat, SectionHeader, HorizontalBars, inRange, getDateRange, type RangePreset, VND_SHORT, addMonths, monthKey, monthLabel, exportCsv } from './reportShared'
import { MiniDonutChart } from '../../Dashboard/components/MiniDonutChart'
import type { DbPayment } from '../../../types/database'

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt', bank_transfer: 'Chuyển khoản', momo: 'MoMo', vnpay: 'VNPay',
}
const METHOD_COLOR: Record<string, string> = {
  cash: '#16a34a', bank_transfer: '#2563eb', momo: '#ec4899', vnpay: '#8b5cf6',
}

interface Props { range: RangePreset }

export const FinanceReport: React.FC<Props> = ({ range }) => {
  const { data: payments, loading } = useQuery(() => getPayments())
  const dateRange = useMemo(() => getDateRange(range), [range])

  const all = (payments ?? []) as DbPayment[]
  const periodRows = useMemo(
    () => all.filter(p => inRange(p.payment_date ?? p.due_date, dateRange)),
    [all, dateRange],
  )

  const totalPaid = periodRows.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalPending = all.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + (p.amount ?? 0), 0)
  const collectionRate = totalPaid + totalPending > 0 ? Math.round((totalPaid / (totalPaid + totalPending)) * 100) : 0
  const avgTicket = periodRows.length > 0 ? totalPaid / periodRows.filter(p => p.status === 'paid').length : 0

  /* Revenue by month, 12 months */
  const monthly = useMemo(() => {
    const now = new Date()
    const out: { label: string; paid: number; pending: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const dt = addMonths(now, -i)
      const k = monthKey(dt)
      let paid = 0, pending = 0
      for (const p of all) {
        const d = p.payment_date ?? p.due_date
        if (!d || monthKey(new Date(d)) !== k) continue
        if (p.status === 'paid') paid += p.amount ?? 0
        else pending += p.amount ?? 0
      }
      out.push({ label: monthLabel(dt), paid, pending })
    }
    return out
  }, [all])

  /* Method breakdown for period */
  const byMethod = useMemo(() => {
    const counts: Record<string, { count: number; amount: number }> = {}
    for (const p of periodRows.filter(p => p.status === 'paid')) {
      const m = p.payment_method ?? 'other'
      if (!counts[m]) counts[m] = { count: 0, amount: 0 }
      counts[m].count++
      counts[m].amount += p.amount ?? 0
    }
    return counts
  }, [periodRows])

  /* Top debtors */
  const topDebtors = useMemo(() => {
    const map: Record<string, { name: string; amount: number; count: number; maxDays: number }> = {}
    const today = new Date()
    for (const p of all) {
      if (p.status === 'paid') continue
      const name = p.student?.full_name ?? '—'
      if (!map[name]) map[name] = { name, amount: 0, count: 0, maxDays: 0 }
      map[name].count++
      map[name].amount += p.amount ?? 0
      if (p.due_date) {
        const days = Math.floor((today.getTime() - new Date(p.due_date).getTime()) / 86400000)
        if (days > map[name].maxDays) map[name].maxDays = days
      }
    }
    return Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 8)
  }, [all])

  const donutSegments = Object.entries(byMethod).map(([m, v]) => ({
    value: v.amount, color: METHOD_COLOR[m] || '#9ca3af',
  }))

  const maxDebt = Math.max(1, ...topDebtors.map(d => d.amount))
  const debtorBars = topDebtors.map((d, i) => ({
    label: d.name,
    value: d.amount,
    max: maxDebt,
    color: i === 0 ? '#dc2626' : i === 1 ? '#ea580c' : '#d97706',
    sub: VND_SHORT(d.amount) + 'đ',
  }))

  const cols: DataGridColumn<DbPayment>[] = [
    {
      key: 'student', title: 'Học viên', filterable: true,
      filterValue: r => r.student?.full_name ?? '',
      render: r => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar initials={(r.student?.full_name ?? '?')[0]} size={26} />
          <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{r.student?.full_name ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'amount', title: 'Số tiền', align: 'right',
      render: r => <span style={{ fontWeight: 700 }}>{(r.amount ?? 0).toLocaleString('vi-VN')}đ</span>,
    },
    {
      key: 'type', title: 'Loại', filterable: true, filterType: 'select',
      filterOptions: [
        { value: 'tuition', label: 'Học phí' },
        { value: 'material', label: 'Học liệu' },
        { value: 'exam_fee', label: 'Phí thi' },
        { value: 'other', label: 'Khác' },
      ],
      filterValue: r => r.type ?? '',
      render: r => <Badge>{r.type === 'tuition' ? 'Học phí' : r.type === 'material' ? 'Học liệu' : r.type === 'exam_fee' ? 'Phí thi' : 'Khác'}</Badge>,
    },
    {
      key: 'method', title: 'Phương thức',
      render: r => METHOD_LABEL[r.payment_method ?? ''] ?? '—',
    },
    {
      key: 'status', title: 'Trạng thái', filterable: true, filterType: 'select',
      filterOptions: [
        { value: 'paid',    label: 'Đã thu' },
        { value: 'pending', label: 'Chờ thu' },
        { value: 'overdue', label: 'Quá hạn' },
      ],
      filterValue: r => r.status,
      render: r => {
        const colors = { paid: '#16a34a', pending: '#d97706', overdue: '#dc2626', cancelled: '#6b7280' }
        const labels = { paid: 'Đã thu', pending: 'Chờ thu', overdue: 'Quá hạn', cancelled: 'Đã huỷ' }
        return <Badge style={{ background: colors[r.status as keyof typeof colors] + '20', color: colors[r.status as keyof typeof colors] }}>
          {labels[r.status as keyof typeof labels]}
        </Badge>
      },
    },
    {
      key: 'date', title: 'Ngày',
      render: r => {
        const d = r.payment_date ?? r.due_date
        return d ? new Date(d).toLocaleDateString('vi-VN') : '—'
      },
    },
  ]

  const handleExport = () => {
    exportCsv('bao-cao-tai-chinh',
      ['Học viên', 'Lớp', 'Số tiền', 'Loại', 'Phương thức', 'Trạng thái', 'Ngày thu', 'Hạn'],
      periodRows.map(p => [
        p.student?.full_name ?? '',
        p.class?.name ?? '',
        p.amount ?? 0,
        p.type ?? '',
        METHOD_LABEL[p.payment_method ?? ''] ?? '',
        p.status,
        p.payment_date ?? '',
        p.due_date ?? '',
      ]),
    )
  }

  return (
    <div>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <KpiStat label="Đã thu kỳ này" value={VND_SHORT(totalPaid) + 'đ'}
          sub={<span>{periodRows.filter(p => p.status === 'paid').length} phiếu</span>}
          icon="dollar" color="#16a34a" bg="#dcfce7" delay={0} />
        <KpiStat label="Tổng công nợ" value={VND_SHORT(totalPending) + 'đ'}
          sub={<span>{all.filter(p => p.status === 'pending' || p.status === 'overdue').length} phiếu chưa thu</span>}
          icon="alert-circle" color="#d97706" bg="#fef3c7" delay={70} />
        <KpiStat label="Tỷ lệ thu" value={collectionRate + '%'}
          sub={
            <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginTop: 4 }}>
              <div style={{ height: '100%', width: `${collectionRate}%`, background: '#16a34a', borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
          }
          icon="trending-up" color="#2563eb" bg="#dbeafe" delay={140} />
        <KpiStat label="Giá trị TB/phiếu" value={VND_SHORT(avgTicket) + 'đ'}
          sub={<span>Avg ticket size</span>}
          icon="bar-chart" color="#8b5cf6" bg="#ede9fe" delay={210} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 12, marginBottom: 14 }}>
        <Card animate delay={280} style={{ padding: 18 }}>
          <SectionHeader title="Doanh thu 12 tháng" subtitle="Đã thu vs chờ thu theo tháng" icon="trending-up" iconColor="#16a34a" />
          <RevenueBars data={monthly} />
        </Card>

        <Card animate delay={350} style={{ padding: 18 }}>
          <SectionHeader title="Phương thức thanh toán" subtitle="Trong kỳ" icon="wallet" iconColor="#8b5cf6" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {donutSegments.length > 0 ? (
              <MiniDonutChart segments={donutSegments} size={120} strokeWidth={14} />
            ) : (
              <div style={{ width: 120, height: 120, borderRadius: '50%', border: '14px solid var(--hover-bg)' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              {Object.entries(METHOD_LABEL).map(([k, l]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: METHOD_COLOR[k] }} />
                  <span style={{ color: 'var(--text-3)', flex: 1 }}>{l}</span>
                  <strong style={{ color: 'var(--text-1)' }}>{VND_SHORT(byMethod[k]?.amount ?? 0)}đ</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top debtors */}
      <Card animate delay={420} style={{ padding: 18, marginBottom: 14 }}>
        <SectionHeader title="Top học viên nợ học phí"
          subtitle={`${topDebtors.length} người nợ nhiều nhất`}
          icon="alert" iconColor="#dc2626" />
        {debtorBars.length > 0 ? <HorizontalBars rows={debtorBars} labelWidth={180} /> : (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-4)', fontSize: 12 }}>
            Tuyệt vời, không có học viên nào nợ!
          </div>
        )}
      </Card>

      {/* Table */}
      <DataGrid<DbPayment>
        title="Chi tiết phiếu thu trong kỳ"
        subtitle={`${periodRows.length} phiếu`}
        data={periodRows}
        columns={cols}
        rowKey={r => r.id}
        emptyText="Không có phiếu thu trong kỳ này"
        loading={loading}
        defaultPageSize={20}
        exportFilename="phieu-thu-ky"
        actions={
          <button onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: 28,
              borderRadius: 7, border: '1px solid var(--border)', background: 'var(--card)',
              color: 'var(--text-2)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer',
            }}
          >Xuất CSV chi tiết</button>
        }
      />
    </div>
  )
}

/* Stacked bar chart for monthly revenue */
const RevenueBars: React.FC<{ data: { label: string; paid: number; pending: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.paid + d.pending), 1) * 1.1
  const W = 600, H = 180
  const barW = (W / data.length) * 0.55
  const slot = W / data.length
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} width="100%" style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={0} y1={H * (1 - p)} x2={W} y2={H * (1 - p)}
          stroke="var(--border-light)" strokeWidth="1" strokeDasharray="2 4" />
      ))}
      {data.map((d, i) => {
        const total = d.paid + d.pending
        const totalH = (total / max) * H
        const paidH = total > 0 ? (d.paid / total) * totalH : 0
        const pendingH = totalH - paidH
        const x = i * slot + (slot - barW) / 2
        return (
          <g key={i}>
            {pendingH > 0 && <rect x={x} y={H - totalH} width={barW} height={pendingH} fill="#fbbf24" rx={3} opacity={0.85} />}
            {paidH > 0    && <rect x={x} y={H - paidH}   width={barW} height={paidH}    fill="#16a34a" rx={3} />}
            <text x={x + barW/2} y={H + 16} textAnchor="middle" fontSize="10" fill="var(--text-4)" fontFamily="var(--font)">{d.label}</text>
            {total > 0 && (
              <text x={x + barW/2} y={H - totalH - 4} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--text-3)" fontFamily="var(--font)">
                {total >= 1e6 ? (total/1e6).toFixed(1) + 'tr' : Math.round(total/1e3) + 'k'}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
