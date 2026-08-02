import { request } from './apiClient.js';

// Gemeinsame Filter-Felder für die API-Token-Listen-Endpunkte.
const API_TOKEN_FILTER_KEYS = [
  'ids',
  'createdBy',
  'updatedBy',
  'createdAtFrom',
  'createdAtTo',
  'updatedAtFrom',
  'updatedAtTo',
];

const buildPath = (path, queryParams) => {
  const queryString = queryParams.toString();
  const suffix = queryString ? `?${queryString}` : '';
  return `${path}${suffix}`;
};

export const getApiTokens = async (token, params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);
  if (params.sort) queryParams.append('sort', params.sort);
  API_TOKEN_FILTER_KEYS.forEach((key) => {
    if (params[key]) queryParams.append(key, params[key]);
  });

  return request(buildPath('/v1/api-tokens', queryParams), { token });
};

export const getApiTokensBasic = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  API_TOKEN_FILTER_KEYS.forEach((key) => {
    if (params[key]) queryParams.append(key, params[key]);
  });

  return request(buildPath('/v1/api-tokens/basic', queryParams), { token });
};

export const getApiTokenById = async (token, id) => {
  return request(`/v1/api-tokens/${id}`, { token });
};

export const createApiToken = async (token, tokenData) => {
  return request('/v1/api-tokens', { method: 'POST', token, body: tokenData });
};

export const updateApiToken = async (token, id, tokenData) => {
  return request(`/v1/api-tokens/${id}`, { method: 'PUT', token, body: { ...tokenData, id } });
};

export const patchApiToken = async (token, id, partialData) => {
  return request(`/v1/api-tokens/${id}`, { method: 'PATCH', token, body: partialData });
};

export const revokeApiToken = async (token, id) => {
  return patchApiToken(token, id, { status: 'REVOKED' });
};

export const deleteApiToken = async (token, id) => {
  await request(`/v1/api-tokens/${id}`, { method: 'DELETE', token });
};

export const getAllApiTokensAdmin = async (token) => {
  return request('/v1/api-tokens/all', { token });
};

export const getTokenExpirationInfo = async (token) => {
  return request('/v1/api-tokens/token-expiration-info', { token });
};
