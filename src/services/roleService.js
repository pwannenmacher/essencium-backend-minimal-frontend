import { request } from './apiClient.js';

const buildPaginatedPath = (path, params) => {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.append('page', params.page);
  if (params.size !== undefined) queryParams.append('size', params.size);
  if (params.sort) queryParams.append('sort', params.sort);

  const queryString = queryParams.toString();
  const suffix = queryString ? `?${queryString}` : '';
  return `${path}${suffix}`;
};

export const getRoles = async (token, params = {}) => {
  return request(buildPaginatedPath('/v1/roles', params), { token });
};

export const getRoleByName = async (token, name) => {
  return request(`/v1/roles/${name}`, { token });
};

export const createRole = async (token, roleData) => {
  return request('/v1/roles', { method: 'POST', token, body: roleData });
};

export const updateRole = async (token, name, roleData) => {
  return request(`/v1/roles/${name}`, { method: 'PUT', token, body: { ...roleData, name } });
};

export const patchRole = async (token, name, partialData) => {
  return request(`/v1/roles/${name}`, { method: 'PATCH', token, body: { ...partialData, name } });
};

export const deleteRole = async (token, name) => {
  await request(`/v1/roles/${name}`, { method: 'DELETE', token });
};

export const getAllRights = async (token, params = {}) => {
  return request(buildPaginatedPath('/v1/rights', params), { token });
};
