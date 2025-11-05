const API_BASE_URL = 'http://localhost:8098';

// Refresh Token wird im LocalStorage gespeichert (da Backend CORS-Credentials nicht unterstützt)
let refreshTokenStore = null;

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
    
    // Versuche Refresh Token aus Set-Cookie Header zu lesen (falls vorhanden)
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const refreshMatch = setCookie.match(/refreshToken=([^;]+)/);
      if (refreshMatch) {
        refreshTokenStore = refreshMatch[1];
        localStorage.setItem('refreshToken', refreshMatch[1]);
      }
    }
    
    return data.token; // JWT Access Token
  } catch (error) {
    console.error('Login-Fehler:', error);
    throw error;
  }
};

/**
 * Token erneuern mit Refresh Token
 * Hinweis: Da das Backend CORS-Credentials nicht korrekt unterstützt,
 * müsste der Refresh Token manuell übergeben werden
 */
export const renewToken = async () => {
  const storedRefreshToken = localStorage.getItem('refreshToken');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(storedRefreshToken && { 'Cookie': `refreshToken=${storedRefreshToken}` })
      },
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
    });

    if (!response.ok) {
      console.warn('Logout am Backend fehlgeschlagen, lokale Session wird trotzdem beendet');
    }
    
    // Lokalen Refresh Token löschen
    localStorage.removeItem('refreshToken');
    refreshTokenStore = null;
  } catch (error) {
    console.error('Logout-Fehler:', error);
    // Lokale Session trotzdem beenden
    localStorage.removeItem('refreshToken');
    refreshTokenStore = null;
  }
};
