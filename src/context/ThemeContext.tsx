import React, { createContext, useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({ 
  mode: 'light', 
  toggle: () => {} 
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => 
    (localStorage.getItem('esl-theme') as ThemeMode) || 'light'
  );

  const toggle = useCallback(() => {
    setMode(m => {
      const n = m === 'light' ? 'dark' : 'light';
      localStorage.setItem('esl-theme', n);
      return n;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};
