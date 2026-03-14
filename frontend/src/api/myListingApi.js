/**
 * Mục đích: API quản lý bài đăng của người dùng (My Listings).
 * API dùng: GET /api/listings/my?status=&page=&size=
 * status: ACTIVE | DRAFT | HIDDEN | SOLD | GIVEN_AWAY | BANNED | EXPIRED | REPORTED
 *         Không truyền → lấy tất cả.
 */
import axiosClient from './axiosClient';

const sanitize = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );

export const getMyListings = (params = {}, config = {}) =>
    axiosClient.get('/api/listings/my', { params: sanitize(params), ...config });
