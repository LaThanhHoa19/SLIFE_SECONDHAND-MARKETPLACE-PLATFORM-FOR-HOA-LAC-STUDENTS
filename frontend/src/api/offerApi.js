/** Mục đích/API: POST /api/offers, PATCH /api/offers/{id}/accept|reject. */
import axiosClient from './axiosClient';
export const createOffer = (payload) => axiosClient.post('/api/offers', payload);
export const acceptOffer = (id) => axiosClient.patch(`/api/offers/${id}/accept`);
export const rejectOffer = (id) => axiosClient.patch(`/api/offers/${id}/reject`);
