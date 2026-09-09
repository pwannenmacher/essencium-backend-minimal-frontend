/**
 * Zentrale Konfiguration für die Anwendung
 */

// Zur Laufzeit von docker-entrypoint.sh geschrieben, im Dev-Build leer
// (public/runtime-config.js).
const runtimeConfig = window.RUNTIME_CONFIG;

// 'true'/'false' aus Runtime- bzw. Build-Env; alles andere (inkl. leerem Wert)
// gilt als "nicht gesetzt", damit die nächste Quelle greifen kann.
const parseFlag = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value).toLowerCase() === 'true';
};

export const API_BASE_URL =
  runtimeConfig?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8098';

export const FRONTEND_URL =
  runtimeConfig?.VITE_FRONTEND_URL || import.meta.env.VITE_FRONTEND_URL || window.location.origin;

// Schnell-Login mit den Backend-Default-Credentials. Standardmäßig nur im
// Dev-Build sichtbar, per VITE_SHOW_DEV_LOGIN auch im Container aktivierbar.
export const SHOW_DEV_LOGIN =
  parseFlag(runtimeConfig?.VITE_SHOW_DEV_LOGIN) ??
  parseFlag(import.meta.env.VITE_SHOW_DEV_LOGIN) ??
  import.meta.env.DEV;
