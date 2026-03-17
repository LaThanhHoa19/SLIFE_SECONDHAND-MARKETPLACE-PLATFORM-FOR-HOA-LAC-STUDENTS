/** Mục đích/API: GET /api/deals/{id}, POST /api/deals/{id}/reminder. */
/** Mục đích/API: GET /api/deals/{id}, PUT /api/deals/{id}/confirm|cancel, POST /api/deals/{id}/reminder. */
import axiosClient from './axiosClient';
export const getDeal = (id) => axiosClient.get(`/api/deals/${id}`);
export const confirmDeal = (id) => axiosClient.put(`/api/deals/${id}/confirm`);
export const cancelDeal = (id, reason) => axiosClient.put(`/api/deals/${id}/cancel`, { reason });
export const sendReminder = (id) => axiosClient.post(`/api/deals/${id}/reminder`);
