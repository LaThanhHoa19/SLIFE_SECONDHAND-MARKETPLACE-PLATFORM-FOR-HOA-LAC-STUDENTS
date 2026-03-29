/** Admin: GET/PUT /api/admin/configurations — BaseResponse<List<ConfigResponseDTO>> / bulk update. */
import axiosClient from './axiosClient';

/**
 * @returns {Promise<import('axios').AxiosResponse>}
 * data.data: { configKey, configValue, description, lastUpdated }[]
 */
export const getAdminConfigurations = () => axiosClient.get('/api/admin/configurations');

/**
 * @param {{ key: string, value: string }[]} items
 */
export const updateAdminConfigurations = (items) =>
  axiosClient.put('/api/admin/configurations', items);
