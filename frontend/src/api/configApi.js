/** Admin: GET/PUT /api/admin/configurations — BaseResponse<List<ConfigResponseDTO>> / bulk update. */
import adminAxiosClient from './adminAxiosClient';

/**
 * @returns {Promise<import('axios').AxiosResponse>}
 * data.data: { configKey, configValue, description, lastUpdated }[]
 */
export const getAdminConfigurations = () => adminAxiosClient.get('/api/admin/configurations');

/**
 * @param {{ key: string, value: string, description?: string | null }[]} items
 */
export const updateAdminConfigurations = (items) =>
  adminAxiosClient.put('/api/admin/configurations', items);

/**
 * @param {number|string} id
 * @param {{ value: string, description?: string | null }} payload
 */
export const updateAdminConfigurationById = (id, payload) =>
  adminAxiosClient.put(`/api/admin/configurations/${id}`, payload);
