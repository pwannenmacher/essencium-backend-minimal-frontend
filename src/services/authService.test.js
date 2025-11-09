import { describe, it, expect, beforeEach, vi } from 'vitest';
import { login, logout, renewToken, getOAuthProviders } from './authService';

// Mock der config
vi.mock('../config.js', () => ({
  API_BASE_URL: 'http://localhost:8098',
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('login', () => {
    it('should send correct credentials and return success', async () => {
      const mockResponse = {
        token: 'mock-access-token',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await login('test@example.com', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/auth/token',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            username: 'test@example.com',
            password: 'password123',
          }),
        })
      );

      expect(result).toEqual('mock-access-token');
    });

    it('should throw error on failed login', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid credentials',
      });

      await expect(login('wrong@example.com', 'wrong')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(login('test@example.com', 'password')).rejects.toThrow('Network error');
    });
  });

  describe('logout', () => {
    it('should call logout endpoint with credentials', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
      });

      await logout();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/auth/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('should not throw on failed logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      // Logout sollte nicht fehlschlagen, auch wenn Server-Request failed
      await expect(logout()).resolves.not.toThrow();
    });
  });

  describe('renewToken', () => {
    it('should call renew endpoint and return new token', async () => {
      const mockResponse = {
        token: 'new-access-token',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await renewToken('current-token');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/auth/renew',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );

      expect(result).toEqual('new-access-token');
    });

    it('should throw error on failed refresh', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(renewToken('current-token')).rejects.toThrow();
    });
  });

  describe('getOAuthProviders', () => {
    it('should return OAuth provider registrations', async () => {
      const mockProviders = {
        google: { name: 'Google', url: '/oauth2/authorization/google' },
        github: { name: 'GitHub', url: '/oauth2/authorization/github' },
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProviders,
      });

      const result = await getOAuthProviders();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8098/auth/oauth-registrations',
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockProviders);
    });

    it('should return empty object on error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await getOAuthProviders();

      expect(result).toEqual({});
    });
  });
});
