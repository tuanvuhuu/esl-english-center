import React, { useState } from 'react';
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
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const iconColors: Record<string, string> = {
    users: 'var(--primary)',
    book: 'var(--info)',
    wallet: 'var(--success)',
    graduation: '#7E3AF2',
  };
  const iconColor = iconColors[icon] || 'var(--primary)';

  const cardGlows: Record<string, string> = {
    users: 'rgba(46, 91, 255, 0.05)',
    book: 'rgba(0, 196, 140, 0.05)',
    wallet: 'rgba(16, 185, 129, 0.05)',
    graduation: 'rgba(126, 58, 242, 0.05)',
  };
  const hoverGlow = cardGlows[icon] || 'rgba(46, 91, 255, 0.05)';

  return (
    <Card 
      hover 
      animate 
      delay={delay} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 12, 
        minWidth: 0,
        position: 'relative',
        overflow: 'hidden',
        background: isHovered 
          ? `linear-gradient(135deg, var(--card), ${hoverGlow})` 
          : 'var(--card)',
        borderColor: isHovered ? iconColor : 'var(--border-light)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Background glow ball */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: -15,
            right: -15,
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: hoverGlow.replace('0.05', '0.2'),
            filter: 'blur(16px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: iconBg || 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
            transition: 'all 0.3s',
            transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0)',
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
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
          <AnimNum value={value} suffix={suffix} decimals={value.toString().includes('.') ? 1 : 0} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
      {trendLabel && <div style={{ fontSize: 11, color: 'var(--text-4)', position: 'relative', zIndex: 1 }}>{trendLabel}</div>}
    </Card>
  );
};
