import React from 'react'
import { Card, Badge, StatusBadge, Icon, EmptyState } from '../../components'
import type { Payment } from '../../types/data'
import type { DbPayment } from '../../types/database'

interface PaymentGridProps {
  rows: { raw: DbPayment; mapped: Payment }[]
  onMarkPaid: (id: string) => void
  markingId: string | null
  onCardClick?: (row: { raw: DbPayment; mapped: Payment }) => void
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt', bank_transfer: 'Chuyển khoản', momo: 'MoMo', vnpay: 'VNPay',
}

export const PaymentGrid: React.FC<PaymentGridProps> = ({ rows, onMarkPaid, markingId, onCardClick }) => {
  if (rows.length === 0) return <EmptyState icon="wallet" title="Không có phiếu thu" desc="Nhấn 'Tạo phiếu thu' để bắt đầu" />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {rows.map(({ raw: r, mapped: p }, i) => (
        <Card
          key={p.id}
          animate delay={i * 50}
          hover={!!onCardClick}
          onClick={onCardClick ? () => onCardClick({ raw: r, mapped: p }) : undefined}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: p.status === 'paid' ? '#10B981' : p.status === 'overdue' ? '#EF4444' : '#F59E0B',
          }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>{p.student}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                {r.class?.name || 'Không thuộc lớp'}
              </div>
            </div>
            <StatusBadge status={p.status} />
          </div>

          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12 }}>
            {typeof p.amount === 'number' ? p.amount.toLocaleString('vi-VN') + 'đ' : p.amount}
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <Badge>{p.type}</Badge>
            {r.payment_method && <Badge variant="info" style={{ fontSize: 11 }}>{METHOD_LABEL[r.payment_method] || r.payment_method}</Badge>}
            {r.period_month && (
              <Badge variant="info" style={{ fontSize: 11 }}>T{r.period_month}/{r.period_year}</Badge>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="calendar" size={12} />
              {p.date || '—'}
            </div>
            {p.status !== 'paid' && (
              <button
                onClick={e => { e.stopPropagation(); onMarkPaid(String(p.id)) }}
                disabled={markingId === String(p.id)}
                style={{ background: 'rgba(16,185,129,0.1)', border: 'none', cursor: 'pointer', color: '#10b981', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)' }}
              >
                {markingId === String(p.id) ? '...' : 'Đã thu'}
              </button>
            )}
            {p.status === 'paid' && (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <Icon name="check" size={13} /> Đã thu
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
