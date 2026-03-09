/**
 * API chat: sessions, history, gửi tin, upload ảnh, offer, deal.
 */
import axiosClient from './axiosClient';

export const getChats = (filter = 'ALL') =>
  axiosClient.get('/api/v1/chats', { params: { filter } });

export const getSession = (listingId) =>
  axiosClient.post('/api/v1/chats/session', null, { params: { listingId } });

export const getHistory = (sessionId, page = 0, size = 15) =>
  axiosClient.get(`/api/v1/chats/${sessionId}/history`, { params: { page, size } });

export const sendMessage = (sessionId, content, messageType = 'TEXT', fileUrl = null) =>
  axiosClient.post('/api/v1/chats/send', { sessionId, content, messageType, fileUrl });

export const getQuickReplies = () =>
  axiosClient.get('/api/v1/chats/quick-replies');

/** Upload a chat image (max 5 MB, JPG/PNG/WebP). Returns public URL. */
export const uploadChatImage = (sessionId, file) => {
  const form = new FormData();
  form.append('sessionId', sessionId);
  form.append('file', file);
  return axiosClient.post('/api/v1/chats/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/** Make a price offer (UC-30). amount is a number in VND. */
export const makeOffer = (sessionId, amount) =>
  axiosClient.post(`/api/v1/chats/${sessionId}/offer`, { amount });

/** Seller responds to an offer: action = 'ACCEPTED' | 'REJECTED'. */
export const respondToOffer = (offerId, action) =>
  axiosClient.post(`/api/v1/chats/offers/${offerId}/respond`, { action });

/** Mark all messages in session as read (UC-26). */
export const markSessionRead = (sessionId) =>
  axiosClient.post(`/api/v1/chats/${sessionId}/read`);
