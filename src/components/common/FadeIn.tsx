import React from 'react';
import { useInView } from '../../hooks';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'right' | 'left' | 'scale' | 'none';
  style?: React.CSSProperties;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ 
  children, 
  delay = 0, 
  direction = 'up', 
  style = {}, 
  className = '' 
}) => {
  const [ref, inView] = useInView();
  const anims = { 
    up: 'slideUp', 
    right: 'slideInRight', 
    left: 'slideInLeft', 
    scale: 'scaleIn', 
    none: 'fadeIn' 
  };
  
  return (
    <div 
      ref={ref as React.RefObject<HTMLDivElement>} 
      className={className} 
      style={{
        ...style,
        opacity: inView ? 1 : 0,
        animation: inView ? `${anims[direction] || 'slideUp'} 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` : 'none',
      }}
    >
      {children}
    </div>
  );
};
