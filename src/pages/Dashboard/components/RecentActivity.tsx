import React from 'react';
import { Card, Icon, FadeIn, IconName } from '../../../components';
import { ActivityItem } from '../../../services/dashboard';

interface RecentActivityProps {
  activities?: ActivityItem[];
  loading?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities = [], loading = false }) => {

  return (
    <Card animate delay={300}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: '#EDE9FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8B5CF6',
          }}
        >
          <Icon name="clock" size={16} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Hoạt động gần đây</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(90deg, var(--border-light) 25%, var(--hover-bg) 50%, var(--border-light) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: '75%', height: 13, borderRadius: 6, background: 'linear-gradient(90deg, var(--border-light) 25%, var(--hover-bg) 50%, var(--border-light) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                  <div style={{ width: '40%', height: 11, borderRadius: 6, marginTop: 6, background: 'linear-gradient(90deg, var(--border-light) 25%, var(--hover-bg) 50%, var(--border-light) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)' }}>
            <div style={{ background: '#EDE9FE', width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#8B5CF6' }}>
              <Icon name="clock" size={24} />
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>Chưa có hoạt động</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Các hoạt động mới sẽ hiển thị ở đây ✨</div>
          </div>
        ) : (
          activities.map((a, i) => (
            <FadeIn
              key={i}
              delay={i * 70}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < activities.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: a.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: a.color,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <Icon name={a.icon as IconName} size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>{a.text}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{a.time}</div>
              </div>
            </FadeIn>
          ))
        )}
      </div>
    </Card>
  );
};
