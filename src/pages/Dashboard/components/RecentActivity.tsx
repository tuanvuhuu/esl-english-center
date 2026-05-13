import React from 'react';
import { Card, Icon, FadeIn, IconName } from '../../../components';

interface ActivityItem {
  icon: IconName;
  color: string;
  bg: string;
  text: string;
  time: string;
}

export const RecentActivity: React.FC = () => {
  const acts: ActivityItem[] = [
    { icon: 'users', color: '#10B981', bg: 'var(--success-light)', text: 'Bùi Nhật Linh đăng ký lớp Kids Starter A', time: '5 phút trước' },
    { icon: 'wallet', color: '#3B82F6', bg: 'var(--info-light)', text: 'Nguyễn Minh Anh đã thanh toán 3.500.000đ', time: '30 phút trước' },
    { icon: 'clipboard', color: '#FF6B35', bg: 'var(--primary-light)', text: 'Ms. Sarah điểm danh Kids Starter A (12/12)', time: '1 giờ trước' },
    { icon: 'star', color: '#F59E0B', bg: 'var(--warning-light)', text: 'Trần Bảo Ngọc đạt 95/100 bài kiểm tra', time: '2 giờ trước' },
    { icon: 'graduation', color: '#8B5CF6', bg: '#EDE9FE', text: 'Mr. James cập nhật giáo trình Teen B1', time: '3 giờ trước' },
    { icon: 'bell', color: '#EC4899', bg: '#FCE7F3', text: 'Gửi thông báo học phí tháng 5 thành công', time: '5 giờ trước' },
  ];

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
        {acts.map((a, i) => (
          <FadeIn
            key={i}
            delay={i * 70}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '10px 0',
              borderBottom: i < acts.length - 1 ? '1px solid var(--border-light)' : 'none',
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
              <Icon name={a.icon} size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>{a.text}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{a.time}</div>
            </div>
          </FadeIn>
        ))}
      </div>
    </Card>
  );
};
