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

/** Người bán chốt đơn trong chat → deal PENDING. Body: { buyerId, price, pickupTime? } */
export const sealListingDeal = (listingId, payload) =>
  axiosClient.post(`/api/listings/${listingId}/deals/seal`, payload);

/** Người mua chấp nhận sau khi người bán chốt đơn → COMPLETED */
export const buyerAcceptPendingDeal = (listingId) =>
  axiosClient.put(`/api/listings/${listingId}/deals/pending/accept`);

/** Người mua từ chối → REJECTED */
export const buyerRejectPendingDeal = (listingId) =>
  axiosClient.put(`/api/listings/${listingId}/deals/pending/reject`);
