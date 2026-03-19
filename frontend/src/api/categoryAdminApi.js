/** Mục đích/API: Admin CRUD cho danh mục (category) **/
import axiosClient from './axiosClient';

export const getAdminCategories = () => axiosClient.get('/api/admin/categories');

export const createAdminCategory = (payload) =>
    axiosClient.post('/api/admin/categories', payload);

export const updateAdminCategory = (id, payload) =>
    axiosClient.put(`/api/admin/categories/${id}`, payload);

export const deleteAdminCategory = (id) =>
    axiosClient.delete(`/api/admin/categories/${id}`);

