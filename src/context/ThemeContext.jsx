import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useMantineColorScheme } from '@mantine/core';
import { STORAGE_KEYS } from '../constants';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }) {
  const { setColorScheme } = useMantineColorScheme();
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME_MODE) || 'auto';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, themeMode);

    if (themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        setColorScheme(e.matches ? 'dark' : 'light');
      };

      setColorScheme(mediaQuery.matches ? 'dark' : 'light');

      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      setColorScheme(themeMode);
    }
  }, [themeMode, setColorScheme]);

  const value = useMemo(() => ({ themeMode, toggleTheme: setThemeMode }), [themeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
