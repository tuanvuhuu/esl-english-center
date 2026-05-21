import React, { useMemo, useState, useCallback } from 'react'
import { Card, Button, Select, LoadingSpinner, EmptyState, Icon, Avatar, PageHeader, useToast, useConfirm } from '../../components'
import { useQuery, useCRUDPage, useListFilter } from '../../hooks'
import { getPayments, updatePayment, notify, softDeletePayment, cancelPayment, bulkMarkPaid } from '../../services'
import { useAppContext } from '../../context/AppContext'
import { mapPayment } from '../../lib/mappers'
import { PaymentTable } from './PaymentTable'
import { PaymentGrid } from './PaymentGrid'
import { PaymentFormModal } from './PaymentFormModal'
import { MiniAreaChart } from '../Dashboard/components/MiniAreaChart'
import type { DbPayment } from '../../types/database'
import type { Payment } from '../../types/data'

type PaymentRow = { raw: DbPayment; mapped: Payment }

type Period = 'thismonth' | 'quarter' | 'year' | 'all'
type AgingKey = 'all' | 'upcoming' | '1-30' | '31-60' | '60+'

const PERIOD_OPTIONS = [
  { value: 'thismonth', label: 'Tháng này' },
  { value: 'quarter',   label: 'Quý này (3 tháng)' },
  { value: 'year',      label: 'Năm này' },
  { value: 'all',       label: 'Tất cả' },
]

const VND_SHORT = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + ' tỷ'
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + ' tr'
  if (n >= 1e3) return Math.round(n / 1e3) + 'k'
  return n.toLocaleString('vi-VN')
}
const VND = (n: number) => n.toLocaleString('vi-VN') + 'đ'

const monthLabel = (d: Date) => `T${d.getMonth() + 1}`
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`
const addMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const startOfYear  = (d: Date) => new Date(d.getFullYear(), 0, 1)

/* ─── KPI Card ─────────────────────────────────────────── */
interface KpiCardProps {
  label: string
  value: string
  sub?: React.ReactNode
  delta?: { pct: number; label: string } | null
  accent: string
  accentBg: string
  icon: any
  sparkline?: { value: number }[]
  delay?: number
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, delta, accent, accentBg, icon, sparkline, delay = 0 }) => (
  <Card animate delay={delay} hover style={{ padding: 16, position: 'relative', overflow: 'hidden', minHeight: 130 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, background: accentBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={16} style={{ color: accent }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
    </div>

    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
      {value}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 10 }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', flex: 1 }}>
        {delta ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            color: delta.pct >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700,
          }}>
            <Icon name={delta.pct >= 0 ? 'trending-up' : 'trending-down'} size={11} />
            {Math.abs(delta.pct).toFixed(1)}%
            <span style={{ color: 'var(--text-4)', fontWeight: 500, marginLeft: 2 }}>{delta.label}</span>
          </span>
        ) : sub}
      </div>
      {sparkline && sparkline.length >= 2 && (
        <div style={{ width: 80, height: 28, flexShrink: 0 }}>
          <MiniAreaChart data={sparkline} width={80} height={28} color={accent} />
        </div>
      )}
    </div>
  </Card>
)

/* ─── Main Page ─────────────────────────────────────────── */
export const Finance: React.FC = () => {
  const toast = useToast()
  const { selectedBranch, selectedYear } = useAppContext()
  const branchId = selectedBranch?.id
  const yearId   = selectedYear?.id

  const { data: raw, loading, error, refetch } = useQuery(
    () => getPayments({ branchId, academicYearId: yearId }),
    [branchId, yearId],
  )
  const rows: PaymentRow[] = useMemo(
    () => (raw ?? []).map(r => ({ raw: r, mapped: mapPayment(r) })),
    [raw],
  )

  const {
    state: { search, filters, viewMode, showForm, editItem },
    setSearch, setFilter, setViewMode,
    openAdd, openEdit, closeForm,
  } = useCRUDPage<PaymentRow>({ status: 'all', type: 'all' })

  const [markingId, setMarkingId] = useState<string | null>(null)
  const [period, setPeriod]       = useState<Period>('thismonth')
  const [agingPick, setAgingPick] = useState<AgingKey>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [debtorFilter, setDebtorFilter] = useState<string | null>(null)
  const confirm = useConfirm()

  /* ── Period range ── */
  const now = useMemo(() => new Date(), [])
  const periodRange = useMemo(() => {
    if (period === 'all')       return null
    if (period === 'thismonth') return { from: startOfMonth(now), to: now }
    if (period === 'quarter')   return { from: addMonths(startOfMonth(now), -2), to: now }
    return { from: startOfYear(now), to: now }
  }, [period, now])

  const prevPeriodRange = useMemo(() => {
    if (!periodRange) return null
    if (period === 'thismonth') {
      const prev = addMonths(startOfMonth(now), -1)
      return { from: prev, to: new Date(prev.getFullYear(), prev.getMonth() + 1, 0) }
    }
    if (period === 'quarter') {
      return { from: addMonths(startOfMonth(now), -5), to: addMonths(startOfMonth(now), -3) }
    }
    return { from: new Date(now.getFullYear() - 1, 0, 1), to: new Date(now.getFullYear() - 1, 11, 31) }
  }, [period, periodRange, now])

  const inRange = (dateStr: string | null, range: { from: Date; to: Date } | null) => {
    if (!range || !dateStr) return false
    const d = new Date(dateStr)
    return d >= range.from && d <= range.to
  }

  /* ── Period-filtered slices ── */
  const periodRows = useMemo(() => {
    if (!periodRange) return rows
    return rows.filter(r => inRange(r.raw.payment_date ?? r.raw.due_date, periodRange))
  }, [rows, periodRange])

  const prevPeriodRows = useMemo(() => {
    if (!prevPeriodRange) return []
    return rows.filter(r => inRange(r.raw.payment_date ?? r.raw.due_date, prevPeriodRange))
  }, [rows, prevPeriodRange])

  const sumPaid = (rs: PaymentRow[]) =>
    rs.filter(r => r.mapped.status === 'paid')
      .reduce((s, r) => s + (typeof r.mapped.amount === 'number' ? r.mapped.amount : 0), 0)

  const sumPending = (rs: PaymentRow[]) =>
    rs.filter(r => r.mapped.status === 'pending' || r.mapped.status === 'overdue')
      .reduce((s, r) => s + (typeof r.mapped.amount === 'number' ? r.mapped.amount : 0), 0)

  /* ── KPIs ── */
  const totalPaid    = sumPaid(periodRows)
  const totalPending = sumPending(periodRows)
  const totalAll     = totalPaid + totalPending
  const paidCount    = periodRows.filter(r => r.mapped.status === 'paid').length
  const pendingCount = periodRows.length - paidCount
  const collectionRate = totalAll > 0 ? Math.round((totalPaid / totalAll) * 100) : 0

  const prevPaid     = sumPaid(prevPeriodRows)
  const prevPending  = sumPending(prevPeriodRows)
  const deltaPaidPct    = prevPaid    > 0 ? ((totalPaid    - prevPaid)    / prevPaid)    * 100 : 0
  const deltaPendingPct = prevPending > 0 ? ((totalPending - prevPending) / prevPending) * 100 : 0

  /* ── 6-month sparkline (paid revenue) ── */
  const sparkline = useMemo(() => {
    const series: { value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const dt = addMonths(now, -i)
      const k = monthKey(dt)
      const sum = rows.reduce((s, r) => {
        if (r.mapped.status !== 'paid' || !r.raw.payment_date) return s
        if (monthKey(new Date(r.raw.payment_date)) !== k) return s
        return s + (typeof r.mapped.amount === 'number' ? r.mapped.amount : 0)
      }, 0)
      series.push({ value: sum })
    }
    return series
  }, [rows, now])

  /* ── 12-month revenue trend ── */
  const monthlyData = useMemo(() => {
    const series: { label: string; paid: number; pending: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const dt = addMonths(now, -i)
      const k = monthKey(dt)
      let paid = 0, pending = 0
      for (const r of rows) {
        const date = r.raw.payment_date ?? r.raw.due_date
        if (!date) continue
        if (monthKey(new Date(date)) !== k) continue
        const amt = typeof r.mapped.amount === 'number' ? r.mapped.amount : 0
        if (r.mapped.status === 'paid') paid += amt
        else pending += amt
      }
      series.push({ label: monthLabel(dt), paid, pending })
    }
    return series
  }, [rows, now])

  /* ── Aging buckets ── */
  const aging = useMemo(() => {
    const buckets = {
      'upcoming': { count: 0, amount: 0, label: 'Chưa đến hạn',  color: '#0ea5e9', desc: 'sắp đến hạn'   },
      '1-30':     { count: 0, amount: 0, label: '1-30 ngày',     color: '#f59e0b', desc: 'mới quá hạn'   },
      '31-60':    { count: 0, amount: 0, label: '31-60 ngày',    color: '#f97316', desc: 'quá hạn vừa'   },
      '60+':      { count: 0, amount: 0, label: '60+ ngày',      color: '#dc2626', desc: 'quá hạn lâu'   },
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (const r of rows) {
      if (r.mapped.status === 'paid' || r.mapped.status === 'cancelled' as any) continue
      if (!r.raw.due_date) continue
      const due = new Date(r.raw.due_date)
      const days = Math.floor((today.getTime() - due.getTime()) / 86400000)
      const amt = typeof r.mapped.amount === 'number' ? r.mapped.amount : 0
      const k: keyof typeof buckets =
        days <= 0  ? 'upcoming' :
        days <= 30 ? '1-30'     :
        days <= 60 ? '31-60'    : '60+'
      buckets[k].count++
      buckets[k].amount += amt
    }
    return buckets
  }, [rows])

  const agingTotal = aging.upcoming.amount + aging['1-30'].amount + aging['31-60'].amount + aging['60+'].amount

  /* ── Insights ── */
  const upcoming7Days = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + 7)
    return rows.filter(r => {
      if (r.mapped.status === 'paid' || !r.raw.due_date) return false
      const d = new Date(r.raw.due_date)
      return d >= today && d <= cutoff
    })
  }, [rows])
  const upcoming7Amount = upcoming7Days.reduce((s, r) => s + (typeof r.mapped.amount === 'number' ? r.mapped.amount : 0), 0)

  /* ── Top 5 debtors ── */
  const topDebtors = useMemo(() => {
    const map: Record<string, { name: string; amount: number; count: number; maxDays: number }> = {}
    const today = new Date()
    for (const r of rows) {
      if (r.mapped.status === 'paid') continue
      const name = r.mapped.student || 'Không tên'
      if (!map[name]) map[name] = { name, amount: 0, count: 0, maxDays: 0 }
      map[name].count++
      map[name].amount += typeof r.mapped.amount === 'number' ? r.mapped.amount : 0
      if (r.raw.due_date) {
        const d = Math.floor((today.getTime() - new Date(r.raw.due_date).getTime()) / 86400000)
        if (d > map[name].maxDays) map[name].maxDays = d
      }
    }
    return Object.values(map).sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [rows])

  /* ── Table data (with aging filter applied) ── */
  const baseRows = useMemo(() => {
    if (agingPick === 'all') return rows
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return rows.filter(r => {
      if (r.mapped.status === 'paid' || !r.raw.due_date) return false
      const days = Math.floor((today.getTime() - new Date(r.raw.due_date).getTime()) / 86400000)
      if (agingPick === 'upcoming') return days <= 0
      if (agingPick === '1-30')     return days >= 1 && days <= 30
      if (agingPick === '31-60')    return days >= 31 && days <= 60
      if (agingPick === '60+')      return days > 60
      return true
    })
  }, [rows, agingPick])

  const filteredBase = useListFilter(baseRows, search, filters, {
    searchKeys: [r => r.mapped.student, r => r.raw.class?.name ?? '', r => r.mapped.code ?? ''],
    filterMap: {
      status: r => r.mapped.status,
      type:   r => r.raw.type ?? '',
    },
  })
  // Apply debtor filter on top
  const filtered = debtorFilter
    ? filteredBase.filter(r => r.mapped.student === debtorFilter)
    : filteredBase

  const handleMarkPaid = async (id: string) => {
    setMarkingId(id)
    try {
      await updatePayment(id, { status: 'paid', payment_date: new Date().toISOString().split('T')[0] })
      toast.success('Đã đánh dấu đã thu')
      notify('Xác nhận thu học phí', `Đã xác nhận thu học phí thành công`, 'success', { entityType: 'payment', entityId: id })
      refetch()
    } catch (e: any) {
      toast.error(e.message || 'Cập nhật thất bại')
    } finally { setMarkingId(null) }
  }

  const handleCancel = async (id: string) => {
    const ok = await confirm({ title: 'Huỷ phiếu thu?', message: 'Phiếu thu sẽ chuyển sang trạng thái đã huỷ.', confirmLabel: 'Huỷ phiếu', variant: 'danger' })
    if (!ok) return
    try {
      await cancelPayment(id)
      toast.success('Đã huỷ phiếu thu')
      notify('Huỷ phiếu thu', 'Phiếu thu đã được huỷ', 'warning', { entityType: 'payment', entityId: id })
      refetch()
    } catch (e: any) { toast.error(e.message || 'Lỗi') }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Xoá phiếu thu?', message: 'Phiếu thu sẽ bị xoá vĩnh viễn khỏi danh sách.', confirmLabel: 'Xoá', variant: 'danger' })
    if (!ok) return
    try {
      await softDeletePayment(id)
      toast.success('Đã xoá phiếu thu')
      refetch()
    } catch (e: any) { toast.error(e.message || 'Lỗi') }
  }

  const handleBulkMarkPaid = async () => {
    if (selectedIds.size === 0) return
    const ok = await confirm({ title: `Đánh dấu ${selectedIds.size} phiếu đã thu?`, message: 'Tất cả phiếu được chọn sẽ chuyển sang đã thu.', confirmLabel: 'Xác nhận' })
    if (!ok) return
    setBulkLoading(true)
    try {
      await bulkMarkPaid(Array.from(selectedIds))
      toast.success(`Đã đánh dấu ${selectedIds.size} phiếu đã thu`)
      notify('Thu học phí hàng loạt', `Đã xác nhận thu ${selectedIds.size} phiếu`, 'success', { entityType: 'payment' })
      setSelectedIds(new Set())
      refetch()
    } catch (e: any) { toast.error(e.message || 'Lỗi') }
    finally { setBulkLoading(false) }
  }

  const handleReminder = useCallback(() => {
    const pending = rows.filter(r => r.mapped.status !== 'paid')
    if (pending.length === 0) { toast.info('Không có phiếu cần nhắc nhở'); return }
    for (const r of pending.slice(0, 20)) {
      notify('Nhắc nhở thu học phí', `Phiếu ${r.mapped.code || r.mapped.id}: ${r.mapped.student} - ${typeof r.mapped.amount === 'number' ? r.mapped.amount.toLocaleString('vi-VN') + 'đ' : r.mapped.amount}`, 'warning', { entityType: 'payment', entityId: String(r.mapped.id) })
    }
    toast.success(`Đã gửi ${Math.min(pending.length, 20)} nhắc nhở`)
  }, [rows, toast])

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx')
    const exportData = filtered.map(r => ({
      'Mã phiếu': r.mapped.code || '',
      'Học viên': r.mapped.student,
      'Lớp': r.raw.class?.name || '',
      'Số tiền': r.raw.amount,
      'Loại': r.mapped.type,
      'Trạng thái': r.mapped.status === 'paid' ? 'Đã thu' : r.mapped.status === 'pending' ? 'Chờ thu' : r.mapped.status === 'overdue' ? 'Quá hạn' : 'Đã huỷ',
      'Phương thức': r.raw.payment_method || '',
      'Kỳ': r.raw.period_month ? `T${r.raw.period_month}/${r.raw.period_year}` : '',
      'Ngày thu': r.raw.payment_date || '',
      'Hạn đóng': r.raw.due_date || '',
      'Ghi chú': r.raw.notes || '',
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Phiếu thu')
    XLSX.writeFile(wb, `phieu-thu-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Đã xuất file Excel')
  }

  const handleExportPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('BAO CAO TAI CHINH', 148, 15, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Xuat ngay: ${new Date().toLocaleDateString('vi-VN')}  |  ${filtered.length} phieu thu`, 148, 22, { align: 'center' })

    let y = 32
    // Table header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    const cols = [15, 40, 85, 135, 165, 195, 225, 255]
    const headers = ['Ma', 'Hoc vien', 'Lop', 'So tien', 'Loai', 'Trang thai', 'PT', 'Ky']
    headers.forEach((h, i) => doc.text(h, cols[i], y))
    y += 5
    doc.line(15, y, 280, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    for (const r of filtered.slice(0, 50)) {
      if (y > 190) { doc.addPage(); y = 20 }
      doc.text(r.mapped.code || '', cols[0], y)
      doc.text((r.mapped.student || '').substring(0, 25), cols[1], y)
      doc.text((r.raw.class?.name || '').substring(0, 20), cols[2], y)
      doc.text(r.raw.amount.toLocaleString('vi-VN'), cols[3], y)
      doc.text(r.mapped.type, cols[4], y)
      doc.text(r.mapped.status === 'paid' ? 'Da thu' : r.mapped.status, cols[5], y)
      doc.text(r.raw.payment_method || '', cols[6], y)
      doc.text(r.raw.period_month ? `T${r.raw.period_month}/${r.raw.period_year}` : '', cols[7], y)
      y += 5
    }

    doc.save(`bao-cao-tai-chinh-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Đã xuất báo cáo PDF')
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    const unpaid = filtered.filter(r => r.mapped.status !== 'paid').map(r => String(r.mapped.id))
    setSelectedIds(prev => prev.size === unpaid.length ? new Set() : new Set(unpaid))
  }

  /* ── Payment method breakdown ── */
  const methodBreakdown = useMemo(() => {
    const map: Record<string, { label: string; amount: number; count: number; color: string }> = {
      cash:          { label: 'Tiền mặt',     amount: 0, count: 0, color: '#16a34a' },
      bank_transfer: { label: 'Chuyển khoản', amount: 0, count: 0, color: '#2563eb' },
      momo:          { label: 'MoMo',         amount: 0, count: 0, color: '#a855f7' },
      vnpay:         { label: 'VNPay',        amount: 0, count: 0, color: '#0ea5e9' },
    }
    for (const r of periodRows) {
      if (r.mapped.status !== 'paid' || !r.raw.payment_method) continue
      const k = r.raw.payment_method
      if (map[k]) {
        map[k].amount += typeof r.mapped.amount === 'number' ? r.mapped.amount : 0
        map[k].count++
      }
    }
    return Object.values(map).filter(m => m.count > 0)
  }, [periodRows])
  const methodTotal = methodBreakdown.reduce((s, m) => s + m.amount, 0)

  /* ── Quick filter chips ── */
  const statusChips = [
    { key: 'all',     label: 'Tất cả',  count: rows.length,                                                color: 'var(--text-3)' },
    { key: 'paid',    label: 'Đã thu',  count: rows.filter(r => r.mapped.status === 'paid').length,        color: '#16a34a' },
    { key: 'pending', label: 'Chờ thu', count: rows.filter(r => r.mapped.status === 'pending').length,     color: '#d97706' },
    { key: 'overdue', label: 'Quá hạn', count: rows.filter(r => r.mapped.status === 'overdue').length,     color: '#dc2626' },
  ]

  const viewModeTabs = (
    <div style={{ display: 'inline-flex', background: 'var(--hover-bg)', borderRadius: 8, padding: 2 }}>
      {([
        { id: 'table', icon: 'list',      title: 'Dạng bảng' },
        { id: 'grid',  icon: 'dashboard', title: 'Dạng lưới' },
      ] as const).map(t => (
        <button
          key={t.id}
          onClick={() => setViewMode(t.id)}
          title={t.title}
          style={{
            width: 30, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer',
            background: viewMode === t.id ? 'var(--card)' : 'transparent',
            color: viewMode === t.id ? 'var(--primary)' : 'var(--text-4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: viewMode === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          <Icon name={t.icon} size={14} />
        </button>
      ))}
    </div>
  )

  const periodLabel = period === 'thismonth' ? 'so với tháng trước'
    : period === 'quarter' ? 'so với quý trước'
    : period === 'year'    ? 'so với năm trước'
    : 'so với toàn thời gian'

  return (
    <div>
      <PageHeader
        title="Tài chính"
        subtitle={periodRange
          ? `${rows.length} phiếu thu · ${PERIOD_OPTIONS.find(o => o.value === period)?.label}`
          : `${rows.length} phiếu thu trong tất cả thời gian`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              value={period}
              onChange={v => setPeriod(v as Period)}
              options={PERIOD_OPTIONS}
              style={{ minWidth: 170 }}
            />
            <Button variant="secondary" icon="download" onClick={handleExportExcel} style={{ fontSize: 12 }}>Excel</Button>
            <Button variant="secondary" icon="file-text" onClick={handleExportPdf} style={{ fontSize: 12 }}>PDF</Button>
            <Button icon="plus" onClick={openAdd}>Tạo phiếu thu</Button>
          </div>
        }
      />

      {/* ── KPI Hero cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
        <KpiCard
          label="Tổng thu"
          value={VND_SHORT(totalPaid) + 'đ'}
          icon="dollar"
          accent="#16a34a" accentBg="#dcfce7"
          delta={period !== 'all' ? { pct: deltaPaidPct, label: periodLabel } : null}
          sub={<span>{paidCount} phiếu đã thu</span>}
          sparkline={sparkline}
          delay={0}
        />
        <KpiCard
          label="Công nợ"
          value={VND_SHORT(totalPending) + 'đ'}
          icon="alert-circle"
          accent="#d97706" accentBg="#fef3c7"
          delta={period !== 'all' ? { pct: -deltaPendingPct, label: periodLabel } : null}
          sub={<span>{pendingCount} phiếu chưa thu</span>}
          delay={70}
        />
        <KpiCard
          label="Tỷ lệ thu"
          value={collectionRate + '%'}
          icon="trending-up"
          accent="#2563eb" accentBg="#dbeafe"
          sub={
            <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginTop: 4 }}>
              <div style={{
                height: '100%', width: `${collectionRate}%`, borderRadius: 99,
                background: collectionRate >= 80 ? '#16a34a' : collectionRate >= 50 ? '#d97706' : '#dc2626',
                transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          }
          delay={140}
        />
        <KpiCard
          label="Sắp đến hạn (7 ngày)"
          value={VND_SHORT(upcoming7Amount) + 'đ'}
          icon="clock"
          accent="#8b5cf6" accentBg="#ede9fe"
          sub={<span>{upcoming7Days.length} phiếu cần thu</span>}
          delay={210}
        />
      </div>

      {/* ── Chart + Aging report ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)', gap: 12, marginBottom: 14 }}>

        {/* Revenue trend */}
        <Card animate delay={280} style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Doanh thu 12 tháng gần đây</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>So sánh đã thu vs chờ thu theo tháng</div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-3)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: '#16a34a' }} /> Đã thu
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-3)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: '#fbbf24' }} /> Chờ thu
              </span>
            </div>
          </div>
          <RevenueBarChart data={monthlyData} />
        </Card>

        {/* Aging report */}
        <Card animate delay={350} style={{ padding: 18 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Công nợ theo độ tuổi</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>Click để lọc bảng phía dưới</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['upcoming', '1-30', '31-60', '60+'] as AgingKey[]).map(k => {
              if (k === 'all') return null
              const b = aging[k]
              const pct = agingTotal > 0 ? (b.amount / agingTotal) * 100 : 0
              const active = agingPick === k
              return (
                <button
                  key={k}
                  onClick={() => setAgingPick(active ? 'all' : k)}
                  style={{
                    background: active ? 'var(--hover-bg)' : 'transparent',
                    border: '1px solid', borderColor: active ? b.color : 'transparent',
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{b.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: b.color }}>{VND_SHORT(b.amount)}đ</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'var(--hover-bg)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, background: b.color,
                      borderRadius: 99, transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4 }}>
                    {b.count} phiếu · {b.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Top debtors + Pie chart + Insights row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 12, marginBottom: 14 }}>
        {/* Top debtors */}
        <Card animate delay={420} style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="alert" size={15} style={{ color: '#dc2626' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Top học viên nợ học phí</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{topDebtors.length} người</span>
          </div>
          {topDebtors.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 12 }}>
              <Icon name="check" size={28} style={{ color: '#16a34a', display: 'block', margin: '0 auto 6px', opacity: 0.7 }} />
              Không có học viên nào nợ. Tuyệt vời!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topDebtors.map((d, i) => (
                <button
                  key={d.name}
                  onClick={() => setDebtorFilter(debtorFilter === d.name ? null : d.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    background: debtorFilter === d.name ? 'var(--hover-bg)' : 'transparent',
                    transition: 'background 0.15s', width: '100%', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = debtorFilter === d.name ? 'var(--hover-bg)' : 'transparent')}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', width: 18 }}>#{i + 1}</span>
                  <Avatar initials={d.name[0]} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{d.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-4)', marginTop: 1 }}>
                      {d.count} phiếu
                      {d.maxDays > 0 && <> · trễ {d.maxDays} ngày</>}
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                    {VND_SHORT(d.amount)}đ
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Payment method pie chart */}
        <Card animate delay={450} style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="wallet" size={15} style={{ color: '#2563eb' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Phương thức thanh toán</span>
          </div>
          {methodBreakdown.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 12 }}>
              Chưa có dữ liệu thanh toán
            </div>
          ) : (
            <>
              {/* SVG Pie chart */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  {(() => {
                    let cumAngle = -90
                    return methodBreakdown.map((m, i) => {
                      const pct = methodTotal > 0 ? m.amount / methodTotal : 0
                      const angle = pct * 360
                      const startAngle = cumAngle
                      cumAngle += angle
                      const largeArc = angle > 180 ? 1 : 0
                      const rad1 = (startAngle * Math.PI) / 180
                      const rad2 = ((startAngle + angle) * Math.PI) / 180
                      const x1 = 60 + 50 * Math.cos(rad1)
                      const y1 = 60 + 50 * Math.sin(rad1)
                      const x2 = 60 + 50 * Math.cos(rad2)
                      const y2 = 60 + 50 * Math.sin(rad2)
                      if (pct <= 0) return null
                      if (pct >= 0.999) return <circle key={i} cx={60} cy={60} r={50} fill={m.color} />
                      return (
                        <path
                          key={i}
                          d={`M60,60 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`}
                          fill={m.color}
                          opacity={0.85}
                        />
                      )
                    })
                  })()}
                  <circle cx={60} cy={60} r={28} fill="var(--card)" />
                </svg>
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {methodBreakdown.map(m => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: m.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text-2)', fontWeight: 500 }}>{m.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{VND_SHORT(m.amount)}đ</span>
                    <span style={{ fontSize: 10, color: 'var(--text-4)' }}>({m.count})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Smart insights */}
        <Card animate delay={490} style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="zap" size={15} style={{ color: '#8b5cf6' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Cảnh báo & Gợi ý</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {aging['60+'].count > 0 && (
              <InsightItem
                color="#dc2626" bg="#fee2e2" icon="alert"
                title={`${aging['60+'].count} phiếu quá hạn trên 60 ngày`}
                desc={`Tổng ${VND(aging['60+'].amount)} cần xử lý gấp`}
                onClick={() => setAgingPick('60+')}
              />
            )}
            {upcoming7Days.length > 0 && (
              <InsightItem
                color="#0ea5e9" bg="#e0f2fe" icon="clock"
                title={`${upcoming7Days.length} phiếu sắp đến hạn trong 7 ngày`}
                desc={`Tổng ${VND(upcoming7Amount)} dự kiến thu`}
                onClick={() => setAgingPick('upcoming')}
              />
            )}
            {period !== 'all' && deltaPaidPct > 5 && (
              <InsightItem
                color="#16a34a" bg="#dcfce7" icon="trending-up"
                title={`Doanh thu tăng ${deltaPaidPct.toFixed(1)}%`}
                desc={periodLabel}
              />
            )}
            {period !== 'all' && deltaPaidPct < -5 && (
              <InsightItem
                color="#d97706" bg="#fef3c7" icon="trending-down"
                title={`Doanh thu giảm ${Math.abs(deltaPaidPct).toFixed(1)}%`}
                desc={periodLabel}
              />
            )}
            {collectionRate >= 95 && totalAll > 0 && (
              <InsightItem
                color="#16a34a" bg="#dcfce7" icon="star"
                title="Tỷ lệ thu xuất sắc!"
                desc={`Đã thu ${collectionRate}% học phí kỳ này`}
              />
            )}
            {(pendingCount > 0) && (
              <InsightItem
                color="#8b5cf6" bg="#ede9fe" icon="bell"
                title={`Gửi nhắc nhở thu phí (${pendingCount} phiếu)`}
                desc="Tạo thông báo nhắc nhở cho tất cả phiếu chưa thu"
                onClick={handleReminder}
              />
            )}
            {aging['60+'].count === 0 && upcoming7Days.length === 0 && pendingCount === 0 && collectionRate < 95 && (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 12 }}>
                Không có cảnh báo nào lúc này
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Filter chips + Table ── */}
      <Card animate delay={560} style={{ padding: '12px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Status quick chips */}
          {statusChips.map(c => {
            const active = filters.status === c.key
            return (
              <button
                key={c.key}
                onClick={() => setFilter('status', c.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 99,
                  border: '1.5px solid', borderColor: active ? c.color : 'var(--border)',
                  background: active ? c.color : 'var(--card)',
                  color: active ? '#fff' : 'var(--text-2)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: 'var(--font)',
                }}
              >
                {c.label}
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 7px', borderRadius: 99,
                  background: active ? 'rgba(255,255,255,0.25)' : 'var(--hover-bg)',
                  color: active ? '#fff' : c.color,
                }}>{c.count}</span>
              </button>
            )
          })}

          {agingPick !== 'all' && (
            <button
              onClick={() => setAgingPick('all')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 99,
                background: 'var(--warning-light, #fef3c7)',
                color: '#b45309', border: '1px dashed #d97706',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Icon name="filter" size={11} />
              Đang lọc: {aging[agingPick].label}
              <Icon name="x" size={11} />
            </button>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ position: 'relative', minWidth: 220 }}>
            <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} />
            <input
              placeholder="Tìm học viên, lớp..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: 34, paddingLeft: 30, paddingRight: 10, boxSizing: 'border-box',
                borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--card)',
                color: 'var(--text-1)', fontSize: 13, outline: 'none', fontFamily: 'var(--font)',
              }}
            />
          </div>

          <Select
            value={filters.type}
            onChange={v => setFilter('type', v)}
            options={[
              { value: 'all',      label: 'Tất cả loại' },
              { value: 'tuition',  label: 'Học phí' },
              { value: 'material', label: 'Học liệu' },
              { value: 'exam_fee', label: 'Phí thi' },
              { value: 'other',    label: 'Khác' },
            ]}
            style={{ minWidth: 130 }}
          />

          {viewModeTabs}
        </div>
      </Card>

      {/* ── Bulk actions bar ── */}
      {selectedIds.size > 0 && (
        <Card animate style={{ padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--primary-light)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
            {selectedIds.size} phiếu được chọn
          </span>
          <Button size="sm" icon="check" onClick={handleBulkMarkPaid} disabled={bulkLoading}>
            {bulkLoading ? 'Đang xử lý...' : 'Đánh dấu đã thu'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())}>Bỏ chọn</Button>
        </Card>
      )}

      {/* ── Debtor filter indicator ── */}
      {debtorFilter && (
        <Card animate style={{ padding: '8px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--warning-light, #fef3c7)' }}>
          <Icon name="filter" size={13} style={{ color: '#b45309' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#b45309' }}>Đang lọc: {debtorFilter}</span>
          <button onClick={() => setDebtorFilter(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', display: 'flex' }}>
            <Icon name="x" size={14} />
          </button>
        </Card>
      )}

      {/* ── Main table / grid ── */}
      {error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : viewMode === 'table' ? (
        <PaymentTable
          rows={filtered}
          subtitle={`${filtered.length} phiếu thu`}
          onMarkPaid={handleMarkPaid}
          onCancel={handleCancel}
          onDelete={handleDelete}
          markingId={markingId}
          onAdd={openAdd}
          onRefresh={refetch}
          onRowClick={openEdit}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <PaymentGrid
          rows={filtered}
          onMarkPaid={handleMarkPaid}
          markingId={markingId}
          onCardClick={openEdit}
        />
      )}

      <PaymentFormModal
        open={showForm}
        onClose={closeForm}
        onSuccess={refetch}
        editItem={editItem?.raw ?? null}
      />
    </div>
  )
}

/* ─── Insight pill ─── */
const InsightItem: React.FC<{
  color: string; bg: string; icon: any; title: string; desc: string; onClick?: () => void
}> = ({ color, bg, icon, title, desc, onClick }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      borderRadius: 9, border: 'none', background: bg, textAlign: 'left',
      cursor: onClick ? 'pointer' : 'default', width: '100%',
      transition: 'transform 0.15s',
    }}
    onMouseEnter={onClick ? e => ((e.currentTarget as HTMLElement).style.transform = 'translateX(2px)') : undefined}
    onMouseLeave={onClick ? e => ((e.currentTarget as HTMLElement).style.transform = 'translateX(0)')   : undefined}
  >
    <div style={{
      width: 28, height: 28, borderRadius: 7, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon name={icon} size={14} style={{ color }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color, lineHeight: 1.3 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{desc}</div>
    </div>
    {onClick && <Icon name="chevron-right" size={14} style={{ color, opacity: 0.6 }} />}
  </button>
)

/* ─── Inline SVG bar chart: paid (green) + pending (amber) stacked ─── */
const RevenueBarChart: React.FC<{ data: { label: string; paid: number; pending: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.paid + d.pending), 1) * 1.1
  const W = 600, H = 160
  const barW = (W / data.length) * 0.55
  const slot = W / data.length

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H + 26}`} width="100%" style={{ display: 'block' }}>
        {/* Grid lines */}
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
              {/* pending on top */}
              {pendingH > 0 && (
                <rect
                  x={x} y={H - totalH} width={barW} height={pendingH}
                  fill="#fbbf24" rx={3} opacity={0.85}
                />
              )}
              {/* paid */}
              {paidH > 0 && (
                <rect
                  x={x} y={H - paidH} width={barW} height={paidH}
                  fill="#16a34a" rx={3}
                />
              )}
              <text
                x={x + barW / 2} y={H + 16}
                textAnchor="middle" fontSize="10"
                fill="var(--text-4)" fontFamily="var(--font)"
              >{d.label}</text>
              {total > 0 && (
                <text
                  x={x + barW / 2} y={H - totalH - 4}
                  textAnchor="middle" fontSize="9.5" fontWeight="700"
                  fill="var(--text-3)" fontFamily="var(--font)"
                >{VND_SHORT(total)}</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default Finance
