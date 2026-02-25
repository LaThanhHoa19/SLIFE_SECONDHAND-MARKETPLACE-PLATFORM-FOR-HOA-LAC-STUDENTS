/**
 * Mục đích: API bài đăng.
 * API dùng: GET/POST/PUT /api/listings, GET /api/listings/{id}, PATCH hide/sold, POST /api/listings/{id}/images.
 * Request upload: FormData(images[]).
 * Response list mẫu: { content:[{listingId,title,price,isGiveaway,seller,images}], page,size,totalElements,totalPages }.
 */
import axiosClient from './axiosClient';
export const getListings = (params) => axiosClient.get('/api/listings', { params });
export const getListing = (id) => axiosClient.get(`/api/listings/${id}`);
export const createListing = (payload) => axiosClient.post('/api/listings', payload);
export const updateListing = (id, payload) => axiosClient.put(`/api/listings/${id}`, payload);
export const hideListing = (id) => axiosClient.patch(`/api/listings/${id}/hide`);
export const markSold = (id) => axiosClient.patch(`/api/listings/${id}/sold`);
export const uploadImages = (id, formData, onUploadProgress) => axiosClient.post(`/api/listings/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress });
