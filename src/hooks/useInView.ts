import { useRef, useState, useEffect } from 'react';

export const useInView = (opts: IntersectionObserverInit = {}): [React.RefObject<any>, boolean] => {
  const ref = useRef<any>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: opts.threshold || 0.1, ...opts }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [opts.threshold]);

  return [ref, inView];
};
