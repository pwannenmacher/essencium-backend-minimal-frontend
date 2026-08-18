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

  // Das Backend antwortet auf Fehler mit Problem Details nach RFC 9457
  // (Spring ProblemDetail, Content-Type application/problem+json).
  describe('RFC-9457-Problem-Details', () => {
    const problemDetail = {
      detail: 'The following rights must not be used in API tokens: API_TOKEN_ADMIN',
      instance: '/v1/api-tokens',
      status: 400,
      title: 'Bad Request',
      type: 'urn:frachtwerk:error:INVALID_INPUT',
      timestamp: '2026-08-18T21:42:31.929312Z',
    };

    const mockProblem = (overrides = {}) =>
      mockResponse({
        ok: false,
        status: overrides.status ?? 400,
        text: async () => JSON.stringify({ ...problemDetail, ...overrides }),
      });

    it('zeigt das detail-Feld als Meldung', async () => {
      mockProblem();

      await expect(request('/v1/api-tokens', { token: 'jwt' })).rejects.toThrow(
        'The following rights must not be used in API tokens: API_TOKEN_ADMIN'
      );
    });

    it('legt type, title und instance auf den ApiError', async () => {
      mockProblem();

      const error = await request('/v1/api-tokens', { token: 'jwt' }).catch((e) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(400);
      expect(error.type).toBe('urn:frachtwerk:error:INVALID_INPUT');
      expect(error.title).toBe('Bad Request');
      expect(error.instance).toBe('/v1/api-tokens');
      expect(error.problem.timestamp).toBe('2026-08-18T21:42:31.929312Z');
    });

    // title ist bei Spring die englische HTTP-Reason-Phrase und damit schlechter
    // als der deutsche Status-Fallback.
    it('nutzt title nicht als Meldung, wenn detail fehlt', async () => {
      mockProblem({ detail: undefined });

      await expect(request('/v1/api-tokens', { token: 'jwt' })).rejects.toThrow(
        'Ungültige Anfrage'
      );
    });

    it('ignoriert ein leeres detail-Feld', async () => {
      mockProblem({ detail: '   ' });

      await expect(request('/v1/api-tokens', { token: 'jwt' })).rejects.toThrow(
        'Ungültige Anfrage'
      );
    });

    // Kuratierte Meldungen des Aufrufers gewinnen: sonst wäre die deutsche
    // Login-Meldung dauerhaft durch das englische detail ersetzt.
    it('lässt statusMessages vor dem detail-Feld gewinnen', async () => {
      mockProblem({
        status: 401,
        detail: 'Bad credentials',
        type: 'urn:frachtwerk:error:UNAUTHORIZED',
      });

      const error = await request('/auth/token', {
        method: 'POST',
        statusMessages: { 401: 'Benutzername oder Passwort ist falsch' },
      }).catch((e) => e);

      expect(error.message).toBe('Benutzername oder Passwort ist falsch');
      // Der maschinenlesbare Code bleibt trotzdem erhalten.
      expect(error.type).toBe('urn:frachtwerk:error:UNAUTHORIZED');
    });

    it('greift statusMessages nur für den passenden Status', async () => {
      mockProblem({ status: 400 });

      await expect(
        request('/v1/api-tokens', {
          token: 'jwt',
          statusMessages: { 401: 'Benutzername oder Passwort ist falsch' },
        })
      ).rejects.toThrow('The following rights must not be used in API tokens: API_TOKEN_ADMIN');
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

    it('lässt die Problem-Detail-Felder leer, wenn kein Objekt-Body kam', async () => {
      mockResponse({ ok: false, status: 400, text: async () => 'Passwort zu kurz' });

      const error = await request('/v1/users', { token: 'jwt' }).catch((e) => e);
      expect(error.type).toBeNull();
      expect(error.title).toBeNull();
      expect(error.instance).toBeNull();
      expect(error.problem).toBeNull();
    });

    it('behandelt einen Array-Body nicht als Problem-Detail', async () => {
      mockResponse({ ok: false, status: 400, text: async () => JSON.stringify([{ detail: 'x' }]) });

      const error = await request('/v1/users', { token: 'jwt' }).catch((e) => e);
      expect(error.message).toBe('Ungültige Anfrage');
      expect(error.problem).toBeNull();
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
