import React from 'react';
import { PageHeader, Button, Card, Icon, IconName, LoadingSpinner, EmptyState } from '../../components';
import { useQuery, useMutation } from '../../hooks';
import { getNotifications, markAllAsRead } from '../../services';
import { mapNotification } from '../../lib/mappers';

export const Notifications: React.FC = () => {
  const { data: raw, loading, error, refetch } = useQuery(getNotifications);
  const notifications = (raw ?? []).map(mapNotification);
  const { mutate: doMarkAll, loading: marking } = useMutation(() => markAllAsRead(''));

  const unreadCount = notifications.filter(n => !n.read).length;

  const tI: Record<string, IconName> = { info: 'bell', warning: 'alert', alert: 'alert' };
  const tC: Record<string, string>   = { info: 'var(--info)', warning: 'var(--warning)', alert: 'var(--error)' };

  const handleMarkAll = async () => {
    await doMarkAll(undefined as any);
    refetch();
  };

  return (
    <div>
      <PageHeader
        title="Thông báo"
        subtitle={`${unreadCount} thông báo mới`}
        actions={
          <Button variant="secondary" onClick={handleMarkAll} disabled={marking || unreadCount === 0}>
            Đánh dấu đã đọc
          </Button>
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : (
        <Card animate style={{ padding: 0, overflow: 'hidden' }}>
          {notifications.length === 0 ? (
            <EmptyState title="Không có thông báo" desc="Chưa có thông báo nào" />
          ) : notifications.map((n, i) => (
            <div
              key={n.id}
              style={{
                display: 'flex', gap: 14, padding: '16px 20px',
                borderBottom: i < notifications.length - 1 ? '1px solid var(--border-light)' : 'none',
                background: n.read ? 'var(--card)' : 'var(--activity-warm)',
                cursor: 'pointer', transition: 'background 0.2s',
                animation: `slideUp 0.3s ease ${i * 50}ms both`,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'var(--card)' : 'var(--activity-warm)')}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: tC[n.type] || 'var(--info)',
              }}>
                <Icon name={tI[n.type] || 'bell'} size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: 'var(--text-1)' }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{n.desc}</div>
                <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{n.time}</div>
              </div>
              {!n.read && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--primary)', marginTop: 8, flexShrink: 0,
                  animation: 'pulse 2s ease infinite',
                }} />
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

export default Notifications;
