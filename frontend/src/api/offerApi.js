/** Mục đích/API: POST /api/v1/offers/make, POST /api/listings/{id}/offers, PUT /api/offers/{id}/accept|reject. */
import axiosClient from './axiosClient';
export const createOffer = (payload) => axiosClient.post('/api/v1/offers/make', payload);
export const createListingOffer = (listingId, payload) => axiosClient.post(`/api/listings/${listingId}/offers`, payload);
export const acceptOffer = (id) => axiosClient.put(`/api/offers/${id}/accept`);
export const rejectOffer = (id) => axiosClient.put(`/api/offers/${id}/reject`);
