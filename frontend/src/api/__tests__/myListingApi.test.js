/**
 * Mục đích: Test module myListingApi — kiểm tra API function tồn tại,
 * gọi đúng endpoint và lọc params rỗng.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axiosClient trước khi import myListingApi
vi.mock('../axiosClient', () => ({
    default: {
        get: vi.fn(),
    },
}));

// Import sau khi mock để module nhận mock
import axiosClient from '../axiosClient';
import { getMyListings } from '../myListingApi';

describe('myListingApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        axiosClient.get.mockResolvedValue({ data: { code: 'SUCCESS', data: { content: [] } } });
    });

    // ─── Module exports ─────────────────────────────────────────────

    it('nên export hàm getMyListings', () => {
        expect(typeof getMyListings).toBe('function');
    });

    // ─── Endpoint ────────────────────────────────────────────────────

    it('nên gọi đúng endpoint /api/listings/my', async () => {
        await getMyListings({});
        expect(axiosClient.get).toHaveBeenCalledWith(
            '/api/listings/my',
            expect.objectContaining({ params: expect.any(Object) })
        );
    });

    // ─── Tham số hợp lệ được truyền đúng ────────────────────────────

    it('nên truyền status và page/size vào params', async () => {
        await getMyListings({ status: 'ACTIVE', page: 0, size: 10 });
        expect(axiosClient.get).toHaveBeenCalledWith(
            '/api/listings/my',
            expect.objectContaining({
                params: { status: 'ACTIVE', page: 0, size: 10 },
            })
        );
    });

    // ─── Lọc tham số rỗng / null / undefined ────────────────────────

    it('nên lọc bỏ params có giá trị null', async () => {
        await getMyListings({ status: null, page: 0, size: 10 });
        const calledParams = axiosClient.get.mock.calls[0][1].params;
        expect(calledParams).not.toHaveProperty('status');
        expect(calledParams).toHaveProperty('page', 0);
    });

    it('nên lọc bỏ params có giá trị undefined', async () => {
        await getMyListings({ status: undefined, page: 1, size: 5 });
        const calledParams = axiosClient.get.mock.calls[0][1].params;
        expect(calledParams).not.toHaveProperty('status');
        expect(calledParams.page).toBe(1);
        expect(calledParams.size).toBe(5);
    });

    it('nên lọc bỏ params có giá trị chuỗi rỗng', async () => {
        await getMyListings({ status: '', page: 0, size: 10 });
        const calledParams = axiosClient.get.mock.calls[0][1].params;
        expect(calledParams).not.toHaveProperty('status');
    });

    it('nên gọi API mà không có params khi truyền object rỗng', async () => {
        await getMyListings({});
        const calledParams = axiosClient.get.mock.calls[0][1].params;
        expect(Object.keys(calledParams)).toHaveLength(0);
    });

    // ─── Config bổ sung (signal, headers...) ────────────────────────

    it('nên truyền config bổ sung (ví dụ: AbortSignal) vào axios', async () => {
        const controller = new AbortController();
        await getMyListings({ status: 'DRAFT' }, { signal: controller.signal });
        expect(axiosClient.get).toHaveBeenCalledWith(
            '/api/listings/my',
            expect.objectContaining({ signal: controller.signal })
        );
    });

    // ─── Trả về response từ axios ───────────────────────────────────

    it('nên trả về response của axiosClient.get', async () => {
        const mockResponse = { data: { code: 'SUCCESS', data: { content: [{ id: 1 }] } } };
        axiosClient.get.mockResolvedValueOnce(mockResponse);

        const result = await getMyListings({ status: 'ACTIVE' });

        expect(result).toEqual(mockResponse);
    });

    // ─── Status variants ─────────────────────────────────────────────

    it.each([
        ['ACTIVE'],
        ['DRAFT'],
        ['EXPIRED'],
        ['REPORTED'],
        ['HIDDEN'],
        ['SOLD'],
    ])('nên chấp nhận status = %s', async (status) => {
        await getMyListings({ status });
        const calledParams = axiosClient.get.mock.calls[0][1].params;
        expect(calledParams.status).toBe(status);
    });
});
