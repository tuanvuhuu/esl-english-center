import React from 'react';
import { Card, Icon, IconName } from '../../../components';
import { AnimNum } from './AnimNum';

interface StatCardProps {
  icon: IconName;
  iconBg?: string;
  label: string;
  value: number | string;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  iconBg, 
  label, 
  value, 
  suffix, 
  trend, 
  trendLabel, 
  delay = 0 
}) => (
  <Card hover animate delay={delay} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: iconBg || 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary)',
          transition: 'background 0.35s',
        }}
      >
        <Icon name={icon} size={22} />
      </div>
      {trend != null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontWeight: 700,
            color: trend >= 0 ? 'var(--success-dark)' : 'var(--error-dark)',
            background: trend >= 0 ? 'var(--success-light)' : 'var(--error-light)',
            padding: '3px 8px',
            borderRadius: 8,
            transition: 'all 0.35s',
          }}
        >
          <Icon name={trend >= 0 ? 'trending-up' : 'trending-down'} size={14} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
        <AnimNum value={value} suffix={suffix} decimals={value.toString().includes('.') ? 1 : 0} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
    {trendLabel && <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{trendLabel}</div>}
  </Card>
);
