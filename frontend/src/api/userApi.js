/** Mục đích/API: GET /api/users/me, GET /api/users/{id}, PUT /api/users/me, upload avatar/cover, block. */
import axiosClient from './axiosClient';

export const getUser = () => axiosClient.get('/api/users/me');
export const getUserById = (id) => axiosClient.get(`/api/users/${id}`);
export const updateUser = (payload) => axiosClient.put('/api/users/me', payload);

/** Upload avatar: FormData với key "file". Không set Content-Type để browser tự gửi boundary. */
export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append('file', file);
  return axiosClient.post('/api/users/me/avatar', form);
};

/** Upload ảnh bìa: FormData với key "file". */
export const uploadCover = (file) => {
  const form = new FormData();
  form.append('file', file);
  return axiosClient.post('/api/users/me/cover', form);
};

export const blockUser = (userId) => axiosClient.post(`/api/users/${userId}/block`);
export const unblockUser = (userId) => axiosClient.delete(`/api/users/${userId}/block`);
export const getBlockStatus = (userId) => axiosClient.get(`/api/users/${userId}/block`);
export const getMyBlockedUsers = (params = {}) => axiosClient.get('/api/users/me/blocks', { params });
/** @param {Record<string, string|number>} [params] — sortBy, sortDir; status: ACTIVE|BANNED|RESTRICTED (bỏ qua khi lọc tất cả) */
export const getAdminUsers = (params = {}) => axiosClient.get('/api/admin/users', { params });
