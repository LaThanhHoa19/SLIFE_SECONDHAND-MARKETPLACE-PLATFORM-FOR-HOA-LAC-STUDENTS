/** Mục đích/API: GET /api/users/me, GET /api/users/{id}, PUT /api/users/me, upload avatar/cover, block. */
import axiosClient from './axiosClient';

export const getUser = () => axiosClient.get('/api/users/me');
export const getUserById = (id) => axiosClient.get(`/api/users/${id}`);
export const updateUser = (payload) => axiosClient.put('/api/users/me', payload);

/** Phone verification: mark phone number as verified */
export const verifyPhoneNumber = (payload) => axiosClient.post('/api/users/me/phone/verify', payload);

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

export const blockUser = (userId, reason) => axiosClient.post(`/api/users/${userId}/block`, { reason });
export const getAdminUsers = () => axiosClient.get('/api/admin/users');
