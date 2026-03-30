import axiosClient from './axiosClient';

/** GET /api/public/landing — bundle cho trang landing (public). */
export function getLanding() {
    return axiosClient.get('/api/public/landing');
}
