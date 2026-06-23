import React, { useState, useMemo } from 'react';
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
  sparkData?: number[];
}

export const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  iconBg, 
  label, 
  value, 
  suffix, 
  trend, 
  trendLabel, 
  delay = 0,
  sparkData,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const iconColors: Record<string, string> = {
    users: 'var(--primary)',
    book: 'var(--info-dark)',
    wallet: 'var(--success-dark)',
    graduation: 'var(--academic-dark)',
    clipboard: '#F59E0B',
  };
  const iconColor = iconColors[icon] || 'var(--primary)';

  const cardGlows: Record<string, string> = {
    users: 'var(--primary-light)',
    book: 'var(--info-light)',
    wallet: 'var(--success-light)',
    graduation: 'var(--academic-light)',
    clipboard: 'rgba(245, 158, 11, 0.08)',
  };
  const hoverGlow = cardGlows[icon] || 'rgba(46, 91, 255, 0.05)';

  // Sparkline SVG path generation
  const sparkSvg = useMemo(() => {
    if (!sparkData || sparkData.length < 2) return null;
    const w = 100;
    const h = 20;
    const pad = 2;
    const max = Math.max(...sparkData) * 1.1 || 1;
    const min = Math.min(...sparkData) * 0.9;
    const range = max - min || 1;

    const pts = sparkData.map((v, i) => {
      const x = (i / (sparkData.length - 1)) * w;
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    });

    const linePath = pts.join(' ');
    const areaPath = `0,${h} ${pts.join(' ')} ${w},${h}`;
    return { linePath, areaPath, w, h };
  }, [sparkData]);

  const gid = useMemo(() => `sp-${Math.random().toString(36).slice(2, 8)}`, []);

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
        gap: 10,
        padding: 18,
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
            bottom: -12,
            right: -12,
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: hoverGlow.replace('0.05', '0.2').replace('0.08', '0.25'),
            filter: 'blur(14px)',
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
            borderRadius: 13,
            background: iconBg || 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
            transition: 'all 0.3s',
            transform: isHovered ? 'scale(1.08) rotate(-5deg)' : 'scale(1) rotate(0)',
            boxShadow: isHovered ? `0 10px 22px -8px ${iconColor}66` : 'none',
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
              fontSize: 11,
              fontWeight: 700,
              color: trend >= 0 ? 'var(--success-dark)' : 'var(--error-dark)',
              background: trend >= 0 ? 'var(--success-light)' : 'var(--error-light)',
              padding: '4px 8px',
              borderRadius: 8,
              transition: 'all 0.35s',
              border: trend >= 0
                ? '1px solid rgba(16,185,129,0.2)'
                : '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <Icon name={trend >= 0 ? 'trending-up' : 'trending-down'} size={12} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ position: 'relative', zIndex: 1, marginTop: 4 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: -0.5 }}>
          <AnimNum value={value} suffix={suffix} decimals={value.toString().includes('.') ? 1 : 0} />
        </div>
      </div>
      {trendLabel && <div style={{ fontSize: 10, color: 'var(--text-4)', position: 'relative', zIndex: 1 }}>{trendLabel}</div>}

      {/* Sparkline */}
      {sparkSvg && (
        <svg
          width="100%"
          viewBox={`0 0 ${sparkSvg.w} ${sparkSvg.h}`}
          style={{
            display: 'block',
            marginTop: -2,
            position: 'relative',
            zIndex: 1,
            opacity: 0.7,
            transition: 'opacity 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={iconColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={iconColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={sparkSvg.areaPath}
            fill={`url(#${gid})`}
          />
          <polyline
            points={sparkSvg.linePath}
            fill="none"
            stroke={iconColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </Card>
  );
};
