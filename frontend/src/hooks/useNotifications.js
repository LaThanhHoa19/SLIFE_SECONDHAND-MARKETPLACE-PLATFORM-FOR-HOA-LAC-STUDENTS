/**
 * SCRUM-172: Thông báo real-time qua STOMP WebSocket + REST API.
 * BE push count qua /user/queue/notifications → refetch ngay.
 * Fallback: polling 60s khi WS disconnect.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getNotifications, markAllRead as apiMarkAllRead, markNotificationRead } from '../api/notificationApi';
import { API_BASE_URL } from '../utils/constants';
import { useAuth } from './useAuth';

const WS_BASE = API_BASE_URL.replace(/\/$/, '');

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const { token } = useAuth();
  const clientRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      const { data: res } = await getNotifications();
      const list = Array.isArray(res?.data) ? res.data : [];
      setNotifications(list);
    } catch {
      setNotifications([]);
    }
  }, [token]);

  useEffect(() => {
    fetchData();

    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE}/chat?token=${token}`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        client.subscribe('/user/queue/notifications', () => {
          fetchData();
        });
      },
    });

    client.activate();
    clientRef.current = client;

    const pollingId = setInterval(fetchData, 60000);

    return () => {
      clearInterval(pollingId);
      client.deactivate();
      clientRef.current = null;
    };
  }, [token, fetchData]);

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await apiMarkAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return { notifications, unreadCount, markRead, markAllRead, refetch: fetchData };
}