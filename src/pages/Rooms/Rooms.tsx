import React from 'react';
import { PageHeader, Button, Card, Badge, StatusBadge } from '../../components';
import { ROOMS_DATA } from '../../data';

export const Rooms: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Quản lý phòng học"
        subtitle={`${ROOMS_DATA.length} phòng`}
        actions={<Button icon="plus">Thêm phòng</Button>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {ROOMS_DATA.map((r, i) => (
          <Card key={r.id} hover animate delay={i * 60}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                    color: 'var(--primary)',
                  }}
                >
                  {r.name}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {r.floor} · {r.type}
                  </div>
                </div>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                color: 'var(--text-3)',
                padding: '12px 0 0',
                borderTop: '1px solid var(--border-light)',
              }}
            >
              <span>{r.capacity} chỗ</span>
              <span>{r.equipment ? r.equipment.length : 0} thiết bị</span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {r.equipment && r.equipment.map((e: string) => (
                <Badge key={e} variant="info" style={{ fontSize: 11 }}>
                  {e}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Rooms;
