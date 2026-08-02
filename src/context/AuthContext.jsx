import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { notifications } from '@mantine/notifications';
import { login as apiLogin, logout as apiLogout, renewToken } from '../services/authService';
import { ApiError, setUnauthorizedHandler } from '../services/apiClient';
import { getMe } from '../services/userService';
import { isValidJwt, parseJwt } from '../utils/jwt';

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

  // Zentrales 401-Handling: Weist der Server einen authentifizierten Request
  // zurück (Token serverseitig invalidiert), wird die Session lokal beendet,
  // statt den User auf einem toten Dashboard sitzen zu lassen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken((current) => {
        if (current) {
          notifications.show({
            id: 'session-expired',
            title: 'Sitzung abgelaufen',
            message: 'Bitte melden Sie sich erneut an',
            color: 'orange',
          });
        }
        return null;
      });
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    // Nur streng validierte JWTs persistieren (jssecurity:S8475).
    if (isValidJwt(token)) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    let timeout;

    const attemptRenew = async (retryDelayMs) => {
      try {
        const newToken = await renewToken(token);
        // Spät auflösendes Renew darf einen zwischenzeitlichen Logout /
        // Token-Wechsel nicht rückgängig machen (ST4).
        if (!cancelled) setToken(newToken);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          // Refresh-Token serverseitig ungültig → Session beenden
          console.error('Token-Erneuerung abgelehnt:', error);
          setToken(null);
          setUser(null);
          return;
        }
        // Transienter Fehler (Netzwerkaussetzer, 5xx): mit Backoff erneut
        // versuchen statt den User hart auszuloggen (ST5).
        console.warn(
          `Token-Erneuerung fehlgeschlagen, neuer Versuch in ${retryDelayMs / 1000}s:`,
          error
        );
        timeout = setTimeout(() => attemptRenew(Math.min(retryDelayMs * 2, 60000)), retryDelayMs);
      }
    };

    const payload = parseJwt(token);
    if (!payload?.exp) {
      // Token ohne Ablaufzeit: Fallback-Erneuerung, damit die Session nicht
      // still stirbt, sobald der Server den Token invalidiert (ST12).
      console.warn('Token hat keine Ablaufzeit – Fallback-Erneuerung in 5 Minuten');
      timeout = setTimeout(() => attemptRenew(5000), 5 * 60 * 1000);
    } else {
      const renewTime = payload.exp * 1000 - 20000; // 20 Sekunden vor Ablauf
      const timeUntilRenew = renewTime - Date.now();
      if (timeUntilRenew <= 0) {
        attemptRenew(5000);
      } else {
        timeout = setTimeout(() => attemptRenew(5000), timeUntilRenew);
      }
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    let cancelled = false;
    let timeout;

    const fetchUser = async (retryDelayMs) => {
      try {
        const userData = await getMe(token);
        // Out-of-order auflösende Antworten verwerfen (ST4)
        if (!cancelled) setUser(userData);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          console.error('Fehler beim Laden der User-Daten:', error);
          setToken(null);
          setUser(null);
          return;
        }
        // Transienter Fehler: erneut versuchen statt Session beenden (ST5)
        console.warn(
          `User-Daten laden fehlgeschlagen, neuer Versuch in ${retryDelayMs / 1000}s:`,
          error
        );
        timeout = setTimeout(() => fetchUser(Math.min(retryDelayMs * 2, 60000)), retryDelayMs);
      }
    };

    fetchUser(5000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const accessToken = await apiLogin(username, password);
      setToken(accessToken);
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
  };

  const hasPermission = (permission) => {
    return user?.roles?.some((role) => role.rights?.includes(permission)) ?? false;
  };

  const hasRole = (roleName) => {
    return user?.roles?.some((role) => role.name === roleName) ?? false;
  };

  const forceRenewToken = async () => {
    if (!token) {
      throw new Error('Kein Token verfügbar');
    }
    try {
      const newToken = await renewToken(token);
      setToken(newToken);
      return { success: true, message: 'Token wurde erfolgreich erneuert' };
    } catch (error) {
      console.error('Fehler beim manuellen Token-Refresh:', error);
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: !!token,
      login,
      logout,
      loginWithToken,
      hasPermission,
      hasRole,
      forceRenewToken,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
