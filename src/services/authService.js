const API_BASE_URL = 'http://localhost:8098';

/**
 * Login mit Username und Password
 */
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': navigator.userAgent || 'Mozilla/5.0',
      },
      credentials: 'include',
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login fehlgeschlagen');
    }

    const data = await response.json();
    
    // Debug: Prüfe ob Cookies gesetzt wurden
    console.log('Login erfolgreich. Cookies:', document.cookie);
    
    return data.token; // JWT Access Token
  } catch (error) {
    console.error('Login-Fehler:', error);
    throw error;
  }
};

/**
 * Token erneuern mit Refresh Token aus HTTP-only Cookie
 * Benötigt:
 * - Refresh-Token (aus HTTP-only Cookie via credentials: 'include')
 * - Aktuellen Access-Token (im Authorization Header)
 * - User-Agent Header (required vom Backend)
 */
export const renewToken = async (currentToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
        'User-Agent': navigator.userAgent || 'Mozilla/5.0',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Token-Erneuerung fehlgeschlagen');
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Token-Erneuerungs-Fehler:', error);
    throw error;
  }
};

/**
 * Logout
 */
export const logout = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('Logout am Backend fehlgeschlagen, lokale Session wird trotzdem beendet');
    }
  } catch (error) {
    console.error('Logout-Fehler:', error);
  }
};

/**
 * OAuth-Provider abrufen
 * Lädt die verfügbaren OAuth2-Provider von /auth/oauth-registrations
 */
export const getOAuthProviders = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/oauth-registrations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Fehler beim Laden der OAuth-Provider');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fehler beim Laden der OAuth-Provider:', error);
    return {};
  }
};
