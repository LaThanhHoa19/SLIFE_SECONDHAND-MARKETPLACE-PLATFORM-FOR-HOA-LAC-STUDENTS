/** Follow / unfollow seller profiles: POST/DELETE /api/users/{id}/follow */
import axiosClient from './axiosClient';

export const followUser = (userId) => axiosClient.post(`/api/users/${userId}/follow`);
export const unfollowUser = (userId) => axiosClient.delete(`/api/users/${userId}/follow`);
