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
  style?: React.CSSProperties;
}

export const Select: React.FC<SelectProps> = ({ label, value, onChange, options, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>}
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', 
        padding: '7px 14px',
        border: '1.5px solid var(--border)', 
        borderRadius: 10,
        fontSize: 14, 
        fontFamily: 'var(--font)', 
        color: 'var(--text-1)', 
        outline: 'none', 
        background: 'var(--input-bg)',
        cursor: 'pointer', 
        appearance: 'auto', 
        boxSizing: 'border-box'
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
