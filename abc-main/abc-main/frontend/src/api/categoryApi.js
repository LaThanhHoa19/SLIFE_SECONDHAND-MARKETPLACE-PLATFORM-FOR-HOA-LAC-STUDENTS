/** Mục đích/API: GET /api/categories tree/list. */
import axiosClient from './axiosClient';
export const getCategories = () => axiosClient.get('/api/categories');
