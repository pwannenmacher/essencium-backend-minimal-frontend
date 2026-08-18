/**
 * Zentrale Konfiguration für die Anwendung
 */

// Zur Laufzeit von docker-entrypoint.sh geschrieben, im Dev-Build leer
// (public/runtime-config.js).
const runtimeConfig = window.RUNTIME_CONFIG;

export const API_BASE_URL =
  runtimeConfig?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8098';

export const FRONTEND_URL =
  runtimeConfig?.VITE_FRONTEND_URL || import.meta.env.VITE_FRONTEND_URL || window.location.origin;
