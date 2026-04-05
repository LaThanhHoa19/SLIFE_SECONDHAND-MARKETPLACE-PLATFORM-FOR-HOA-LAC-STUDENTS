/** Mục đích/API: GET /api/deals/{id}, PUT /api/deals/{id}/confirm|pickup-time, DELETE /api/deals/{id}, POST /api/deals/{id}/reminder. */
import axiosClient from './axiosClient';
export const getDeal = (id) => axiosClient.get(`/api/deals/${id}`);
export const confirmDeal = (id) => axiosClient.put(`/api/deals/${id}/confirm`);
export const cancelDeal = (id) => axiosClient.delete(`/api/deals/${id}`);
export const updatePickupTime = (id, pickupTime) => axiosClient.put(`/api/deals/${id}/pickup-time`, { pickupTime });
export const sendReminder = (id) => axiosClient.post(`/api/deals/${id}/reminder`);

/** Tạo deal trực tiếp từ listing (khớp backend: POST /api/listings/{listingId}/deals). */
export const createDealForListing = (listingId, price) =>
  axiosClient.post(`/api/listings/${listingId}/deals`, { price });

/** Người bán chốt đơn trong chat → deal PENDING. Body: { listingId, buyerId, price, pickupTime? } — path phẳng để tránh lỗi 404 static trên một số proxy. */
export const sealListingDeal = (listingId, payload) =>
  axiosClient.post('/api/deals/seller-seal', {
    listingId,
    ...payload,
  });

/** Người mua chấp nhận sau khi người bán chốt đơn → COMPLETED */
export const buyerAcceptPendingDeal = (listingId) =>
  axiosClient.put(`/api/listings/${listingId}/deals/pending/accept`);

/** Người mua từ chối → REJECTED */
export const buyerRejectPendingDeal = (listingId) =>
  axiosClient.put(`/api/listings/${listingId}/deals/pending/reject`);

/** List deals related to current user. type=proposed|received|all */
export const listMyDeals = (type = 'all') =>
  axiosClient.get(`/api/deals`, { params: { type } });

/** Hoàn thành/Hủy giao dịch từ phía người mua (sau khi nhận hàng). 
 * payload: { completed: boolean, rating?: number, comment?: string, tags?: string[] } 
 */
export const finalizeDeal = (id, payload) =>
  axiosClient.post(`/api/deals/${id}/finalize`, payload);
