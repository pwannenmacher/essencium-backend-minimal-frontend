import { request } from './apiClient.js';

/** Lädt die OpenAPI-Spec für den API-Doku-Tab. */
export async function getOpenApiSpec() {
  return request('/v3/api-docs', {
    credentials: 'include',
    statusMessages: {
      404: 'Die API-Dokumentation ist auf diesem Backend nicht verfügbar',
    },
  });
}
