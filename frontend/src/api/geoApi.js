/**
 * Mục đích: Proxy gọi BE geo -> Vietmap (search + place + reverse).
 * API dùng: GET /api/geo/search, /api/geo/place, /api/geo/reverse.
 */
import axiosClient from './axiosClient';

export const searchPlaces = (params) =>
  axiosClient.get('/api/geo/search', { params });

/** refid = ref_id từ kết quả search v3 (có lat/lng + display) */
export const getPlaceByRefId = (refid) =>
  axiosClient.get('/api/geo/place', { params: { refid } });

export const reverseGeocode = (params) =>
  axiosClient.get('/api/geo/reverse', { params });

/** Tile key từ BE (profile dev) khi chưa set VITE_VIETMAP_TILE_KEY */
export const getGeoClientConfig = () => axiosClient.get('/api/geo/client-config');

