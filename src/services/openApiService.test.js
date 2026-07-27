import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getOpenApiSpec } from './openApiService';

vi.mock('../config', () => ({
  API_BASE_URL: 'http://localhost:8098',
}));

describe('openApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('fetches the OpenAPI spec with credentials', async () => {
    const spec = { openapi: '3.0.0', paths: {} };
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => spec });

    const result = await getOpenApiSpec();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8098/v3/api-docs',
      expect.objectContaining({
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(result).toEqual(spec);
  });

  it('throws a descriptive error on a non-ok response', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(getOpenApiSpec()).rejects.toThrow('Fehler beim Laden der API-Dokumentation');
  });
});
