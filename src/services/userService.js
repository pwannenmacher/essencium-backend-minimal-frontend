import { API_BASE_URL } from '../config.js';

const authenticatedFetch = async (url, token, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed: ${response.status}`);
  }

  return response.json();
};

export const getMe = async (token) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/me`, token);
};

export const getMyRoles = async (token) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/me/roles`, token);
};

export const getMyRights = async (token) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/me/roles/rights`, token);
};

export const getMyTokens = async (token) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/me/tokens`, token);
};

export const getUserById = async (token, id) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/${id}`, token);
};

export const getUsers = async (token, params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);
  if (params.sort) {
    if (Array.isArray(params.sort)) {
      params.sort.forEach((s) => queryParams.append('sort', s));
    } else {
      queryParams.append('sort', params.sort);
    }
  }

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

export const getUsersBasic = async (token, params = {}) => {
  const queryParams = new URLSearchParams();

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

export const createUser = async (token, userData) => {
  const response = await fetch(`${API_BASE_URL}/v1/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
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

export const updateUser = async (token, id, userData) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
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

export const patchUser = async (token, id, partialData) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
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

export const deleteUser = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `User-Löschung fehlgeschlagen: ${response.status}`);
  }

  return;
};

export const updateMe = async (token, userData, userId) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
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

export const patchMe = async (token, partialData, userId) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
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

export const updateMyPassword = async (token, passwordData) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/me/password`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
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
 * DELETE /v1/users/me/tokens/{id} - Einzelnen Token/Session löschen
 */
export const deleteMyToken = async (token, tokenId) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/me/tokens/${tokenId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
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
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Session-Terminierung fehlgeschlagen: ${response.status}`);
  }

  return;
};

export const getAllUsersWithTokens = async (token) => {
  return authenticatedFetch(`${API_BASE_URL}/v1/users/tokens`, token);
};

export const deleteUserToken = async (token, userId, tokenId) => {
  const response = await fetch(`${API_BASE_URL}/v1/users/${userId}/tokens/${tokenId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Token-Löschung fehlgeschlagen: ${response.status}`);
  }

  // 204 No Content
  return;
};
