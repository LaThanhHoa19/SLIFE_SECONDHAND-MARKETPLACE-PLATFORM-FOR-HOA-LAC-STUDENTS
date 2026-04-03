/**
 * API chat: sessions, history, gửi tin, upload ảnh, offer, deal.
 */
import axiosClient from './axiosClient';

/**
 * Danh sách phiên chat. Truyền string → filter; hoặc object { filter, q, listingId, page, size, … }.
 * Tham số q chỉ lọc theo tiêu đề tin / tên đối phương / mã listing (không quét toàn bộ tin nhắn).
 */
export const getChats = (filterOrParams = 'ALL') => {
  const params =
    typeof filterOrParams === 'object' && filterOrParams !== null && !Array.isArray(filterOrParams)
      ? { filter: 'ALL', ...filterOrParams }
      : { filter: filterOrParams };
  return axiosClient.get('/api/v1/chats', { params });
};

/** Tìm tin nhắn theo nội dung trong một phiên (q ≥ 2 ký tự). */
export const searchChatMessages = (sessionId, q, page = 0, size = 15) =>
  axiosClient.get(`/api/v1/chats/${sessionId}/messages/search`, { params: { q, page, size } });

export const getSession = (listingId) =>
  axiosClient.post('/api/v1/chats/session', null, { params: { listingId } });

export const getHistory = (sessionId, page = 0, size = 15) =>
  axiosClient.get(`/api/v1/chats/${sessionId}/history`, { params: { page, size } });

export const sendMessage = (
  sessionId,
  content,
  messageType = 'TEXT',
  fileUrl = null,
  options = {}
) =>
  axiosClient.post('/api/v1/chats/send', {
    sessionId: sessionId ?? null,
    listingId: options?.listingId ?? null,
    content,
    messageType,
    fileUrl,
    replyToMessageId: options?.replyToMessageId ?? null,
    quoteMessageId: options?.quoteMessageId ?? null,
  });

export const getQuickReplies = () =>
  axiosClient.get('/api/v1/chats/quick-replies');

/** Upload a chat image (max 5 MB, JPG/PNG/WebP). Returns public URL. */
export const uploadChatImage = (sessionId, file, listingId = null) => {
  const form = new FormData();
  if (sessionId) form.append('sessionId', sessionId);
  if (listingId != null) form.append('listingId', String(listingId));
  form.append('file', file);
  return axiosClient.post('/api/v1/chats/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** Make a price offer (UC-30). amount is a number in VND. */
export const makeOffer = (sessionId, amount) =>
  axiosClient.post(`/api/v1/chats/${sessionId}/offer`, { amount });

/** Buyer trả giá khi chưa có session UUID (BE tự mở hội thoại theo tin). */
export const makeOfferByListing = (listingId, amount) =>
  axiosClient.post('/api/v1/chats/offers', { listingId, amount });

/** Seller responds to an offer: action = 'ACCEPTED' | 'REJECTED'. */
export const respondToOffer = (offerId, action) =>
  axiosClient.post(`/api/v1/chats/offers/${offerId}/respond`, { action });

/** Mark all messages in session as read (UC-26). */
export const markSessionRead = (sessionId) =>
  axiosClient.post(`/api/v1/chats/${sessionId}/read`);
