import { request } from './apiClient.js';

// Das Backend verlangt für die Auth-Endpunkte einen User-Agent-Header.
const userAgentHeader = () => ({ 'User-Agent': navigator.userAgent || 'Mozilla/5.0' });

/**
 * Login mit Username und Password
 */
export const login = async (username, password) => {
  const data = await request('/auth/token', {
    method: 'POST',
    headers: userAgentHeader(),
    credentials: 'include',
    body: { username, password },
    statusMessages: { 401: 'Benutzername oder Passwort ist falsch' },
  });
  return data.token;
};

/**
 * Token erneuern mit Refresh Token aus HTTP-only Cookie
 * Benötigt:
 * - Refresh-Token (aus HTTP-only Cookie via credentials: 'include')
 * - Aktuellen Access-Token (im Authorization Header)
 * - User-Agent Header (required vom Backend)
 */
export const renewToken = async (currentToken) => {
  const data = await request('/auth/renew', {
    method: 'POST',
    token: currentToken,
    headers: userAgentHeader(),
    credentials: 'include',
  });
  return data.token;
};

/**
 * Logout – beendet die Session am Backend; ein Fehler dabei ist unkritisch,
 * die lokale Session wird vom Aufrufer in jedem Fall beendet.
 */
export const logout = async (token) => {
  try {
    await request('/auth/logout', {
      method: 'POST',
      token,
      credentials: 'include',
      // Ein 401 hier heißt nur: Session war schon beendet – kein Grund für
      // die zentrale "Sitzung abgelaufen"-Behandlung mitten im Logout.
      skipUnauthorizedHandler: true,
    });
  } catch (error) {
    console.warn('Logout am Backend fehlgeschlagen, lokale Session wird trotzdem beendet', error);
  }
};

/**
 * OAuth-Provider abrufen
 * Lädt die verfügbaren OAuth2-Provider von /auth/oauth-registrations
 */
export const getOAuthProviders = async () => {
  try {
    return (await request('/auth/oauth-registrations')) || {};
  } catch (error) {
    console.error('Fehler beim Laden der OAuth-Provider:', error);
    return {};
  }
};
