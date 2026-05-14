import React, { createContext, useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  primaryColor: string;
  bgImage: string;
  toggle: () => void;
  setPrimaryColor: (c: string) => void;
  setBgImage: (img: string) => void;
}

export const ThemeContext = createContext<ThemeContextType>({ 
  mode: 'light', 
  primaryColor: '#FF6B35',
  bgImage: '',
  toggle: () => {},
  setPrimaryColor: () => {},
  setBgImage: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => 
    (localStorage.getItem('esl-theme') as ThemeMode) || 'light'
  );
  const [primaryColor, setPrimaryColorRaw] = useState(() => localStorage.getItem('esl-primary-color') || '#FF6B35');
  const [bgImage, setBgImageRaw] = useState(() => localStorage.getItem('esl-bg-image') || '');

  const toggle = useCallback(() => {
    setMode(m => {
      const n = m === 'light' ? 'dark' : 'light';
      localStorage.setItem('esl-theme', n);
      return n;
    });
  }, []);

  const setPrimaryColor = (c: string) => {
    setPrimaryColorRaw(c);
    localStorage.setItem('esl-primary-color', c);
  };

  const setBgImage = (img: string) => {
    setBgImageRaw(img);
    localStorage.setItem('esl-bg-image', img);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--primary-light', `${primaryColor}15`);
    
    if (bgImage) {
      document.documentElement.setAttribute('data-has-bg', 'true');
      document.body.style.backgroundImage = `url(${bgImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundPosition = 'center';
    } else {
      document.documentElement.setAttribute('data-has-bg', 'false');
      document.body.style.backgroundImage = 'none';
    }
  }, [mode, primaryColor, bgImage]);

  return (
    <ThemeContext.Provider value={{ mode, primaryColor, bgImage, toggle, setPrimaryColor, setBgImage }}>
      {children}
    </ThemeContext.Provider>
  );
};
