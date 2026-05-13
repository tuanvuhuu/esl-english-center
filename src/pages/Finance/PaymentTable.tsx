import React from 'react'
import { DataGrid, Badge, StatusBadge, Icon } from '../../components'
import type { DataGridColumn } from '../../components'
import type { Payment } from '../../types/data'
import type { DbPayment } from '../../types/database'

type PaymentRow = { raw: DbPayment; mapped: Payment }

interface PaymentTableProps {
  rows: PaymentRow[]
  onMarkPaid: (id: string) => void
  markingId: string | null
  actions?: React.ReactNode
  subtitle?: string
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
  vnpay: 'VNPay',
}

export const PaymentTable: React.FC<PaymentTableProps> = ({
  rows, onMarkPaid, markingId, actions, subtitle,
}) => {
  const columns: DataGridColumn<PaymentRow>[] = [
    {
      key: 'student',
      title: 'Học viên',
      filterable: true,
      filterValue: r => r.mapped.student,
      render: r => <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{r.mapped.student}</span>,
    },
    {
      key: 'class',
      title: 'Lớp',
      filterable: true,
      filterValue: r => r.raw.class?.name ?? '',
      render: r => <span style={{ color: 'var(--text-3)' }}>{r.raw.class?.name || '—'}</span>,
    },
    {
      key: 'amount',
      title: 'Số tiền',
      align: 'right',
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
      key: 'status',
      title: 'Trạng thái',
      filterable: true,
      filterType: 'select',
      filterValue: r => r.mapped.status,
      filterOptions: [
        { value: 'paid', label: 'Đã thu' },
        { value: 'pending', label: 'Chờ thu' },
        { value: 'overdue', label: 'Quá hạn' },
      ],
      render: r => <StatusBadge status={r.mapped.status} />,
    },
    {
      key: '_actions',
      title: '',
      width: 90,
      render: r => (
        r.mapped.status !== 'paid' ? (
          <button
            onClick={e => { e.stopPropagation(); onMarkPaid(String(r.mapped.id)) }}
            disabled={markingId === String(r.mapped.id)}
            style={{ background: 'rgba(16,185,129,0.1)', border: 'none', cursor: 'pointer', color: '#10b981', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)' }}
          >
            {markingId === String(r.mapped.id) ? '...' : 'Đã thu'}
          </button>
        ) : (
          <span style={{ color: '#10b981' }}><Icon name="check" size={14} /></span>
        )
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
    />
  )
}
