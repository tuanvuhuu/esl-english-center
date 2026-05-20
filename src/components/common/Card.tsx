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
        borderRadius: 16, 
        padding: 20,
        boxShadow: hov ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition: 'box-shadow 0.25s, transform 0.2s, background 0.35s',
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
