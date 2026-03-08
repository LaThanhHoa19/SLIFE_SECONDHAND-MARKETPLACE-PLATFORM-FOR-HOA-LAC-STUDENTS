/**
 * API chat: sessions, history, gửi tin.
 */
import axiosClient from './axiosClient';

export const getChats = (filter = 'ALL') =>
  axiosClient.get('/api/v1/chats', { params: { filter } });

export const getSession = (listingId) =>
  axiosClient.post('/api/v1/chats/session', null, { params: { listingId } });

export const getHistory = (sessionId, page = 0, size = 15) =>
  axiosClient.get(`/api/v1/chats/${sessionId}/history`, { params: { page, size } });

export const sendMessage = (sessionId, content) =>
  axiosClient.post('/api/v1/chats/send', { sessionId, content });

export const getQuickReplies = () =>
  axiosClient.get('/api/v1/chats/quick-replies');
