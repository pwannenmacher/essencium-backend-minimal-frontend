import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { login as apiLogin, logout as apiLogout, renewToken } from '../services/authService';
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

    const payload = parseJwt(token);
    if (!payload?.exp) {
      console.warn('Token hat keine Ablaufzeit');
      return;
    }

    const expirationTime = payload.exp * 1000;
    const now = Date.now();
    const renewTime = expirationTime - 20000; // 20 Sekunden vor Ablauf
    const timeUntilRenew = renewTime - now;

    if (timeUntilRenew <= 0) {
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
