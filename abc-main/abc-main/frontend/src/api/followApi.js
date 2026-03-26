/** Follow / unfollow + follower/following lists */
import axiosClient from './axiosClient';

export const followUser = (userId) => axiosClient.post(`/api/users/${userId}/follow`);
export const unfollowUser = (userId) => axiosClient.delete(`/api/users/${userId}/follow`);

/** @param {{ page?: number, size?: number }} [params] */
export const getFollowers = (userId, params) =>
    axiosClient.get(`/api/users/${userId}/followers`, { params });

/** @param {{ page?: number, size?: number }} [params] */
export const getFollowing = (userId, params) =>
    axiosClient.get(`/api/users/${userId}/following`, { params });
