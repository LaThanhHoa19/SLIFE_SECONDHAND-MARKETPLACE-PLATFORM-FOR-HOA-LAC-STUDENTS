/** API: GET /api/locations - danh sách vị trí pickup để filter listing. */
import axiosClient from './axiosClient';
export const getLocations = () => axiosClient.get('/api/locations');
