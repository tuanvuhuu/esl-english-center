import { useState, useCallback } from 'react';

export const useTweaks = <T extends Record<string, any>>(defaults: T): [T, (keyOrEdits: string | Partial<T>, val?: any) => void] => {
  const [values, setValues] = useState<T>(defaults);

  const setTweak = useCallback((keyOrEdits: string | Partial<T>, val?: any) => {
    const edits: Partial<T> = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits
      : ({ [keyOrEdits as string]: val } as unknown as Partial<T>);

    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }));
  }, []);

  return [values, setTweak];
};
