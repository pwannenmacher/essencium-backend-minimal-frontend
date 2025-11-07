import { createContext, useContext, useEffect, useState } from 'react';
import { useMantineColorScheme } from '@mantine/core';

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
    // Lade gespeicherte Präferenz aus localStorage
    return localStorage.getItem('themeMode') || 'auto';
  });

  useEffect(() => {
    // Speichere Präferenz
    localStorage.setItem('themeMode', themeMode);

    if (themeMode === 'auto') {
      // Verwende System-Präferenz
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        setColorScheme(e.matches ? 'dark' : 'light');
      };

      // Setze initialen Wert
      setColorScheme(mediaQuery.matches ? 'dark' : 'light');

      // Höre auf Änderungen
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      // Verwende manuelle Einstellung
      setColorScheme(themeMode);
    }
  }, [themeMode, setColorScheme]);

  const toggleTheme = (mode) => {
    setThemeMode(mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
