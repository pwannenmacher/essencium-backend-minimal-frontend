import { API_BASE_URL } from '../config.js';

export const getApiTokens = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.ids) queryParams.append('ids', params.ids);
  if (params.createdBy) queryParams.append('createdBy', params.createdBy);
  if (params.updatedBy) queryParams.append('updatedBy', params.updatedBy);
  if (params.createdAtFrom) queryParams.append('createdAtFrom', params.createdAtFrom);
  if (params.createdAtTo) queryParams.append('createdAtTo', params.createdAtTo);
  if (params.updatedAtFrom) queryParams.append('updatedAtFrom', params.updatedAtFrom);
  if (params.updatedAtTo) queryParams.append('updatedAtTo', params.updatedAtTo);

  const url = queryParams.toString() 
    ? `${API_BASE_URL}/v1/api-tokens?${queryParams}`
    : `${API_BASE_URL}/v1/api-tokens`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Laden der API-Tokens: ${response.status}`);
  }

  return response.json();
};

export const getApiTokensBasic = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.ids) queryParams.append('ids', params.ids);
  if (params.createdBy) queryParams.append('createdBy', params.createdBy);
  if (params.updatedBy) queryParams.append('updatedBy', params.updatedBy);
  if (params.createdAtFrom) queryParams.append('createdAtFrom', params.createdAtFrom);
  if (params.createdAtTo) queryParams.append('createdAtTo', params.createdAtTo);
  if (params.updatedAtFrom) queryParams.append('updatedAtFrom', params.updatedAtFrom);
  if (params.updatedAtTo) queryParams.append('updatedAtTo', params.updatedAtTo);

  const url = queryParams.toString() 
    ? `${API_BASE_URL}/v1/api-tokens/basic?${queryParams}`
    : `${API_BASE_URL}/v1/api-tokens/basic`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Laden der API-Tokens: ${response.status}`);
  }

  return response.json();
};

export const getApiTokenById = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/v1/api-tokens/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Laden des API-Tokens: ${response.status}`);
  }

  return response.json();
};

export const createApiToken = async (token, tokenData) => {
  const response = await fetch(`${API_BASE_URL}/v1/api-tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tokenData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API-Token-Erstellung fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

export const updateApiToken = async (token, id, tokenData) => {
  const response = await fetch(`${API_BASE_URL}/v1/api-tokens/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...tokenData, id }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API-Token-Update fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

export const patchApiToken = async (token, id, partialData) => {
  const response = await fetch(`${API_BASE_URL}/v1/api-tokens/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(partialData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API-Token-Patch fehlgeschlagen: ${response.status}`);
  }

  return response.json();
};

export const revokeApiToken = async (token, id) => {
  return patchApiToken(token, id, { status: 'REVOKED' });
};

export const deleteApiToken = async (token, id) => {
  const response = await fetch(`${API_BASE_URL}/v1/api-tokens/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API-Token-Löschung fehlgeschlagen: ${response.status}`);
  }

  return;
};

export const getAllApiTokensAdmin = async (token) => {
  const response = await fetch(`${API_BASE_URL}/v1/api-tokens/all`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Laden der API-Tokens: ${response.status}`);
  }

  return response.json();
};

export const getTokenExpirationInfo = async (token) => {
  const response = await fetch(`${API_BASE_URL}/v1/api-tokens/token-expiration-info`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Fehler beim Laden der Token-Expiration-Info: ${response.status}`);
  }

  return response.json();
};
