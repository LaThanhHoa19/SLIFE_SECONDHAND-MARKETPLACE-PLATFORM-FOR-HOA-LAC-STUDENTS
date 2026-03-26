/**
 * Mục đích: API bài đăng.
 * API dùng: GET/POST/PUT /api/listings, GET /api/listings/{id}, PATCH hide/sold, POST /api/listings/{id}/images.
 * Request upload: FormData(images[]).
 * Response list mẫu: { content:[{listingId,title,price,isGiveaway,seller,images}], page,size,totalElements,totalPages }.
 */
import axiosClient from './axiosClient';

const sanitizeQueryParams = (params = {}) => Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

export const getListings = (params, config = {}) =>
    axiosClient.get('/api/listings', { params: sanitizeQueryParams(params), ...config });
export const searchListings = (params = {}) =>
    axiosClient.get('/api/search', { params: sanitizeQueryParams(params) });
export const getListing = (id) => axiosClient.get(`/api/listings/${id}`);
/** POST — một endpoint: lần 1 like, lần 2 bỏ like (cần đăng nhập). */
export const toggleListingLike = (id) => axiosClient.post(`/api/listings/${id}/like`);
/** Lưu / bỏ lưu tin (auth). */
export const saveListing = (id) => axiosClient.post(`/api/listings/${id}/save`);
export const unsaveListing = (id) => axiosClient.delete(`/api/listings/${id}/save`);
export const createListing = (payload) => axiosClient.post('/api/listings', payload);

/** Tạo tin + ảnh trong một request (multipart) — backend rollback nếu vượt giới hạn ảnh. */
export const createListingWithImages = (payload, imageFiles = [], onUploadProgress) => {
    const formData = new FormData();
    formData.append(
        'payload',
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
    );
    (imageFiles || []).forEach((f) => {
        if (f) formData.append('images', f);
    });
    const config = {};
    if (onUploadProgress) config.onUploadProgress = onUploadProgress;
    return axiosClient.post('/api/listings', formData, config);
};
export const updateListing = (id, payload) => axiosClient.put(`/api/listings/${id}`, payload);
export const hideListing = (id) => axiosClient.patch(`/api/listings/${id}/hide`);
export const markSold = (id) => axiosClient.patch(`/api/listings/${id}/sold`);
export const uploadImages = (id, formData, onUploadProgress) =>
    axiosClient.post(`/api/listings/${id}/images`, formData, onUploadProgress ? { onUploadProgress } : {});

// Comments
export const getComments = (listingId) => axiosClient.get(`/api/v1/listings/${listingId}/comments`);
export const createComment = (payload) => axiosClient.post('/api/v1/comments', payload);
export const replyToComment = (id, payload) => axiosClient.post(`/api/v1/comments/${id}/reply`, payload);
export const deleteComment = (id) => axiosClient.delete(`/api/v1/comments/${id}`);
export const updateComment = (id, payload) => axiosClient.put(`/api/v1/comments/${id}`, payload);
