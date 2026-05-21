import React from 'react'
import ReactDOM from 'react-dom'
import { DataGrid, Badge, StatusBadge, Icon } from '../../components'
import type { DataGridColumn } from '../../components'
import type { Payment } from '../../types/data'
import type { DbPayment } from '../../types/database'

type PaymentRow = { raw: DbPayment; mapped: Payment }

interface PaymentTableProps {
  rows: PaymentRow[]
  onMarkPaid: (id: string) => void
  onCancel?: (id: string) => void
  onDelete?: (id: string) => void
  markingId: string | null
  actions?: React.ReactNode
  subtitle?: string
  onAdd?: () => void
  onRefresh?: () => void
  onRowClick?: (row: PaymentRow) => void
  loading?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: () => void
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  vnpay: 'VNPay',
}

const ActionMenu = ({
  r,
  onMarkPaid,
  onCancel,
  onRowClick,
  onDelete,
  markingId,
}: {
  r: PaymentRow
  onMarkPaid: (id: string) => void
  onCancel?: (id: string) => void
  onRowClick?: (row: PaymentRow) => void
  onDelete?: (id: string) => void
  markingId: string | null
}) => {
  const [open, setOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [coords, setCoords] = React.useState({ top: 0, left: 0 })

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) {
      setOpen(false)
      return
    }
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      setCoords({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(true)
  }

  React.useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        (menuRef.current && menuRef.current.contains(e.target as Node)) ||
        (buttonRef.current && buttonRef.current.contains(e.target as Node))
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const handleScroll = () => setOpen(false)
    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [open])

  const showMarkPaid = r.mapped.status !== 'paid' && r.raw.status !== 'cancelled'
  const showCancel = r.raw.status !== 'cancelled' && r.mapped.status !== 'paid' && onCancel

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        style={{ display: 'flex', outline: 'none', alignItems: 'center', justifyContent: 'center', background: open ? 'var(--hover-bg)' : 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '6px', borderRadius: '50%', transition: 'all 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <Icon name="more-horizontal" size={16} />
      </button>
      {open && ReactDOM.createPortal(
        <div 
          ref={menuRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 999999, background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderRadius: 10, padding: 6, display: 'flex', flexDirection: 'column', minWidth: 140 }}
          onMouseDown={e => e.stopPropagation()}
        >
          {showMarkPaid && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onMarkPaid(String(r.mapped.id)) }}
              disabled={markingId === String(r.mapped.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: '#10b981', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Icon name="check" size={15} /> {markingId === String(r.mapped.id) ? '...' : 'Đã thu'}
            </button>
          )}
          {showCancel && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onCancel(String(r.mapped.id)) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: '#f59e0b', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Icon name="x" size={15} /> Huỷ phiếu
            </button>
          )}
          {onRowClick && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onRowClick(r) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--info)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Icon name="edit" size={15} /> Chỉnh sửa
            </button>
          )}
          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); onDelete(String(r.mapped.id)) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', outline: 'none', cursor: 'pointer', color: 'var(--error)', padding: '10px 14px', borderRadius: 6, textAlign: 'left', width: '100%', fontSize: 13, fontWeight: 500, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Icon name="trash" size={15} /> Xoá phiếu
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  rows, onMarkPaid, onCancel, onDelete, markingId, actions, subtitle,
  onAdd, onRefresh, onRowClick, loading, selectedIds, onToggleSelect, onToggleSelectAll,
}) => {
  const columns: DataGridColumn<PaymentRow>[] = [
    // Checkbox column (only if selection is enabled)
    ...(onToggleSelect ? [{
      key: '_select' as const,
      title: (
        <input
          type="checkbox"
          checked={selectedIds ? selectedIds.size > 0 && selectedIds.size === rows.filter(r => r.mapped.status !== 'paid').length : false}
          onChange={() => onToggleSelectAll?.()}
          style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
        />
      ) as any,
      width: 36,
      render: (r: PaymentRow) => r.mapped.status !== 'paid' ? (
        <input
          type="checkbox"
          checked={selectedIds?.has(String(r.mapped.id)) ?? false}
          onChange={(e) => { e.stopPropagation(); onToggleSelect?.(String(r.mapped.id)) }}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
        />
      ) : null,
    }] : []),
    {
      key: 'code',
      title: 'Mã phiếu',
      width: 100,
      noWrap: true,
      isAllowCopy: true,
      filterValue: r => r.mapped.code ?? '',
      render: r => (
        <span style={{
          fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
          color: 'var(--primary)', background: 'var(--primary-light)',
          padding: '2px 8px', borderRadius: 6,
        }}>
          {r.mapped.code || '—'}
        </span>
      ),
    },
    {
      key: 'student',
      title: 'Học viên',
      filterable: true,
      isAllowCopy: true,
      filterValue: r => r.mapped.student,
      render: r => <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{r.mapped.student}</span>,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      filterable: true,
      isAllowCopy: true,
      filterType: 'select',
      filterValue: r => r.mapped.status,
      filterOptions: [
        { value: 'paid', label: 'Đã thu' },
        { value: 'pending', label: 'Chờ thu' },
        { value: 'overdue', label: 'Quá hạn' },
        { value: 'cancelled', label: 'Đã huỷ' },
      ],
      render: r => <StatusBadge status={r.mapped.status} />,
    },
    {
      key: 'class',
      title: 'Lớp',
      filterable: true,
      isAllowCopy: true,
      filterValue: r => r.raw.class?.name ?? '',
      render: r => <span style={{ color: 'var(--text-3)' }}>{r.raw.class?.name || '—'}</span>,
    },
    {
      key: 'amount',
      title: 'Số tiền',
      align: 'right',
      isAllowCopy: true,
      render: r => (
        <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>
          {typeof r.mapped.amount === 'number' ? r.mapped.amount.toLocaleString('vi-VN') + 'đ' : r.mapped.amount}
        </span>
      ),
    },
    {
      key: 'period',
      title: 'Kỳ',
      noWrap: true,
      isAllowCopy: true,
      filterValue: r => r.raw.period_month ? `T${r.raw.period_month}/${r.raw.period_year}` : r.mapped.date,
      render: r => (
        <span style={{ color: 'var(--text-3)' }}>
          {r.raw.period_month ? `T${r.raw.period_month}/${r.raw.period_year}` : r.mapped.date}
        </span>
      ),
    },
    {
      key: 'type',
      title: 'Loại',
      filterable: true,
      isAllowCopy: true,
      filterType: 'select',
      filterValue: r => r.mapped.type,
      filterOptions: [
        { value: 'tuition', label: 'Học phí' },
        { value: 'material', label: 'Tài liệu' },
        { value: 'exam_fee', label: 'Thi' },
        { value: 'other', label: 'Khác' },
      ],
      render: r => <Badge>{r.mapped.type}</Badge>,
    },
    {
      key: 'method',
      title: 'Phương thức',
      filterable: true,
      isAllowCopy: true,
      filterType: 'select',
      filterValue: r => r.raw.payment_method ?? '',
      filterOptions: [
        { value: 'cash', label: 'Tiền mặt' },
        { value: 'bank_transfer', label: 'Chuyển khoản' },
        { value: 'momo', label: 'MoMo' },
        { value: 'vnpay', label: 'VNPay' },
      ],
      render: r => (
        <span style={{ color: 'var(--text-3)' }}>
          {METHOD_LABEL[r.raw.payment_method ?? ''] ?? r.raw.payment_method ?? '—'}
        </span>
      ),
    },

    {
      key: '_actions',
      title: 'Thao tác',
      sortable: false,
      width: 60,
      pin: 'left',
      render: r => (
        <ActionMenu
          r={r}
          onMarkPaid={onMarkPaid}
          onCancel={onCancel}
          onRowClick={onRowClick}
          onDelete={onDelete}
          markingId={markingId}
        />
      ),
    },
  ]

  return (
    <DataGrid<PaymentRow>
      title="Danh sách phiếu thu"
      subtitle={subtitle}
      data={rows}
      columns={columns}
      rowKey={r => r.mapped.id}
      exportFilename="phieu-thu"
      emptyText="Không có phiếu thu"
      actions={actions}
      onAdd={onAdd}
      addLabel="Tạo phiếu thu"
      onRefresh={onRefresh}
      onRowClick={onRowClick}
      loading={loading}
    />
  )
}
