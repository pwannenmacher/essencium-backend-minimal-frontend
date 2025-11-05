import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, renewToken } from '../services/authService';
import { getMe } from '../services/userService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Token im localStorage speichern/entfernen
  useEffect(() => {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, [token]);

  // Automatische Token-Erneuerung alle 14 Minuten (vor Ablauf des 15-Minuten-Tokens)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const newToken = await renewToken();
        setToken(newToken);
        console.log('Token wurde erneuert');
      } catch (error) {
        console.error('Token-Erneuerung fehlgeschlagen:', error);
        // Bei Fehler: Benutzer abmelden
        setToken(null);
        setUser(null);
      }
    }, 14 * 60 * 1000); // 14 Minuten

    return () => clearInterval(interval);
  }, [token]);

  // User-Daten beim Token-Wechsel laden
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const userData = await getMe(token);
        setUser(userData);
      } catch (error) {
        console.error('Fehler beim Laden der User-Daten:', error);
        // Bei Fehler Token ungültig -> ausloggen
        setToken(null);
        setUser(null);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const accessToken = await apiLogin(username, password);
      setToken(accessToken);
      // User-Daten werden automatisch durch useEffect geladen
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (token) {
        await apiLogout(token);
      }
    } catch (error) {
      console.error('Logout-Fehler:', error);
    } finally {
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
