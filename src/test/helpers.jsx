import { render } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

export function renderWithProviders(ui, options = {}) {
  const { authContext = null, ...renderOptions } = options;

  function Wrapper({ children }) {
    return (
      <MantineProvider>
        <ThemeProvider>
          <Notifications />
          {authContext ? (
            <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
          ) : (
            <AuthProvider>{children}</AuthProvider>
          )}
        </ThemeProvider>
      </MantineProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Baut einen Auth-Context-Wert für Komponententests.
 * `rights` sind die Authority-Strings, die `hasPermission` bejahen soll —
 * damit lässt sich das Rechte-Gating der Listen gezielt durchspielen.
 */
export function createAuthContext({ rights = [], token = 'jwt-token', user } = {}) {
  return {
    token,
    isAuthenticated: true,
    loading: false,
    user: user ?? {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      roles: [{ name: 'TEST', rights: rights.map((authority) => ({ authority })) }],
    },
    hasPermission: (permission) => rights.includes(permission),
    hasRole: (roleName) => roleName === 'TEST',
    login: vi.fn(),
    logout: vi.fn(),
    loginWithToken: vi.fn(),
    forceRenewToken: vi.fn(),
  };
}

export const mockUsers = {
  admin: {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    enabled: true,
    roles: [
      {
        name: 'ADMIN',
        // Rechte-Form wie vom Backend geliefert: Objekte mit authority
        rights: [
          { authority: 'USER_ADMIN' },
          { authority: 'ROLE_ADMIN' },
          { authority: 'API_TOKEN_ADMIN' },
          { authority: 'SESSION_TOKEN_ADMIN' },
        ],
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
        rights: [{ authority: 'API_TOKEN_MANAGE' }],
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

// JWTs sind Base64URL-kodiert (kein '+', '/' oder '='); btoa liefert
// Standard-Base64 — ohne Umwandlung würde isValidJwt solche Tokens ablehnen.
const toBase64Url = (value) =>
  btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

export function createMockToken(user, expiresIn = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.email,
    exp: now + expiresIn,
    iat: now,
    user: user,
  };

  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  const signature = 'mock-signature';

  return `${header}.${body}.${signature}`;
}

/**
 * Generiere Mock-JWT-Token ohne Expiration Claim
 */
export function createMockTokenWithoutExpiration(user) {
  user ??= { email: 'test@example.com' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.email,
    iat: now,
    name: user.firstName ? `${user.firstName} ${user.lastName}` : 'John Doe',
  };

  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  const signature = 'mock-signature-without-exp';

  return `${header}.${body}.${signature}`;
}

export function mockFetch(responseData, options = {}) {
  const { status = 200, ok = true, headers = { 'Content-Type': 'application/json' } } = options;

  return vi.fn(() =>
    Promise.resolve({
      ok,
      status,
      headers: new Headers(headers),
      json: () => Promise.resolve(responseData),
    })
  );
}

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
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
}
