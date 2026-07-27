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
    it('POSTs the email as a JSON string', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, status: 204 });

      await requestPasswordReset('user@example.com');

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${BASE}/v1/reset-credentials`);
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
      // Body ist ein JSON-String: "user@example.com" (mit Anführungszeichen)
      expect(options.body).toBe('"user@example.com"');
      expect(JSON.parse(options.body)).toBe('user@example.com');
    });

    it('does not send an Authorization header (public endpoint)', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, status: 204 });
      await requestPasswordReset('user@example.com');
      const [, options] = global.fetch.mock.calls[0];
      expect(options.headers.Authorization).toBeUndefined();
    });

    it('throws on a non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 400 });
      await expect(requestPasswordReset('bad')).rejects.toThrow('Anfrage fehlgeschlagen: 400');
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
      await expect(setNewPassword('pw', 'invalid')).rejects.toThrow(
        'Passwort konnte nicht gesetzt werden: 500'
      );
    });
  });
});
