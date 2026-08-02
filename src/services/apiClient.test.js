import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { request, ApiError, setUnauthorizedHandler } from './apiClient';
import { API_BASE_URL } from '../config';

describe('apiClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    setUnauthorizedHandler(null);
    vi.restoreAllMocks();
  });

  const mockResponse = (overrides) =>
    global.fetch.mockResolvedValueOnce({ ok: true, status: 200, ...overrides });

  describe('request', () => {
    it('setzt Authorization- und Content-Type-Header und serialisiert den Body', async () => {
      mockResponse({ json: async () => ({ id: 1 }) });

      const result = await request('/v1/users', {
        method: 'POST',
        token: 'jwt',
        body: { email: 'a@b.de' },
      });

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/v1/users`, {
        method: 'POST',
        headers: { Authorization: 'Bearer jwt', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'a@b.de' }),
      });
      expect(result).toEqual({ id: 1 });
    });

    it('sendet GET ohne Content-Type und ohne Body', async () => {
      mockResponse({ json: async () => [] });

      await request('/v1/roles', { token: 'jwt' });

      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/v1/roles`, {
        method: 'GET',
        headers: { Authorization: 'Bearer jwt' },
      });
    });

    it('liefert null bei 204 No Content', async () => {
      mockResponse({ status: 204 });
      expect(await request('/v1/users/5', { method: 'DELETE', token: 'jwt' })).toBeNull();
    });

    it('liefert null bei leerem Erfolgs-Body', async () => {
      mockResponse({
        json: async () => {
          throw new SyntaxError('Unexpected end of JSON input');
        },
      });
      expect(await request('/v1/users/5/terminate', { method: 'POST', token: 'jwt' })).toBeNull();
    });
  });

  describe('Fehlerbehandlung', () => {
    it('nutzt das message-Feld aus JSON-Fehlerantworten', async () => {
      mockResponse({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ status: 400, message: 'E-Mail bereits vergeben' }),
      });

      await expect(request('/v1/users', { token: 'jwt' })).rejects.toThrow(
        'E-Mail bereits vergeben'
      );
    });

    it('reicht rohe JSON-Blobs ohne message-Feld nicht durch', async () => {
      mockResponse({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ status: 400, path: '/v1/users' }),
      });

      await expect(request('/v1/users', { token: 'jwt' })).rejects.toThrow('Ungültige Anfrage');
    });

    it('reicht HTML-Fehlerseiten nicht durch', async () => {
      mockResponse({ ok: false, status: 502, text: async () => '<html>Bad Gateway</html>' });

      await expect(request('/v1/users', { token: 'jwt' })).rejects.toThrow(
        'Backend nicht erreichbar'
      );
    });

    it('nutzt Klartext-Fehlermeldungen direkt', async () => {
      mockResponse({ ok: false, status: 400, text: async () => 'Passwort zu kurz' });

      await expect(request('/v1/users', { token: 'jwt' })).rejects.toThrow('Passwort zu kurz');
    });

    it('fällt auf eine deutsche Status-Meldung zurück', async () => {
      mockResponse({ ok: false, status: 403 });

      await expect(request('/v1/users', { token: 'jwt' })).rejects.toThrow(
        'Keine Berechtigung für diese Aktion'
      );
    });

    it('wirft ApiError mit Status', async () => {
      mockResponse({ ok: false, status: 404 });

      const error = await request('/v1/users/99', { token: 'jwt' }).catch((e) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(404);
    });
  });

  describe('401-Handling', () => {
    it('ruft den Unauthorized-Handler bei 401 mit Token auf', async () => {
      const handler = vi.fn();
      setUnauthorizedHandler(handler);
      mockResponse({ ok: false, status: 401 });

      await expect(request('/v1/users/me', { token: 'jwt' })).rejects.toThrow(ApiError);
      expect(handler).toHaveBeenCalledOnce();
    });

    it('ruft den Handler nicht bei 401 ohne Token auf', async () => {
      const handler = vi.fn();
      setUnauthorizedHandler(handler);
      mockResponse({ ok: false, status: 401 });

      await expect(request('/v1/public')).rejects.toThrow(ApiError);
      expect(handler).not.toHaveBeenCalled();
    });

    it('ruft den Handler nicht bei anderen Fehlern auf', async () => {
      const handler = vi.fn();
      setUnauthorizedHandler(handler);
      mockResponse({ ok: false, status: 500 });

      await expect(request('/v1/users/me', { token: 'jwt' })).rejects.toThrow(ApiError);
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
