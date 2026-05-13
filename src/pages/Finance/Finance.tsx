import React, { useState } from 'react';
import { PageHeader, Button, Card, Tabs, Badge, StatusBadge, Icon } from '../../components';
import { RECENT_PAYMENTS } from '../../data';

export const Finance: React.FC = () => {
  const [tab, setTab] = useState('overview');

  const stats = [
    { label: 'Tổng thu', value: '156.800.000đ', color: 'var(--success)', sub: '42 giao dịch' },
    { label: 'Tổng chi', value: '89.200.000đ', color: 'var(--error)', sub: '18 giao dịch' },
    { label: 'Lợi nhuận', value: '67.600.000đ', color: 'var(--info)', sub: '+12% so với T4' },
    { label: 'Công nợ', value: '23.500.000đ', color: 'var(--warning)', sub: '5 HV chưa đóng' },
  ];

  return (
    <div>
      <PageHeader
        title="Quản lý tài chính"
        subtitle="Tổng quan thu chi tháng 5/2026"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon="download" variant="secondary">
              Xuất báo cáo
            </Button>
            <Button icon="plus">Tạo phiếu thu</Button>
          </div>
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
          { id: 'overview', label: 'Học phí' },
          { id: 'expenses', label: 'Chi phí' },
          { id: 'salary', label: 'Lương GV' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card animate delay={100} style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--table-header)', borderBottom: '1px solid var(--border)' }}>
                {['#', 'Học viên', 'Số tiền', 'Ngày', 'Loại', 'Trạng thái', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 12 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_PAYMENTS.map((p, i) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: '1px solid var(--border-light)', animation: `slideUp 0.3s ease ${i * 40}ms both` }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--table-row-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', color: 'var(--text-4)' }}>{String(i + 1).padStart(2, '0')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-1)' }}>{p.student}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-1)' }}>{typeof p.amount === 'number' ? p.amount.toLocaleString() + 'đ' : p.amount}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{p.date}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge>{p.type}</Badge>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4 }}>
                      <Icon name="eye" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Finance;
