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
    return data.token; // JWT Access Token
  } catch (error) {
    console.error('Login-Fehler:', error);
    throw error;
  }
};

/**
 * Token erneuern mit Refresh Token aus HTTP-only Cookie
 */
export const renewToken = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Token-Erneuerung fehlgeschlagen');
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
