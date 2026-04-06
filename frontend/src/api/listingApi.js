/**
 * Mục đích: API bài đăng.
 * API dùng: GET/POST/PUT /api/listings (POST JSON hoặc multipart qua createListingWithImages), GET /api/listings/{id}, POST /api/listings/{id}/images.
 * Request upload: FormData(images[]).
 * Response list mẫu: { content:[{listingId,title,price,isGiveaway,seller,images}], page,size,totalElements,totalPages }.
 */
import axiosClient from './axiosClient';
import adminAxiosClient from './adminAxiosClient';

const sanitizeQueryParams = (params = {}) => Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
);

export const getListings = (params, config = {}) =>
    axiosClient.get('/api/listings', { params: sanitizeQueryParams(params), ...config });
/** Public: { maxImagesPerPost } — đồng bộ giới hạn ảnh với BE (MAX_IMAGES_PER_POST). */
export const getListingFormConfig = () => axiosClient.get('/api/listings/form-config');
export const searchListings = (params = {}) =>
    axiosClient.get('/api/search', { params: sanitizeQueryParams(params) });
export const getListing = (id) => axiosClient.get(`/api/listings/${id}`);
/** Share metadata/url for listing detail + social share. */
export const getListingShareInfo = (id) => axiosClient.get(`/api/listings/${id}/share`);
/** POST — một endpoint: lần 1 like, lần 2 bỏ like (cần đăng nhập). */
export const toggleListingLike = (id) => axiosClient.post(`/api/listings/${id}/like`);
/** Lưu / bỏ lưu tin (auth). */
export const saveListing = (id) => axiosClient.post(`/api/listings/${id}/save`);
export const unsaveListing = (id) => axiosClient.delete(`/api/listings/${id}/save`);
export const getSavedListings = (params = {}) =>
    axiosClient.get('/api/me/saved-listings', { params: sanitizeQueryParams(params) });
export const getLikedListings = (params = {}) =>
    axiosClient.get('/api/me/liked-listings', { params: sanitizeQueryParams(params) });
export const createListing = (payload) => axiosClient.post('/api/listings', payload);
/** Tạo tin + ảnh một lần (multipart) — đồng bộ với BE transaction, tránh tin đã tạo khi upload lỗi. */
export const createListingWithImages = (payload, imageFiles = []) => {
    const formData = new FormData();
    // Tên file giúp một số proxy/Spring nhận đúng part JSON (tránh 400 khi bind @RequestPart)
    formData.append(
        'payload',
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
        'payload.json',
    );
    (imageFiles || []).forEach((f) => formData.append('images', f));
    return axiosClient.post('/api/listings', formData);
};
export const updateListing = (id, payload) => axiosClient.put(`/api/listings/${id}`, payload);
export const hideListing = (id) => axiosClient.patch(`/api/listings/${id}/hide`);
/** Admin ẩn tin từ moderation/report flow. */
export const adminHideListing = (id) => adminAxiosClient.patch(`/api/admin/listings/${id}/hide`);
export const markSold = (id) => axiosClient.patch(`/api/listings/${id}/sold`);
export const uploadImages = (id, formData, onUploadProgress) =>
    axiosClient.post(`/api/listings/${id}/images`, formData, onUploadProgress ? { onUploadProgress } : {});

/** Xóa một ảnh đã lưu (chỉ chủ tin). */
export const deleteListingImage = (listingId, imageId) =>
    axiosClient.delete(`/api/listings/${listingId}/images/${imageId}`);

// Comments
export const getComments = (listingId) => axiosClient.get(`/api/v1/listings/${listingId}/comments`);
export const createComment = (payload) => axiosClient.post('/api/v1/comments', payload);
export const replyToComment = (id, payload) => axiosClient.post(`/api/v1/comments/${id}/reply`, payload);
export const deleteComment = (id) => axiosClient.delete(`/api/v1/comments/${id}`);
export const updateComment = (id, payload) => axiosClient.put(`/api/v1/comments/${id}`, payload);
