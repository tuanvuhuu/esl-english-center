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
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
            Đang tải hoạt động...
          </div>
        ) : activities.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
            Không có hoạt động gần đây
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
