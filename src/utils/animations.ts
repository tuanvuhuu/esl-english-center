export const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
};

export const createAnimationTimer = (
  duration: number,
  onProgress: (progress: number) => void,
  onComplete?: () => void
): void => {
  let start: number | null = null;
  const step = (ts: number) => {
    if (start === null) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    onProgress(progress);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      onComplete?.();
    }
  };
  requestAnimationFrame(step);
};
