import React, { useState } from 'react';
import { Icon, IconName } from './Icon';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  onClick, 
  style = {}, 
  disabled = false,
  loading = false
}) => {
  const variants = {
    primary: { bg: 'var(--primary)', color: '#fff', hoverBg: 'var(--primary-dark)', border: 'none' },
    secondary: { bg: 'var(--hover-bg)', color: 'var(--text-2)', hoverBg: 'var(--border)', border: '1px solid var(--border)' },
    outline: { bg: 'transparent', color: 'var(--primary)', hoverBg: 'var(--primary-light)', border: '1px solid var(--primary)' },
    ghost: { bg: 'transparent', color: 'var(--text-3)', hoverBg: 'var(--hover-bg)', border: 'none' },
    danger: { bg: 'var(--error-light)', color: '#DC2626', hoverBg: '#FECACA', border: 'none' },
  };

  const sizes = {
    sm: { h: 28, p: '0 10px', fs: 12 },
    md: { h: 30, p: '0 12px', fs: 12 },
    lg: { h: 36, p: '0 16px', fs: 13 }
  };

  const v = variants[variant];
  const s = sizes[size];
  const [hov, setHov] = useState(false);

  return (
    <button 
      onClick={!loading ? onClick : undefined} 
      disabled={disabled || loading} 
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 8, 
        height: s.h,
        padding: s.p, 
        fontSize: s.fs, 
        fontWeight: 600,
        fontFamily: 'var(--font)', 
        borderRadius: 12, 
        border: v.border, 
        background: (disabled || loading) ? 'var(--border)' : (hov ? v.hoverBg : v.bg),
        color: (disabled || loading) ? 'var(--text-4)' : v.color, 
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)', 
        whiteSpace: 'nowrap',
        opacity: loading ? 0.8 : 1,
        transform: hov && !disabled && !loading ? 'scale(0.97)' : 'scale(1)', 
        ...style
      }}
    >
      {loading ? (
        <Icon name="loader" size={size === 'sm' ? 14 : 16} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />
      )}
      {children}
    </button>
  );
};
