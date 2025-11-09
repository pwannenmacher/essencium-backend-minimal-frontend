import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, renewToken } from '../services/authService';
import { getMe } from '../services/userService';

export const AuthContext = createContext(null);

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

  // Automatische Token-Erneuerung 20 Sekunden vor Ablauf (Token läuft nach 15 Minuten ab)
  useEffect(() => {
    if (!token) return;

    // Parse JWT um Ablaufzeit zu ermitteln
    const parseJwt = (token) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    };

    const payload = parseJwt(token);
    if (!payload || !payload.exp) {
      console.warn('Token hat keine Ablaufzeit');
      return;
    }

    // Berechne wann der Token erneuert werden soll (20 Sekunden vor Ablauf)
    const expirationTime = payload.exp * 1000; // in Millisekunden
    const now = Date.now();
    const renewTime = expirationTime - 20000; // 20 Sekunden vor Ablauf
    const timeUntilRenew = renewTime - now;

    if (timeUntilRenew <= 0) {
      // Token ist bereits abgelaufen oder fast abgelaufen, sofort erneuern
      const renewImmediately = async () => {
        try {
          const newToken = await renewToken(token);
          setToken(newToken);
          console.log('Token wurde sofort erneuert (war abgelaufen)');
        } catch (error) {
          console.error('Token-Erneuerung fehlgeschlagen:', error);
          setToken(null);
          setUser(null);
        }
      };
      renewImmediately();
      return;
    }

    // Setze Timer für automatische Erneuerung
    const timeout = setTimeout(async () => {
      try {
        const newToken = await renewToken(token);
        setToken(newToken);
        console.log('Token wurde automatisch erneuert (20s vor Ablauf)');
      } catch (error) {
        console.error('Token-Erneuerung fehlgeschlagen:', error);
        setToken(null);
        setUser(null);
      }
    }, timeUntilRenew);

    return () => clearTimeout(timeout);
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

  const loginWithToken = (accessToken) => {
    setToken(accessToken);
    // User-Daten werden automatisch durch useEffect geladen
  };

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    loginWithToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
