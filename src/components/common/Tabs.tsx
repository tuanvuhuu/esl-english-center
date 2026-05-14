import React from 'react';

interface Tab {
  id: string;
  label: string;
  tooltip?: string;
  count?: number | string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange }) => (
  <div style={{
    display: 'flex',
    gap: 2,
    background: 'var(--hover-bg)',
    padding: 3,
    borderRadius: 10,
    border: '1px solid var(--border-light)',
    opacity: 0.9,
  }}>
    {tabs.map(t => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        title={t.tooltip}
        style={{
          padding: '5px 10px',
          borderRadius: 8,
          border: 'none',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'var(--font)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: active === t.id ? 'var(--card)' : 'transparent',
          color: active === t.id ? 'var(--primary)' : 'var(--text-3)',
          boxShadow: active === t.id ? 'var(--shadow-sm)' : 'none',
        }}
      >
        {t.label}
        {t.count != null && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({t.count})</span>}
      </button>
    ))}
  </div>
);
