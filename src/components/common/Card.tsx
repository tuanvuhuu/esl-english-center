import React, { useState } from 'react';
import { useInView } from '../../hooks';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  hover?: boolean;
  animate?: boolean;
  delay?: number;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style = {}, 
  className = '', 
  onClick, 
  onMouseEnter,
  onMouseLeave,
  hover = false, 
  animate = false, 
  delay = 0 
}) => {
  const [hov, setHov] = useState(false);
  const [ref, inView] = useInView();

  return (
    <div 
      ref={animate ? (ref as React.RefObject<HTMLDivElement>) : undefined} 
      onClick={onClick} 
      className={className}
      onMouseEnter={() => { 
        if(hover) setHov(true); 
        onMouseEnter?.();
      }}
      onMouseLeave={() => { 
        if(hover) setHov(false); 
        onMouseLeave?.();
      }}
      style={{
        background: 'var(--card)',
        borderRadius: 18,
        padding: 20,
        boxShadow: hov
          ? '0 24px 48px -16px rgba(11,37,69,0.18), 0 8px 16px -8px rgba(11,37,69,0.08)'
          : '0 4px 12px -4px rgba(11,37,69,0.06), 0 1px 3px rgba(11,37,69,0.04)',
        transition: 'box-shadow 0.25s, transform 0.2s, background 0.35s, border-color 0.25s',
        cursor: onClick ? 'pointer' : 'default',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        border: '1px solid var(--border-light)',
        ...(animate ? {
          opacity: inView ? 1 : 0,
          animation: inView ? `slideUp 0.45s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` : 'none',
        } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
};
