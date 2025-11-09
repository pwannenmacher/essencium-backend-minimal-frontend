/**
 * Zentrale Konfiguration für die Anwendung
 * 
 * Umgebungsvariablen werden über Vite bereitgestellt und können zur Build-Zeit
 * oder zur Entwicklungszeit über .env-Dateien gesetzt werden.
 * 
 * Für Docker-Deployments wird zur Laufzeit eine runtime-config.js geladen,
 * die die Umgebungsvariablen VITE_API_URL und VITE_FRONTEND_URL enthält.
 */

// Runtime-Konfiguration (wird vom Docker-Entrypoint gesetzt)
const runtimeConfig = typeof window !== 'undefined' && window.RUNTIME_CONFIG;

// Backend API Base URL
// Priorität: Runtime-Config > Build-Zeit-Env > Default
export const API_BASE_URL = 
  (runtimeConfig && runtimeConfig.VITE_API_URL) || 
  import.meta.env.VITE_API_URL || 
  'http://localhost:8098';

// Frontend URL (für OAuth Redirects etc.)
// Priorität: Runtime-Config > Build-Zeit-Env > window.location.origin
export const FRONTEND_URL = 
  (runtimeConfig && runtimeConfig.VITE_FRONTEND_URL) || 
  import.meta.env.VITE_FRONTEND_URL || 
  window.location.origin;
