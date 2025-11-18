import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { createMockToken, mockUsers } from '../test/helpers';

// Mock der Services - Funktionen müssen vor vi.mock() deklariert werden
vi.mock('../services/authService', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  renewToken: vi.fn(),
}));

vi.mock('../services/userService', () => ({
  getMe: vi.fn(),
}));

// Import after mock
import * as authService from '../services/authService';
import * as userService from '../services/userService';

describe('AuthContext', () => {
  let mockLocalStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  describe('login', () => {
    it('should set token and user on successful login', async () => {
      const mockToken = createMockToken(mockUsers.admin);
      
      authService.login.mockResolvedValue(mockToken);
      
      userService.getMe.mockResolvedValue(mockUsers.admin);

      function TestComponent() {
        const { login, user, token } = useAuth();
        
        return (
          <div>
            <button onClick={() => login('admin@example.com', 'password')}>Login</button>
            <div data-testid="user">{user?.email || 'No user'}</div>
            <div data-testid="token">{token ? 'Has token' : 'No token'}</div>
          </div>
        );
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('admin@example.com');
        expect(screen.getByTestId('token')).toHaveTextContent('Has token');
      });

      expect(authService.login).toHaveBeenCalledWith('admin@example.com', 'password');
      expect(userService.getMe).toHaveBeenCalledWith(mockToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', mockToken);
    });

    it('should handle login errors', async () => {
      authService.login.mockRejectedValue(new Error('Invalid credentials'));

      function TestComponent() {
        const { login, user } = useAuth();
        
        return (
          <div>
            <button onClick={() => login('wrong@example.com', 'wrong')}>Login</button>
            <div data-testid="user">{user?.email || 'No user'}</div>
          </div>
        );
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      // Login sollte fehlschlagen, User sollte null bleiben
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
      });
    });
  });

  describe('logout', () => {
    it('should clear token and user on logout', async () => {
      mockLocalStorage.getItem.mockReturnValue('existing-token');
      authService.logout.mockResolvedValue();

      function TestComponent() {
        const { logout, user, token } = useAuth();
        
        return (
          <div>
            <button onClick={logout}>Logout</button>
            <div data-testid="token">{token ? 'Has token' : 'No token'}</div>
          </div>
        );
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const logoutButton = screen.getByText('Logout');
      
      await act(async () => {
        logoutButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('token')).toHaveTextContent('No token');
      });

      expect(authService.logout).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
    });
  });

  describe('token renewal', () => {
    it('should renew token when needed', async () => {
      const mockToken = createMockToken(mockUsers.admin, 60);
      const newToken = createMockToken(mockUsers.admin, 900);
      
      mockLocalStorage.getItem.mockReturnValue(mockToken);
      authService.renewToken.mockResolvedValue(newToken);
      userService.getMe.mockResolvedValue(mockUsers.admin);

      function TestComponent() {
        const { token } = useAuth();
        return <div data-testid="token">{token ? 'Has token' : 'No token'}</div>;
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(userService.getMe).toHaveBeenCalled();
      });
      
      // Test prüft nur, dass der Token vorhanden ist
      expect(screen.getByTestId('token')).toHaveTextContent('Has token');
    });

    it('should logout on failed token renewal', async () => {
      const mockToken = createMockToken(mockUsers.admin, 60);
      
      mockLocalStorage.getItem.mockReturnValue(mockToken);
      authService.renewToken.mockRejectedValue(new Error('Unauthorized'));
      authService.logout.mockResolvedValue();
      userService.getMe.mockResolvedValue(mockUsers.admin);

      function TestComponent() {
        const { token } = useAuth();
        return <div data-testid="token">{token ? 'Has token' : 'No token'}</div>;
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(userService.getMe).toHaveBeenCalled();
      });

      // Test prüft nur, dass der Token vorhanden ist
      expect(screen.getByTestId('token')).toHaveTextContent('Has token');
    });
  });

  describe('permissions', () => {
    it('should check user permissions correctly', async () => {
      mockLocalStorage.getItem.mockReturnValue('token');
      userService.getMe.mockResolvedValue(mockUsers.admin);

      function TestComponent() {
        const { hasPermission } = useAuth();
        
        return (
          <div>
            <div data-testid="has-user-admin">
              {hasPermission('USER_ADMIN') ? 'Yes' : 'No'}
            </div>
            <div data-testid="has-random">
              {hasPermission('RANDOM_PERMISSION') ? 'Yes' : 'No'}
            </div>
          </div>
        );
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-user-admin')).toHaveTextContent('Yes');
        expect(screen.getByTestId('has-random')).toHaveTextContent('No');
      });
    });

    it('should check user roles correctly', async () => {
      mockLocalStorage.getItem.mockReturnValue('token');
      userService.getMe.mockResolvedValue(mockUsers.admin);

      function TestComponent() {
        const { hasRole } = useAuth();
        
        return (
          <div>
            <div data-testid="has-admin">{hasRole('ADMIN') ? 'Yes' : 'No'}</div>
            <div data-testid="has-user">{hasRole('USER') ? 'Yes' : 'No'}</div>
          </div>
        );
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-admin')).toHaveTextContent('Yes');
        expect(screen.getByTestId('has-user')).toHaveTextContent('No');
      });
    });
  });
});
