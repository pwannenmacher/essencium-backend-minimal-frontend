import { API_BASE_URL } from '../config.js';

/**
 * Zentraler HTTP-Client für alle authentifizierten API-Aufrufe.
 *
 * Bündelt die zuvor ~30-fach duplizierten fetch-Blöcke der Services und
 * vereinheitlicht dabei:
 * - Fehler-Extraktion: `message`-Feld aus JSON-Fehlerantworten statt roher
 *   JSON-Blobs, Fallback auf deutsche statusbasierte Meldungen
 * - 401-Handling: zentraler Handler (vom AuthContext registriert), der die
 *   Session beendet, statt den User auf einem toten Dashboard sitzen zu lassen
 * - Guard für 204/leere Bodies statt kryptischer JSON-Parse-Fehler
 */

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const STATUS_MESSAGES = {
  400: 'Ungültige Anfrage',
  401: 'Sitzung abgelaufen – bitte erneut anmelden',
  403: 'Keine Berechtigung für diese Aktion',
  404: 'Nicht gefunden',
  409: 'Konflikt – die Daten wurden zwischenzeitlich geändert',
  500: 'Interner Serverfehler',
  502: 'Backend nicht erreichbar',
  503: 'Backend vorübergehend nicht verfügbar',
};

const fallbackMessage = (status) =>
  STATUS_MESSAGES[status] || `Anfrage fehlgeschlagen (HTTP ${status})`;

// Wird vom AuthContext registriert; feuert bei 401 auf authentifizierten
// Requests (Token war gesetzt, ist aber serverseitig nicht mehr gültig).
let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

/**
 * Extrahiert eine anzeigbare Fehlermeldung aus einer Fehlerantwort.
 * Bevorzugt das `message`-Feld von JSON-Fehler-Bodies; rohe JSON-/HTML-Blobs
 * werden nie durchgereicht (defensiv gegenüber unvollständigen Response-Mocks
 * in Tests, daher die Optional Chainings).
 */
const extractErrorMessage = async (response) => {
  try {
    const text = await response.text?.();
    if (!text) return null;

    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const data = JSON.parse(trimmed);
      const message = data?.message || data?.error;
      return typeof message === 'string' ? message : null;
    }
    if (trimmed.startsWith('<')) return null;
    return trimmed;
  } catch {
    return null;
  }
};

/**
 * Führt einen API-Request aus und liefert den geparsten JSON-Body
 * (bzw. null bei 204/leerem Body).
 *
 * @param {string} path Pfad relativ zu API_BASE_URL, inkl. Query-String
 * @param {object} [options]
 * @param {string} [options.method] HTTP-Methode (Default GET)
 * @param {string} [options.token] Access-Token für den Authorization-Header
 * @param {object} [options.body] Request-Body, wird JSON-serialisiert
 * @param {object} [options.headers] Zusätzliche Header (z. B. User-Agent für Auth-Endpunkte)
 * @param {string} [options.credentials] fetch-credentials-Modus (z. B. 'include' für das Refresh-Cookie)
 * @param {object} [options.statusMessages] Kontextspezifische Fallback-Meldungen je Status
 * @param {boolean} [options.skipUnauthorizedHandler] 401 nicht an den zentralen Handler melden
 * @throws {ApiError} bei non-ok Response, mit `status` und deutscher Meldung
 */
export const request = async (path, options = {}) => {
  const { method = 'GET', token, body, headers: extraHeaders, credentials } = options;

  const headers = { ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
    ...(credentials && { credentials }),
  });

  if (!response.ok) {
    if (response.status === 401 && token && !options.skipUnauthorizedHandler) {
      onUnauthorized?.();
    }
    const message =
      (await extractErrorMessage(response)) ||
      options.statusMessages?.[response.status] ||
      fallbackMessage(response.status);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    // Leerer oder nicht-JSON-Body bei Erfolg (z. B. 200 ohne Content)
    return null;
  }
};
