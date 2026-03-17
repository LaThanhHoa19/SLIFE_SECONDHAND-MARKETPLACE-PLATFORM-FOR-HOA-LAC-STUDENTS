/**
 * Mục đích: Proxy gọi BE geo -> Vietmap (search + reverse).
 * API dùng: GET /api/geo/search, GET /api/geo/reverse.
 */
import axiosClient from './axiosClient';

export const searchPlaces = (params) =>
  axiosClient.get('/api/geo/search', { params });

export const reverseGeocode = (params) =>
  axiosClient.get('/api/geo/reverse', { params });

