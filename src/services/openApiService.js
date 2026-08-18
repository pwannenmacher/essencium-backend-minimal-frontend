import { request } from './apiClient.js';

/**
 * Lädt die OpenAPI-Spec des Backends für den API-Doku-Tab.
 * `credentials: 'include'`, weil der Endpunkt hinter der Session hängt.
 */
export async function getOpenApiSpec() {
  return request('/v3/api-docs', {
    credentials: 'include',
    statusMessages: {
      // Kein Problem-Detail-Fall: /v3/api-docs liefert bei Fehlern eine
      // Springdoc-Fehlerseite statt application/problem+json.
      404: 'Die API-Dokumentation ist auf diesem Backend nicht verfügbar',
    },
  });
}
