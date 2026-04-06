/** Mục đích/API: Admin CRUD cho danh mục (category) **/
import adminAxiosClient from './adminAxiosClient';

export const getAdminCategories = () => adminAxiosClient.get('/api/admin/categories');

export const createAdminCategory = (payload) =>
    adminAxiosClient.post('/api/admin/categories', payload);

export const updateAdminCategory = (id, payload) =>
    adminAxiosClient.put(`/api/admin/categories/${id}`, payload);

export const deleteAdminCategory = (id) =>
    adminAxiosClient.delete(`/api/admin/categories/${id}`);

