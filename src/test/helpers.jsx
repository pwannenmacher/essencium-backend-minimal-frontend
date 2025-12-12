import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

/**
 * Render-Wrapper mit allen notwendigen Providern
 */
export function renderWithProviders(ui, options = {}) {
  const {
    authContext = null,
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    return (
      <MantineProvider>
        <ThemeProvider>
          <Notifications />
          {authContext ? (
            <AuthContext.Provider value={authContext}>
              {children}
            </AuthContext.Provider>
          ) : (
            <AuthProvider>
              {children}
            </AuthProvider>
          )}
        </ThemeProvider>
      </MantineProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock-User mit verschiedenen Permissions
 */
export const mockUsers = {
  admin: {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    enabled: true,
    roles: [
      {
        name: 'ADMIN',
        rights: ['USER_ADMIN', 'ROLE_ADMIN', 'API_TOKEN_ADMIN', 'SESSION_TOKEN_ADMIN'],
      },
    ],
  },
  
  user: {
    firstName: 'Regular',
    lastName: 'User',
    email: 'user@example.com',
    enabled: true,
    roles: [
      {
        name: 'USER',
        rights: ['API_TOKEN_MANAGE'],
      },
    ],
  },
  
  viewer: {
    firstName: 'Viewer',
    lastName: 'User',
    email: 'viewer@example.com',
    enabled: true,
    roles: [
      {
        name: 'VIEWER',
        rights: [],
      },
    ],
  },
};

/**
 * Generiere Mock-JWT-Token
 */
export function createMockToken(user, expiresIn = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.email,
    exp: now + expiresIn,
    iat: now,
    user: user,
  };
  
  // Einfaches Base64-Encoding für Tests (nicht kryptographisch sicher)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  
  return `${header}.${body}.${signature}`;
}

/**
 * Generiere Mock-JWT-Token ohne Expiration Claim
 */
export function createMockTokenWithoutExpiration(user = { email: 'test@example.com' }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.email,
    iat: now,
    name: user.firstName ? `${user.firstName} ${user.lastName}` : 'John Doe',
  };
  
  // Einfaches Base64-Encoding für Tests (nicht kryptographisch sicher)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'mock-signature-without-exp';
  
  return `${header}.${body}.${signature}`;
}

/**
 * Setup fetch mock mit Response
 */
export function mockFetch(responseData, options = {}) {
  const {
    status = 200,
    ok = true,
    headers = { 'Content-Type': 'application/json' },
  } = options;

  return vi.fn(() =>
    Promise.resolve({
      ok,
      status,
      headers: new Headers(headers),
      json: () => Promise.resolve(responseData),
    })
  );
}

/**
 * Mock für localStorage
 */
export function mockLocalStorage() {
  const store = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
}
