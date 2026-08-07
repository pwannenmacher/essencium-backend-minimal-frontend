import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getApiTokens,
  getApiTokensBasic,
  getApiTokenById,
  createApiToken,
  updateApiToken,
  patchApiToken,
  revokeApiToken,
  deleteApiToken,
  getAllApiTokensAdmin,
  getTokenExpirationInfo,
} from './apiTokenService';

vi.mock('../config.js', () => ({
  API_BASE_URL: 'http://localhost:8098',
}));

const BASE = 'http://localhost:8098';

describe('apiTokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const okJson = (body) => global.fetch.mockResolvedValueOnce({ ok: true, json: async () => body });

  describe('getApiTokens', () => {
    it('builds a query string from all params', async () => {
      okJson({ content: [] });

      await getApiTokens('token', {
        page: 1,
        size: 20,
        sort: 'createdAt,desc',
        ids: 'a,b',
        createdBy: 'x',
        updatedBy: 'y',
        createdAtFrom: '2026-01-01',
        createdAtTo: '2026-02-01',
        updatedAtFrom: '2026-03-01',
        updatedAtTo: '2026-04-01',
      });

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain(`${BASE}/v1/api-tokens?`);
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('sort=createdAt%2Cdesc');
      expect(calledUrl).toContain('updatedAtTo=2026-04-01');
    });

    it('omits the query string when no params are given', async () => {
      okJson({ content: [] });

      await getApiTokens('token');

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE}/v1/api-tokens`,
        expect.objectContaining({ headers: { Authorization: 'Bearer token' } })
      );
    });

    it('throws on a non-ok response', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getApiTokens('token')).rejects.toThrow('Interner Serverfehler');
    });
  });

  describe('getApiTokensBasic', () => {
    it('sends filter params without pagination', async () => {
      okJson([]);

      await getApiTokensBasic('token', { ids: '1', createdBy: 'me' });

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain(`${BASE}/v1/api-tokens/basic?`);
      expect(calledUrl).toContain('ids=1');
      expect(calledUrl).toContain('createdBy=me');
    });

    it('omits the query string when no params are given', async () => {
      okJson([]);
      await getApiTokensBasic('token');
      expect(global.fetch).toHaveBeenCalledWith(`${BASE}/v1/api-tokens/basic`, expect.anything());
    });

    it('throws on error', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 403 });
      await expect(getApiTokensBasic('token')).rejects.toThrow();
    });
  });

  describe('getApiTokenById', () => {
    it('fetches a single token', async () => {
      okJson({ id: 7 });
      const result = await getApiTokenById('token', 7);
      expect(global.fetch).toHaveBeenCalledWith(`${BASE}/v1/api-tokens/7`, expect.anything());
      expect(result).toEqual({ id: 7 });
    });

    it('throws on error', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(getApiTokenById('token', 7)).rejects.toThrow();
    });
  });

  describe('createApiToken', () => {
    it('POSTs the token data', async () => {
      okJson({ id: 1, token: 'secret' });
      const data = { description: 'ci', rights: ['READ'] };

      const result = await createApiToken('token', data);

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE}/v1/api-tokens`,
        expect.objectContaining({ method: 'POST', body: JSON.stringify(data) })
      );
      expect(result).toEqual({ id: 1, token: 'secret' });
    });

    it('uses the server error text when present', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'bad input' });
      await expect(createApiToken('token', {})).rejects.toThrow('bad input');
    });

    it('falls back to a generic message when error text is empty', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => '' });
      await expect(createApiToken('token', {})).rejects.toThrow('Ungültige Anfrage');
    });
  });

  describe('updateApiToken', () => {
    it('PUTs the data merged with the id', async () => {
      okJson({ id: 3 });
      await updateApiToken('token', 3, { description: 'x' });

      const [, options] = global.fetch.mock.calls[0];
      expect(options.method).toBe('PUT');
      expect(JSON.parse(options.body)).toEqual({ description: 'x', id: 3 });
    });

    it('throws on error', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 409, text: async () => '' });
      await expect(updateApiToken('token', 3, {})).rejects.toThrow(
        'Konflikt – die Daten wurden zwischenzeitlich geändert'
      );
    });
  });

  describe('patchApiToken / revokeApiToken', () => {
    it('PATCHes partial data', async () => {
      okJson({ id: 5, status: 'REVOKED' });
      await patchApiToken('token', 5, { status: 'REVOKED' });

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${BASE}/v1/api-tokens/5`);
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ status: 'REVOKED' });
    });

    it('revoke delegates to patch with REVOKED status', async () => {
      okJson({ id: 5, status: 'REVOKED' });
      const result = await revokeApiToken('token', 5);

      const [, options] = global.fetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({ status: 'REVOKED' });
      expect(result).toEqual({ id: 5, status: 'REVOKED' });
    });

    it('throws on error', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => '' });
      await expect(patchApiToken('token', 5, {})).rejects.toThrow('Interner Serverfehler');
    });
  });

  describe('deleteApiToken', () => {
    it('sends a DELETE request', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true });
      await deleteApiToken('token', 9);
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE}/v1/api-tokens/9`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('throws on error', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 403, text: async () => '' });
      await expect(deleteApiToken('token', 9)).rejects.toThrow(
        'Keine Berechtigung für diese Aktion'
      );
    });
  });

  describe('getAllApiTokensAdmin', () => {
    it('fetches the admin overview', async () => {
      okJson({ user1: [] });
      const result = await getAllApiTokensAdmin('token');
      expect(global.fetch).toHaveBeenCalledWith(`${BASE}/v1/api-tokens/all`, expect.anything());
      expect(result).toEqual({ user1: [] });
    });

    it('throws on error', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 401 });
      await expect(getAllApiTokensAdmin('token')).rejects.toThrow();
    });
  });

  describe('getTokenExpirationInfo', () => {
    it('fetches the expiration info', async () => {
      okJson({ defaultDuration: 3600 });
      const result = await getTokenExpirationInfo('token');
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE}/v1/api-tokens/token-expiration-info`,
        expect.anything()
      );
      expect(result).toEqual({ defaultDuration: 3600 });
    });

    it('throws on error', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(getTokenExpirationInfo('token')).rejects.toThrow();
    });
  });
});
