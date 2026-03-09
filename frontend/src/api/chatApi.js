/**
 * API chat: sessions, history, gửi tin, upload ảnh, offer, read receipts.
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

export const uploadChatImage = (sessionId, file) => {
  const form = new FormData();
  form.append('sessionId', sessionId);
  form.append('file', file);
  return axiosClient.post('/api/v1/chats/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const makeOffer = (sessionId, amount) =>
  axiosClient.post(`/api/v1/chats/${sessionId}/offer`, { amount });

export const respondToOffer = (offerId, action) =>
  axiosClient.post(`/api/v1/chats/offers/${offerId}/respond`, { action });

export const markSessionRead = (sessionId) =>
  axiosClient.post(`/api/v1/chats/${sessionId}/read`);
