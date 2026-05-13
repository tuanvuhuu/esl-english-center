import React, { useState } from 'react';
import { PageHeader, Button, Card, Tabs, Badge, StatusBadge, Icon, LoadingSpinner, EmptyState } from '../../components';
import { useQuery } from '../../hooks';
import { getPayments, updatePayment } from '../../services';
import { mapPayment } from '../../lib/mappers';
import { PaymentFormModal } from './PaymentFormModal';

export const Finance: React.FC = () => {
  const { data: raw, loading, error, refetch } = useQuery(getPayments);

  // zip raw + mapped so we always have class name available
  const rows = (raw ?? []).map(r => ({
    raw: r,
    mapped: mapPayment(r),
  }));

  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const paid    = rows.filter(r => r.mapped.status === 'paid');
  const pending = rows.filter(r => r.mapped.status === 'pending' || r.mapped.status === 'overdue');
  const totalPaid    = paid.reduce((s, r) => s + (typeof r.mapped.amount === 'number' ? r.mapped.amount : 0), 0);
  const totalPending = pending.reduce((s, r) => s + (typeof r.mapped.amount === 'number' ? r.mapped.amount : 0), 0);

  const stats = [
    { label: 'Tổng thu',    value: totalPaid.toLocaleString('vi-VN') + 'đ',    color: 'var(--success)', sub: `${paid.length} phiếu đã thu` },
    { label: 'Công nợ',     value: totalPending.toLocaleString('vi-VN') + 'đ', color: 'var(--warning)', sub: `${pending.length} HV chưa đóng` },
    { label: 'Tổng phiếu',  value: String(rows.length),                        color: 'var(--info)',    sub: 'phiếu thu' },
  ];

  const displayRows = tab === 'pending' ? pending : rows;

  const handleMarkPaid = async (id: string) => {
    setMarkingId(id);
    try {
      await updatePayment(id, {
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
      });
      refetch();
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Quản lý tài chính"
        subtitle={`Tổng quan học phí · ${rows.length} phiếu thu`}
        actions={
          <Button icon="plus" onClick={() => setShowForm(true)}>Tạo phiếu thu</Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i} animate delay={i * 70} style={{ borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      <Tabs
        tabs={[
          { id: 'all', label: 'Tất cả' },
          { id: 'pending', label: `Chờ thu (${pending.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card animate delay={100} style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--table-header)', borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Học viên', 'Lớp', 'Số tiền', 'Kỳ', 'Loại', 'Trạng thái', ''].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 12 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map(({ raw: r, mapped: p }, i) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border-light)', animation: `slideUp 0.3s ease ${i * 40}ms both` }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--table-row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--text-4)' }}>{String(i + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-1)' }}>{p.student}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{r.class?.name || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-1)' }}>
                      {typeof p.amount === 'number' ? p.amount.toLocaleString('vi-VN') + 'đ' : p.amount}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {r.period_month ? `T${r.period_month}/${r.period_year}` : p.date}
                    </td>
                    <td style={{ padding: '12px 16px' }}><Badge>{p.type}</Badge></td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={p.status} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.status !== 'paid' ? (
                        <button
                          onClick={() => handleMarkPaid(String(p.id))}
                          disabled={markingId === String(p.id)}
                          style={{
                            background: 'rgba(16,185,129,0.1)', border: 'none', cursor: 'pointer',
                            color: '#10b981', padding: '4px 10px', borderRadius: 6,
                            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)',
                          }}
                        >
                          {markingId === String(p.id) ? '...' : 'Đã thu'}
                        </button>
                      ) : (
                        <span style={{ color: '#10b981' }}><Icon name="check" size={14} /></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayRows.length === 0 && (
              <EmptyState icon="wallet" title="Không có phiếu thu" desc="Nhấn 'Tạo phiếu thu' để bắt đầu" />
            )}
          </div>
        )}
      </Card>

      <PaymentFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Finance;
