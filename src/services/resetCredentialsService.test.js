import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requestPasswordReset, setNewPassword } from './resetCredentialsService';

vi.mock('../config.js', () => ({
  API_BASE_URL: 'http://localhost:8098',
}));

const BASE = 'http://localhost:8098';

describe('resetCredentialsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('requestPasswordReset', () => {
    it('POSTs the email as a raw (unquoted) text/plain body', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await requestPasswordReset('user@example.com');

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${BASE}/v1/reset-credentials`);
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'Content-Type': 'text/plain' });
      // Der Controller liest den Body roh als String – keine JSON-Anführungszeichen.
      expect(options.body).toBe('user@example.com');
    });

    it('does not send an Authorization header (public endpoint)', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, status: 204 });
      await requestPasswordReset('user@example.com');
      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers.Authorization).toBeUndefined();
    });

    it('throws on a non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(requestPasswordReset('bad')).rejects.toThrow('Ungültige Anfrage');
    });

    it('zeigt das detail aus dem Problem-Detail des Backends', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            detail: 'Username must be a valid email address',
            status: 400,
            title: 'Bad Request',
            type: 'urn:frachtwerk:error:INVALID_INPUT',
          }),
      });

      await expect(requestPasswordReset('bad')).rejects.toThrow(
        'Username must be a valid email address'
      );
    });
  });

  describe('setNewPassword', () => {
    it('POSTs password and reset token as verification', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await setNewPassword('NeuesPasswort123', 'reset-token-abc');

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${BASE}/v1/set-password`);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        password: 'NeuesPasswort123',
        verification: 'reset-token-abc',
      });
    });

    it('throws when the token is invalid/expired (backend error)', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(setNewPassword('pw', 'invalid')).rejects.toThrow('Interner Serverfehler');
    });

    // Ein 400 heißt Token abgelaufen oder Policy verletzt; nur detail trennt das.
    it('unterscheidet die 400-Fälle über das detail des Backends', async () => {
      const problem = (detail) => ({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({ detail, status: 400, type: 'urn:frachtwerk:error:INVALID_INPUT' }),
      });

      global.fetch.mockResolvedValueOnce(problem('Verification token is expired'));
      await expect(setNewPassword('pw', 'expired')).rejects.toThrow(
        'Verification token is expired'
      );

      global.fetch.mockResolvedValueOnce(problem('Password must be at least 8 characters long'));
      await expect(setNewPassword('kurz', 'valid')).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
    });
  });
});
