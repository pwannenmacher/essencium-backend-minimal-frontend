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

/**
 * Fehler eines API-Aufrufs.
 *
 * `message` ist die anzeigbare Meldung. `type`, `title` und `instance` stammen
 * aus dem RFC-9457-Problem-Detail des Backends, falls eines geliefert wurde —
 * `type` ist ein stabiler URN (z. B. `urn:frachtwerk:error:INVALID_INPUT`) und
 * damit die richtige Grundlage für Fallunterscheidungen im UI. Auf `message`
 * darf dafür nicht geprüft werden: der Text ist Anzeigetext und kann sich
 * jederzeit ändern.
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
 * Liest den Fehler-Body aus und liefert `{ message, problem }`.
 *
 * `message` ist die anzeigbare Meldung, `problem` der geparste Body, sofern es
 * ein Objekt war (RFC-9457-Problem-Detail oder Legacy-Fehlerobjekt).
 *
 * Reihenfolge für die Meldung:
 *  1. `detail` — das RFC-9457-Feld mit der konkreten, für Menschen gedachten
 *     Beschreibung des Einzelfalls.
 *  2. `message`/`error` — Legacy-Form; das Backend liefert sie an noch nicht
 *     migrierten Endpunkten weiterhin.
 *  3. Klartext-Body.
 *
 * `title` wird bewusst NICHT als Meldung genutzt: Spring füllt es mit der
 * englischen HTTP-Reason-Phrase ("Bad Request"), die schlechter ist als die
 * deutschen Status-Fallbacks unten. Der Wert hängt aber am ApiError, falls das
 * Backend dort später etwas Sinnvolles setzt.
 *
 * Rohe JSON-/HTML-Blobs werden nie durchgereicht. Die Optional Chainings sind
 * Absicht: Response-Mocks in Tests sind nicht immer vollständig.
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
 * @param {object} [options.body] Request-Body, wird JSON-serialisiert
 * @param {object} [options.headers] Zusätzliche Header (z. B. User-Agent für Auth-Endpunkte)
 * @param {string} [options.credentials] fetch-credentials-Modus (z. B. 'include' für das Refresh-Cookie)
 * @param {object} [options.statusMessages] Kuratierte Meldungen je Status; haben Vorrang
 *   vor der Meldung aus dem Fehler-Body
 * @param {boolean} [options.skipUnauthorizedHandler] 401 nicht an den zentralen Handler melden
 * @throws {ApiError} bei non-ok Response, mit `status`, `type` (RFC-9457-URN) und Meldung
 */
export const request = async (path, options = {}) => {
  const { method = 'GET', token, body, headers: extraHeaders, credentials } = options;

  // Ein String-Body geht unverändert raus und bekommt kein Content-Type
  // aufgezwungen: /v1/reset-credentials liest den Body roh als String ein,
  // JSON.stringify würde die Anführungszeichen zum Teil des Wertes machen.
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
    // `statusMessages` zuerst: das sind vom Aufrufer für genau diesen Endpunkt
    // und Status kuratierte deutsche Texte. Seit das Backend RFC-9457-Problem-
    // Details liefert, hat jede Fehlerantwort ein `detail` — käme der Body
    // zuerst, wäre z. B. "Benutzername oder Passwort ist falsch" beim Login
    // dauerhaft durch die englische Backend-Meldung ersetzt.
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
