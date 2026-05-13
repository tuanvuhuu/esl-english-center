import React from 'react';
import { PageHeader, Button, Card, Icon, IconName } from '../../components';
import { NOTIFICATIONS_DATA } from '../../data';

export const Notifications: React.FC = () => {
  const tI: Record<string, IconName> = { 
    info: 'bell', 
    warning: 'alert', 
    alert: 'alert' 
  };
  const tC: Record<string, string> = { 
    info: 'var(--info)', 
    warning: 'var(--warning)', 
    alert: 'var(--error)' 
  };

  return (
    <div>
      <PageHeader
        title="Thông báo"
        subtitle={`${NOTIFICATIONS_DATA.filter(n => !n.read).length} thông báo mới`}
        actions={<Button variant="secondary">Đánh dấu đã đọc</Button>}
      />
      <Card animate style={{ padding: 0, overflow: 'hidden' }}>
        {NOTIFICATIONS_DATA.map((n, i) => (
          <div
            key={n.id}
            style={{
              display: 'flex',
              gap: 14,
              padding: '16px 20px',
              borderBottom: i < NOTIFICATIONS_DATA.length - 1 ? '1px solid var(--border-light)' : 'none',
              background: n.read ? 'var(--card)' : 'var(--activity-warm)',
              cursor: 'pointer',
              transition: 'background 0.2s',
              animation: `slideUp 0.3s ease ${i * 50}ms both`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'var(--card)' : 'var(--activity-warm)')}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                flexShrink: 0,
                background: 'var(--hover-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tC[n.type] || 'var(--info)',
              }}
            >
              <Icon name={tI[n.type] || 'bell'} size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: 'var(--text-1)' }}>{n.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{n.desc}</div>
              <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{n.time}</div>
            </div>
            {!n.read && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  marginTop: 8,
                  flexShrink: 0,
                  animation: 'pulse 2s ease infinite',
                }}
              />
            )}
          </div>
        ))}
      </Card>
    </div>
  );
};

export default Notifications;
