/** Mục đích/API: GET /api/deals/{id}, POST /api/deals/{id}/reminder. */
import axiosClient from './axiosClient';
export const getDeal = (id) => axiosClient.get(`/api/deals/${id}`);
export const sendReminder = (id) => axiosClient.post(`/api/deals/${id}/reminder`);
