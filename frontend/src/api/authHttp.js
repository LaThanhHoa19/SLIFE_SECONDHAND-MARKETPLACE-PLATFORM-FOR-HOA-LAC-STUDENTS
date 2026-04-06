/**
 * HTTP client cho /api/auth/login và /api/auth/google — không gắn Bearer
 * để tránh gửi nhầm token user/admin khi đổi phiên.
 */
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

function normalizeApiBaseUrl(baseUrl) {
    return (baseUrl || '').replace(/\/api\/?$/, '');
}

const authHttp = axios.create({
    baseURL: normalizeApiBaseUrl(API_BASE_URL),
    timeout: 15000,
    withCredentials: true,
});

export default authHttp;
