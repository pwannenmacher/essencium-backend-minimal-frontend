import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { notifications } from '@mantine/notifications';
import { login as apiLogin, logout as apiLogout, renewToken } from '../services/authService';
import { ApiError, setUnauthorizedHandler } from '../services/apiClient';
import { getMe } from '../services/userService';
import { isValidJwt, parseJwt } from '../utils/jwt';
import { STORAGE_KEYS } from '../constants';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN));
  const [fetchedUser, setFetchedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ohne Token gibt es keinen User – abgeleitet statt per Effect zurückgesetzt.
  const user = token ? fetchedUser : null;

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
      setFetchedUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    // Nur streng validierte JWTs persistieren (jssecurity:S8475).
    if (isValidJwt(token)) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
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
          setFetchedUser(null);
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
    if (!token) return;

    let cancelled = false;
    let timeout;

    const fetchUser = async (retryDelayMs) => {
      try {
        const userData = await getMe(token);
        // Out-of-order auflösende Antworten verwerfen (ST4)
        if (!cancelled) setFetchedUser(userData);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          console.error('Fehler beim Laden der User-Daten:', error);
          setToken(null);
          setFetchedUser(null);
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
      setFetchedUser(null);
      setLoading(false);
    }
  };

  const loginWithToken = (accessToken) => {
    setToken(accessToken);
  };

  const hasPermission = (permission) => {
    return (
      user?.roles?.some((role) => role.rights?.some((right) => right.authority === permission)) ??
      false
    );
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
