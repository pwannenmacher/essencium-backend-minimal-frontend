import { request } from './apiClient.js';

export const getMe = async (token) => {
  return request('/v1/users/me', { token });
};

export const getMyRoles = async (token) => {
  return request('/v1/users/me/roles', { token });
};

export const getMyRights = async (token) => {
  return request('/v1/users/me/roles/rights', { token });
};

export const getMyTokens = async (token) => {
  return request('/v1/users/me/tokens', { token });
};

export const getUserById = async (token, id) => {
  return request(`/v1/users/${id}`, { token });
};

// Gemeinsame Filter-Felder für die User-Listen-Endpunkte.
const USER_FILTER_KEYS = [
  'ids',
  'email',
  'name',
  'roles',
  'createdBy',
  'updatedBy',
  'createdAtFrom',
  'createdAtTo',
  'updatedAtFrom',
  'updatedAtTo',
];

const appendUserFilters = (queryParams, params) => {
  USER_FILTER_KEYS.forEach((key) => {
    if (params[key]) queryParams.append(key, params[key]);
  });
};

const buildPath = (path, queryParams) => {
  const queryString = queryParams.toString();
  const suffix = queryString ? `?${queryString}` : '';
  return `${path}${suffix}`;
};

export const getUsers = async (token, params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);
  if (params.sort) {
    const sorts = Array.isArray(params.sort) ? params.sort : [params.sort];
    sorts.forEach((s) => queryParams.append('sort', s));
  }
  appendUserFilters(queryParams, params);

  return request(buildPath('/v1/users', queryParams), { token });
};

export const getUsersBasic = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  appendUserFilters(queryParams, params);

  return request(buildPath('/v1/users/basic', queryParams), { token });
};

export const createUser = async (token, userData) => {
  return request('/v1/users', { method: 'POST', token, body: userData });
};

export const updateUser = async (token, id, userData) => {
  return request(`/v1/users/${id}`, { method: 'PUT', token, body: { ...userData, id } });
};

export const patchUser = async (token, id, partialData) => {
  return request(`/v1/users/${id}`, { method: 'PATCH', token, body: { ...partialData, id } });
};

export const deleteUser = async (token, id) => {
  await request(`/v1/users/${id}`, { method: 'DELETE', token });
};

export const updateMe = async (token, userData, userId) => {
  return request('/v1/users/me', { method: 'PUT', token, body: { ...userData, id: userId } });
};

export const patchMe = async (token, partialData, userId) => {
  return request('/v1/users/me', { method: 'PATCH', token, body: { ...partialData, id: userId } });
};

export const updateMyPassword = async (token, passwordData) => {
  return request('/v1/users/me/password', { method: 'PUT', token, body: passwordData });
};

/**
 * DELETE /v1/users/me/tokens/{id} - Einzelnen Token/Session löschen
 */
export const deleteMyToken = async (token, tokenId) => {
  await request(`/v1/users/me/tokens/${tokenId}`, { method: 'DELETE', token });
};

/**
 * POST /v1/users/{id}/terminate - Alle Sessions eines Users beenden
 */
export const terminateUserSessions = async (token, id) => {
  await request(`/v1/users/${id}/terminate`, { method: 'POST', token });
};

export const getAllUsersWithTokens = async (token) => {
  return request('/v1/users/tokens', { token });
};

export const deleteUserToken = async (token, userId, tokenId) => {
  await request(`/v1/users/${userId}/tokens/${tokenId}`, { method: 'DELETE', token });
};
