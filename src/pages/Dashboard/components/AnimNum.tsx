import React from 'react';
import { useAnimatedNumber } from '../../../hooks';

interface AnimNumProps {
  value: number | string;
  suffix?: string;
  decimals?: number;
}

export const AnimNum: React.FC<AnimNumProps> = ({ value, suffix = '', decimals = 0 }) => {
  const [ref, num] = useAnimatedNumber(typeof value === 'string' ? parseFloat(value) : value, 900);
  
  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>}>
      {typeof num !== 'number' || isNaN(num) ? value : num.toFixed(decimals)}
      {suffix && (
        <span style={{ fontSize: '0.5em', fontWeight: 600, color: 'var(--text-4)', marginLeft: 4 }}>
          {suffix}
        </span>
      )}
    </span>
  );
};
