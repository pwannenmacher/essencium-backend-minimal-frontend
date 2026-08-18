/**
 * Zentrale Konfiguration für die Anwendung
 */

// Im Docker-Image schreibt docker-entrypoint.sh dieses Objekt zur Laufzeit nach
// /usr/share/nginx/html/runtime-config.js; im Dev-Build liefert
// public/runtime-config.js ein leeres Objekt. Einheitlich `window.` — dieselbe
// Schreibweise in Entrypoint, public/runtime-config.js und hier.
const runtimeConfig = window.RUNTIME_CONFIG;

export const API_BASE_URL =
  runtimeConfig?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8098';

export const FRONTEND_URL =
  runtimeConfig?.VITE_FRONTEND_URL || import.meta.env.VITE_FRONTEND_URL || window.location.origin;
