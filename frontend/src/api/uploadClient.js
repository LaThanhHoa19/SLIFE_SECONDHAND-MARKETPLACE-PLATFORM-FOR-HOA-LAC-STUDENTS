/**
 * Axios instance cho multipart uploads — bypass CloudFront, gọi thẳng ALB.
 * CloudFront không forward multipart body đúng cách, nên upload phải đi đường khác.
 */
import axios from 'axios';
import { UPLOAD_BASE_URL } from '../utils/constants';
import { getAccessToken } from './axiosClient';

const uploadClient = axios.create({
    baseURL: UPLOAD_BASE_URL.replace(/\/api\/?$/, ''),
    timeout: 120000,
    withCredentials: true,
});

uploadClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default uploadClient;
