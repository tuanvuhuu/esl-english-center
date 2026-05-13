import React from 'react';
import { Icon, IconName } from './Icon';

interface InputProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: IconName;
  style?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text', 
  icon, 
  style = {} 
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>}
    <div style={{ position: 'relative' }}>
      {icon && (
        <div style={{ 
          position: 'absolute', 
          left: 12, 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: 'var(--text-4)' 
        }}>
          <Icon name={icon} size={16} />
        </div>
      )}
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        style={{
          width: '100%', 
          padding: icon ? '10px 14px 10px 38px' : '10px 14px', 
          border: '1.5px solid var(--border)',
          borderRadius: 10, 
          fontSize: 14, 
          fontFamily: 'var(--font)', 
          color: 'var(--text-1)', 
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s', 
          background: 'var(--input-bg)', 
          boxSizing: 'border-box'
        }}
        onFocus={e => { 
          e.target.style.borderColor = 'var(--primary)'; 
          e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.1)'; 
        }}
        onBlur={e => { 
          e.target.style.borderColor = 'var(--border)'; 
          e.target.style.boxShadow = 'none'; 
        }}
      />
    </div>
  </div>
);
