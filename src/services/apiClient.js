import { API_BASE_URL } from '../config.js';

/**
 * Zentraler HTTP-Client für alle authentifizierten API-Aufrufe.
 *
 * Bündelt die zuvor ~30-fach duplizierten fetch-Blöcke der Services und
 * vereinheitlicht dabei:
 * - Fehler-Extraktion: RFC-9457-Problem-Details statt roher JSON-Blobs,
 *   Fallback auf deutsche statusbasierte Meldungen
 * - 401-Handling: zentraler Handler (vom AuthContext registriert), der die
 *   Session beendet, statt den User auf einem toten Dashboard sitzen zu lassen
 * - Guard für 204/leere Bodies statt kryptischer JSON-Parse-Fehler
 */

/**
 * `type`, `title` und `instance` stammen aus dem Problem-Detail des Backends.
 * Fallunterscheidungen gehören an `type`, nicht an die Meldung.
 */
export class ApiError extends Error {
  constructor(message, status, problem = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.type = problem?.type ?? null;
    this.title = problem?.title ?? null;
    this.instance = problem?.instance ?? null;
    this.problem = problem;
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

const asText = (value) => (typeof value === 'string' && value.trim() ? value : null);

/**
 * Liest den Fehler-Body als `{ message, problem }`.
 *
 * Meldung aus `detail` (RFC 9457), sonst `message`/`error` (Legacy-Endpunkte),
 * sonst Klartext-Body. `title` bleibt außen vor: Spring füllt es mit der
 * englischen HTTP-Reason-Phrase, die schlechter ist als die Fallbacks oben.
 * Rohe JSON-/HTML-Blobs werden nie durchgereicht.
 */
const parseErrorBody = async (response) => {
  const empty = { message: null, problem: null };

  try {
    const text = await response.text?.();
    if (!text) return empty;

    const trimmed = text.trim();

    if (trimmed.startsWith('<')) return empty;

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      const data = JSON.parse(trimmed);
      const problem = data && typeof data === 'object' && !Array.isArray(data) ? data : null;

      return {
        message: asText(problem?.detail) ?? asText(problem?.message) ?? asText(problem?.error),
        problem,
      };
    }

    return { message: trimmed, problem: null };
  } catch {
    return empty;
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
 * @param {object|string} [options.body] Request-Body; Objekte werden JSON-serialisiert,
 *   Strings unverändert gesendet
 * @param {object} [options.headers] Zusätzliche Header (z. B. User-Agent für Auth-Endpunkte)
 * @param {string} [options.credentials] fetch-credentials-Modus (z. B. 'include' für das Refresh-Cookie)
 * @param {object} [options.statusMessages] Kuratierte Meldungen je Status, mit Vorrang
 *   vor der Meldung aus dem Fehler-Body
 * @param {boolean} [options.skipUnauthorizedHandler] 401 nicht an den zentralen Handler melden
 * @throws {ApiError} bei non-ok Response, mit `status`, `type` und Meldung
 */
export const request = async (path, options = {}) => {
  const { method = 'GET', token, body, headers: extraHeaders, credentials } = options;

  // /v1/reset-credentials liest den Body roh als String; JSON.stringify würde
  // die Anführungszeichen zum Teil des Wertes machen.
  const isRawBody = typeof body === 'string';

  const headers = { ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isRawBody) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined && { body: isRawBody ? body : JSON.stringify(body) }),
    ...(credentials && { credentials }),
  });

  if (!response.ok) {
    if (response.status === 401 && token && !options.skipUnauthorizedHandler) {
      onUnauthorized?.();
    }
    const { message, problem } = await parseErrorBody(response);
    // statusMessages vor dem Body: sonst überschreibt das englische `detail`
    // die kuratierten Texte (z. B. die Login-Meldung bei 401).
    throw new ApiError(
      options.statusMessages?.[response.status] || message || fallbackMessage(response.status),
      response.status,
      problem
    );
  }

  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    // Leerer oder nicht-JSON-Body bei Erfolg (z. B. 200 ohne Content)
    return null;
  }
};
