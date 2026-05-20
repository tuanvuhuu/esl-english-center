import React from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: (string | Option)[];
  required?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, value, onChange, options, required, style = {}, disabled }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    {label && (
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
      </label>
    )}
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%', 
        height: 30,
        padding: '0 10px',
        border: '1.5px solid var(--border)', 
        borderRadius: 8,
        fontSize: 13, 
        fontFamily: 'var(--font)', 
        color: 'var(--text-1)', 
        outline: 'none', 
        background: 'var(--input-bg)',
        cursor: 'pointer', 
        appearance: 'auto', 
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
      }}
    >
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        return <option key={val} value={val}>{lab}</option>;
      })}
    </select>
  </div>
);
