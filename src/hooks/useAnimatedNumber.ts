import { useState, useEffect } from 'react';
import { useInView } from './useInView';

export const useAnimatedNumber = (
  target: number | string, 
  duration: number = 800
): [React.RefObject<any>, number | string] => {
  const [val, setVal] = useState<number | string>(0);
  const [ref, inView] = useInView();

  useEffect(() => {
    if (!inView) return;
    const num = typeof target === 'string' ? parseFloat(target) : target;
    if (isNaN(num)) {
      setVal(target);
      return;
    }

    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(ease * num);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return [ref, val];
};
