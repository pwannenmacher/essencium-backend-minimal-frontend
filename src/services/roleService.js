import { API_BASE_URL } from '../config.js';

/**
 * GET /v1/roles - Alle Rollen abrufen
 */
export const getRoles = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);
  if (params.sort) queryParams.append('sort', params.sort);
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/v1/roles${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Laden der Rollen: ${response.status}`);
  }

  return response.json();
};

/**
 * GET /v1/roles/{name} - Einzelne Rolle abrufen
 */
export const getRoleByName = async (token, name) => {
  const response = await fetch(`${API_BASE_URL}/v1/roles/${name}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Laden der Rolle: ${response.status}`);
  }

  return response.json();
};

/**
 * POST /v1/roles - Neue Rolle erstellen
 */
export const createRole = async (token, roleData) => {
  const response = await fetch(`${API_BASE_URL}/v1/roles`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(roleData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Rollen-Erstellung fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

/**
 * PUT /v1/roles/{name} - Rolle vollständig aktualisieren
 */
export const updateRole = async (token, name, roleData) => {
  const response = await fetch(`${API_BASE_URL}/v1/roles/${name}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...roleData, name }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Rollen-Update fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

/**
 * PATCH /v1/roles/{name} - Rolle partiell aktualisieren
 */
export const patchRole = async (token, name, partialData) => {
  const response = await fetch(`${API_BASE_URL}/v1/roles/${name}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...partialData, name }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Rollen-Patch fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

/**
 * DELETE /v1/roles/{name} - Rolle löschen
 */
export const deleteRole = async (token, name) => {
  const response = await fetch(`${API_BASE_URL}/v1/roles/${name}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Rollen-Löschung fehlgeschlagen: ${response.status}`);
  }

  // 204 No Content
  return;
};

/**
 * GET /v1/rights - Alle verfügbaren Rechte abrufen
 */
export const getAllRights = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);
  if (params.sort) queryParams.append('sort', params.sort);
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/v1/rights${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Laden der Rechte: ${response.status}`);
  }

  return response.json();
};
