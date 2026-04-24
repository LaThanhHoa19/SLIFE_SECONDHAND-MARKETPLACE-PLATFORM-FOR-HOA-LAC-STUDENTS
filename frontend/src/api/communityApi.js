/**
 * API bài đăng cộng đồng — khớp backend CommunityPostController.
 */
import axiosClient from './axiosClient';
import uploadClient from './uploadClient';

/** Public: { maxImagesPerPost } */
export const getCommunityPostFormConfig = () => axiosClient.get('/api/community/posts/form-config');

/** Tạo bài + ảnh (multipart) — payload JSON part + images[] */
export const createCommunityPostWithImages = async (payload, imageFiles = []) => {
    // Step 1: Create post (JSON — goes through CloudFront fine)
    const createRes = await axiosClient.post('/api/community/posts', payload, {
        headers: { 'Content-Type': 'application/json' },
    });

    // Step 2: Upload images via ALB directly (bypass CloudFront multipart issue)
    const postId = createRes?.data?.data?.id;
    if (postId && imageFiles && imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((f) => formData.append('images', f));
        await uploadClient.post(`/api/community/posts/${postId}/images`, formData, { timeout: 120000 });
        // Re-fetch to get updated post with images
        return axiosClient.get(`/api/community/posts/${postId}`);
    }
    return createRes;
};

export const getCommunityPosts = (params = {}, config = {}) =>
    axiosClient.get('/api/community/posts', { params, ...config });

/** Gợi ý hashtag theo tiền tố (q rỗng → trending). */
export const getCommunityHashtagSuggest = (params = {}, config = {}) =>
    axiosClient.get('/api/community/hashtags/suggest', { params, ...config });

/** Xu hướng: { tag, postCount } theo số bài ACTIVE có thẻ trong cửa sổ `days`. */
export const getCommunityHashtagTrending = (params = {}, config = {}) =>
    axiosClient.get('/api/community/hashtags/trending', { params, ...config });

export const getCommunityPost = (id) => axiosClient.get(`/api/community/posts/${id}`);
export const updateCommunityPost = (id, payload) => axiosClient.put(`/api/community/posts/${id}`, payload);
export const deleteCommunityPost = (id) => axiosClient.delete(`/api/community/posts/${id}`);
export const uploadCommunityPostImages = (id, imageFiles = []) => {
    const formData = new FormData();
    (imageFiles || []).forEach((f) => formData.append('images', f));
    return uploadClient.post(`/api/community/posts/${id}/images`, formData, { timeout: 120000 });
};
export const deleteCommunityPostImage = (id, imageId) =>
    axiosClient.delete(`/api/community/posts/${id}/images/${imageId}`);

export const toggleCommunityPostLike = (id) => axiosClient.post(`/api/community/posts/${id}/like`);
export const toggleCommunityPostSave = (id) => axiosClient.post(`/api/community/posts/${id}/save`);
export const getSavedCommunityPosts = (params = {}, config = {}) =>
    axiosClient.get('/api/community/posts/saved', { params, ...config });
export const getLikedCommunityPosts = (params = {}, config = {}) =>
    axiosClient.get('/api/community/posts/liked', { params, ...config });
export const getCommunityPostsByAuthor = (authorId, params = {}, config = {}) =>
    axiosClient.get(`/api/community/posts/by-author/${authorId}`, { params, ...config });
export const getMyCommunityPosts = (params = {}, config = {}) =>
    axiosClient.get('/api/community/posts/mine', { params, ...config });

export const getCommunityPostComments = (postId) =>
    axiosClient.get(`/api/v1/community-posts/${postId}/comments`);

export const createCommunityPostComment = (postId, body) =>
    axiosClient.post(`/api/v1/community-posts/${postId}/comments`, body);

export const replyCommunityPostComment = (commentId, body) =>
    axiosClient.post(`/api/v1/community-post-comments/${commentId}/reply`, body);

export const updateCommunityPostComment = (commentId, body) =>
    axiosClient.put(`/api/v1/community-post-comments/${commentId}`, body);

export const deleteCommunityPostComment = (commentId) =>
    axiosClient.delete(`/api/v1/community-post-comments/${commentId}`);
