/**
 * Zentrale Konstanten für Rechte, API-Token-Status und Storage-Keys.
 * Ersetzt die zuvor verstreuten String-Literale — Tippfehler in Rechte-Namen
 * wurden sonst zu stillen Berechtigungslücken.
 */

export const RIGHTS = {
  API_TOKEN: 'API_TOKEN',
  API_TOKEN_ADMIN: 'API_TOKEN_ADMIN',
  ROLE_READ: 'ROLE_READ',
  ROLE_CREATE: 'ROLE_CREATE',
  ROLE_UPDATE: 'ROLE_UPDATE',
  ROLE_DELETE: 'ROLE_DELETE',
  SESSION_TOKEN_ADMIN: 'SESSION_TOKEN_ADMIN',
};

export const API_TOKEN_STATUS = {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  REVOKED_ROLE_CHANGED: 'REVOKED_ROLE_CHANGED',
  REVOKED_RIGHTS_CHANGED: 'REVOKED_RIGHTS_CHANGED',
  REVOKED_USER_CHANGED: 'REVOKED_USER_CHANGED',
  EXPIRED: 'EXPIRED',
  USER_DELETED: 'USER_DELETED',
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  THEME_MODE: 'themeMode',
};
