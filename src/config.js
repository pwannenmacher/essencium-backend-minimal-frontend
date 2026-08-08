/**
 * Zentrale Konfiguration für die Anwendung
 */

const runtimeConfig = globalThis.window?.RUNTIME_CONFIG;

export const API_BASE_URL =
  runtimeConfig?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8098';

export const FRONTEND_URL =
  runtimeConfig?.VITE_FRONTEND_URL || import.meta.env.VITE_FRONTEND_URL || window.location.origin;
