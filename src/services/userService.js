const API_BASE_URL = 'http://localhost:8098';

/**
 * Hilfsfunktion für authentifizierte API-Calls
 */
const authenticatedFetch = async (url, token, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed: ${response.status}`);
  }

  return response.json();
};

/**
 * GET /v1/users/me - Aktuell eingeloggten User abrufen
 */
export const getMe = async (token) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/me`, token);
};

/**
 * GET /v1/users/me/roles - Rollen des aktuellen Users
 */
export const getMyRoles = async (token) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/me/roles`, token);
};

/**
 * GET /v1/users/me/roles/rights - Rechte des aktuellen Users
 */
export const getMyRights = async (token) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/me/roles/rights`, token);
};

/**
 * GET /v1/users/me/token - Refresh Tokens des aktuellen Users
 */
export const getMyTokens = async (token) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/me/token`, token);
};

/**
 * GET /v1/users/{id} - Einen spezifischen User abrufen
 */
export const getUserById = async (token, id) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/${id}`, token);
};

/**
 * GET /v1/users - Alle User abrufen (mit Paginierung und Filtern)
 */
export const getUsers = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  
  // Paginierung
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);
  if (params.sort) {
    if (Array.isArray(params.sort)) {
      params.sort.forEach(s => queryParams.append('sort', s));
    } else {
      queryParams.append('sort', params.sort);
    }
  }
  
  // Filter
  if (params.ids) queryParams.append('ids', params.ids);
  if (params.email) queryParams.append('email', params.email);
  if (params.name) queryParams.append('name', params.name);
  if (params.roles) queryParams.append('roles', params.roles);
  if (params.createdBy) queryParams.append('createdBy', params.createdBy);
  if (params.updatedBy) queryParams.append('updatedBy', params.updatedBy);
  if (params.createdAtFrom) queryParams.append('createdAtFrom', params.createdAtFrom);
  if (params.createdAtTo) queryParams.append('createdAtTo', params.createdAtTo);
  if (params.updatedAtFrom) queryParams.append('updatedAtFrom', params.updatedAtFrom);
  if (params.updatedAtTo) queryParams.append('updatedAtTo', params.updatedAtTo);
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/v1/users${queryString ? `?${queryString}` : ''}`;
  
  return authenticatedFetch(url, token);
};

/**
 * GET /v1/users/basic - Alle User als Basic Representation
 */
export const getUsersBasic = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  
  // Filter (ohne Paginierung)
  if (params.ids) queryParams.append('ids', params.ids);
  if (params.email) queryParams.append('email', params.email);
  if (params.name) queryParams.append('name', params.name);
  if (params.roles) queryParams.append('roles', params.roles);
  if (params.createdBy) queryParams.append('createdBy', params.createdBy);
  if (params.updatedBy) queryParams.append('updatedBy', params.updatedBy);
  if (params.createdAtFrom) queryParams.append('createdAtFrom', params.createdAtFrom);
  if (params.createdAtTo) queryParams.append('createdAtTo', params.createdAtTo);
  if (params.updatedAtFrom) queryParams.append('updatedAtFrom', params.updatedAtFrom);
  if (params.updatedAtTo) queryParams.append('updatedAtTo', params.updatedAtTo);
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/v1/users/basic${queryString ? `?${queryString}` : ''}`;
  
  return authenticatedFetch(url, token);
};

/**
 * POST /v1/users - Neuen User erstellen
 */
export const createUser = async (token, userData) => {
  const response = await fetch(`${API_BASE_URL}/v1/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `User-Erstellung fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

/**
 * PUT /v1/users/{id} - User vollständig aktualisieren
 * Hinweis: ID muss sowohl im Pfad als auch im Body übergeben werden
 */
export const updateUser = async (token, id, userData) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...userData, id }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `User-Update fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

/**
 * PATCH /v1/users/{id} - User partiell aktualisieren
 * Hinweis: ID muss sowohl im Pfad als auch im Body übergeben werden
 */
export const patchUser = async (token, id, partialData) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...partialData, id }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `User-Patch fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

/**
 * DELETE /v1/users/{id} - User löschen
 */
export const deleteUser = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `User-Löschung fehlgeschlagen: ${response.status}`);
  }

  // 204 No Content hat keinen Body
  return;
};

/**
 * PUT /v1/users/me - Eigenes Profil vollständig aktualisieren
 * Hinweis: ID muss im Body übergeben werden
 */
export const updateMe = async (token, userData, userId) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...userData, id: userId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Profil-Update fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

/**
 * PATCH /v1/users/me - Eigenes Profil partiell aktualisieren
 * Hinweis: ID muss im Body übergeben werden
 */
export const patchMe = async (token, partialData, userId) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...partialData, id: userId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Profil-Patch fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

/**
 * PUT /v1/users/me/password - Eigenes Passwort ändern
 */
export const updateMyPassword = async (token, passwordData) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/me/password`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(passwordData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Passwort-Änderung fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

/**
 * DELETE /v1/users/me/token/{id} - Einzelnen Token/Session löschen
 */
export const deleteMyToken = async (token, tokenId) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/me/token/${tokenId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Token-Löschung fehlgeschlagen: ${response.status}`);
  }

  // 204 No Content
  return;
};

/**
 * POST /v1/users/{id}/terminate - Alle Sessions eines Users beenden
 */
export const terminateUserSessions = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/${id}/terminate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Session-Terminierung fehlgeschlagen: ${response.status}`);
  }

  // 204 No Content
  return;
};
