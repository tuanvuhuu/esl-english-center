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
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  onClick, 
  style = {}, 
  disabled = false 
}) => {
  const variants = {
    primary: { bg: 'var(--primary)', color: '#fff', hoverBg: 'var(--primary-dark)', border: 'none' },
    secondary: { bg: 'var(--hover-bg)', color: 'var(--text-2)', hoverBg: 'var(--border)', border: '1px solid var(--border)' },
    outline: { bg: 'transparent', color: 'var(--primary)', hoverBg: 'var(--primary-light)', border: '1px solid var(--primary)' },
    ghost: { bg: 'transparent', color: 'var(--text-3)', hoverBg: 'var(--hover-bg)', border: 'none' },
    danger: { bg: 'var(--error-light)', color: '#DC2626', hoverBg: '#FECACA', border: 'none' },
  };

  const sizes = { 
    sm: { p: '6px 12px', fs: 13 }, 
    md: { p: '10px 18px', fs: 14 }, 
    lg: { p: '12px 24px', fs: 15 } 
  };

  const v = variants[variant];
  const s = sizes[size];
  const [hov, setHov] = useState(false);

  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: 8, 
        padding: s.p, 
        fontSize: s.fs, 
        fontWeight: 600,
        fontFamily: 'var(--font)', 
        borderRadius: 12, 
        border: v.border, 
        background: disabled ? 'var(--border)' : (hov ? v.hoverBg : v.bg),
        color: disabled ? 'var(--text-4)' : v.color, 
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)', 
        whiteSpace: 'nowrap',
        transform: hov && !disabled ? 'scale(0.97)' : 'scale(1)', 
        ...style
      }}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
};
