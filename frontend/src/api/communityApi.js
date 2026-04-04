/**
 * API bài đăng cộng đồng — khớp backend CommunityPostController.
 */
import axiosClient from './axiosClient';

/** Public: { maxImagesPerPost } */
export const getCommunityPostFormConfig = () => axiosClient.get('/api/community/posts/form-config');

/** Tạo bài + ảnh (multipart) — payload JSON part + images[] */
export const createCommunityPostWithImages = (payload, imageFiles = []) => {
    const formData = new FormData();
    formData.append(
        'payload',
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
        'payload.json',
    );
    (imageFiles || []).forEach((f) => formData.append('images', f));
    return axiosClient.post('/api/community/posts', formData, { timeout: 120000 });
};

export const getCommunityPosts = (params = {}) =>
    axiosClient.get('/api/community/posts', { params });

export const getCommunityPost = (id) => axiosClient.get(`/api/community/posts/${id}`);
