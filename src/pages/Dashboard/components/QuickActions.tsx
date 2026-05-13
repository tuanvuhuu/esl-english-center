import React from 'react';
import { Card, Icon, FadeIn, IconName } from '../../../components';

interface ActionItem {
  icon: IconName;
  label: string;
  color: string;
  bg: string;
}

export const QuickActions: React.FC = () => {
  const actions: ActionItem[] = [
    { icon: 'plus', label: 'Thêm học viên', color: '#FF6B35', bg: 'var(--primary-light)' },
    { icon: 'book', label: 'Mở lớp mới', color: '#3B82F6', bg: 'var(--info-light)' },
    { icon: 'clipboard', label: 'Điểm danh', color: '#10B981', bg: 'var(--success-light)' },
    { icon: 'wallet', label: 'Thu học phí', color: '#8B5CF6', bg: '#EDE9FE' },
  ];

  return (
    <Card animate delay={200}>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 14 }}>Thao tác nhanh</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {actions.map((a, i) => (
          <FadeIn key={i} delay={i * 60}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 16px',
                width: '100%',
                background: a.bg,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                fontFamily: 'var(--font)',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(0.96)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: a.color,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Icon name={a.icon} size={18} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{a.label}</span>
            </button>
          </FadeIn>
        ))}
      </div>
    </Card>
  );
};
