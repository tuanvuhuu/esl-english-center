import React from 'react';
import { Card } from '../../../components';

interface SkeletonCardProps {
  variant?: 'stat' | 'chart' | 'list';
  rows?: number;
}

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--border-light) 25%, var(--hover-bg) 50%, var(--border-light) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
  borderRadius: 6,
};

const Bar: React.FC<{ width: string | number; height: number; style?: React.CSSProperties }> = ({ width, height, style }) => (
  <div style={{ width, height, ...shimmerStyle, ...style }} />
);

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'stat', rows = 3 }) => {
  if (variant === 'stat') {
    return (
      <Card style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Bar width={36} height={36} style={{ borderRadius: 10 }} />
          <Bar width={44} height={18} style={{ borderRadius: 6 }} />
        </div>
        <div>
          <Bar width="55%" height={22} />
          <Bar width="75%" height={12} style={{ marginTop: 4 }} />
        </div>
      </Card>
    );
  }

  if (variant === 'chart') {
    return (
      <Card style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Bar width={140} height={18} />
          <Bar width={50} height={22} style={{ borderRadius: 8 }} />
        </div>
        <Bar width="100%" height={100} style={{ borderRadius: 10 }} />
        <div style={{ marginTop: 20, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
          <Bar width={120} height={14} style={{ marginBottom: 12 }} />
          <Bar width="100%" height={80} style={{ borderRadius: 10 }} />
        </div>
      </Card>
    );
  }

  // variant === 'list'
  return (
    <Card style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Bar width={32} height={32} style={{ borderRadius: 10 }} />
        <Bar width={120} height={16} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              background: 'var(--hover-bg)',
              borderRadius: 12,
            }}
          >
            <Bar width={4} height={36} style={{ borderRadius: 2 }} />
            <div style={{ flex: 1 }}>
              <Bar width="70%" height={13} />
              <Bar width="50%" height={12} style={{ marginTop: 4 }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <Bar width={40} height={13} />
              <Bar width={30} height={11} style={{ marginTop: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
