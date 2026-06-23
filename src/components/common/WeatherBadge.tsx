import React from 'react';

interface WeatherBadgeProps {
  data: { temp: number; description: string; icon: string } | null;
  loading?: boolean;
}

export const WeatherBadge: React.FC<WeatherBadgeProps> = ({ data, loading = false }) => {
  if (loading) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 20,
          background: 'var(--hover-bg)',
          border: '1px solid var(--border-light)',
          height: 28,
        }}
      >
        <span
          style={{
            width: 60,
            height: 12,
            borderRadius: 6,
            background: 'linear-gradient(90deg, var(--border-light) 25%, var(--hover-bg) 50%, var(--border-light) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      </span>
    );
  }

  if (!data) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 12px',
        borderRadius: 20,
        background: 'var(--hover-bg)',
        border: '1px solid var(--border-light)',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-2)',
        cursor: 'default',
        transition: 'all 0.3s',
        height: 28,
        whiteSpace: 'nowrap',
      }}
      title={`${data.temp}°C — ${data.description}`}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{data.icon}</span>
      <span style={{ fontWeight: 700 }}>{data.temp}°C</span>
      <span style={{ color: 'var(--text-4)', fontWeight: 500, fontSize: 11 }}>{data.description}</span>
    </span>
  );
};
