import React from 'react';
import { Icon } from '../common/Icon';
import { useAppContext } from '../../context/AppContext';

export const SelectBoxYear: React.FC = () => {
  const { years, selectedYear, setSelectedYearId } = useAppContext();

  if (years.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '0 8px 0 8px', height: 32, borderRadius: 8,
      border: '1.5px solid var(--border)', background: 'var(--hover-bg)',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <Icon name="calendar" size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
      <select
        value={selectedYear?.id ?? ''}
        onChange={e => setSelectedYearId(e.target.value)}
        style={{
          background: 'none', border: 'none', outline: 'none',
          fontSize: 11, fontWeight: 600, color: 'var(--text-1)',
          cursor: 'pointer', fontFamily: 'var(--font)',
          maxWidth: 110,
        }}
      >
        {years.map(y => (
          <option key={y.id} value={y.id}>{y.name}</option>
        ))}
      </select>
    </div>
  );
};
