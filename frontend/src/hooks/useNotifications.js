/**
 * Mục đích: Lấy thông báo; làm mới định kỳ (polling).
 * BE dùng STOMP/SockJS tại /chat — không phải Socket.IO; gọi io(localhost:8080) sẽ 403 và spam console.
 * Khi cần realtime: nối STOMP client tới /chat (SockJS), không dùng socket.io-client.
 * API dùng: GET /api/notifications, PATCH read endpoints.
 */
import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getNotifications, markNotificationRead, markAllRead as apiMarkAllRead } from '../api/notificationApi';
import { useAuth } from './useAuth';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    let stompClient;
    const fetchData = async () => {
      if (!token) {
        setNotifications([]);
        return;
      }

      try {
        const response = await getNotifications();
        const raw = response?.data?.data ?? response?.data;
        setNotifications(Array.isArray(raw) ? raw : []);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setNotifications([]);
      }
    };

    fetchData();

    if (token) {
      // Backend WebSocket: Spring STOMP + SockJS endpoint `/chat`
      // Token gửi qua query: `/chat?token=JWT`
      // NotificationService push unread count to: `/user/queue/notifications`
      stompClient = new Client({
        // SockJS is used because backend registers with `.withSockJS()`.
        webSocketFactory: () => new SockJS(`${API_BASE_URL}/chat?token=${encodeURIComponent(token)}`),
        reconnectDelay: 5000,
        debug: () => {},
        onConnect: () => {
          stompClient.subscribe('/user/queue/notifications', (message) => {
            // Payload is unread count (number). We refetch notifications to keep UI consistent.
            if (!token) return;
            fetchData();
          });
        },
        onStompError: (frame) => {
          // Fallback to polling will still work.
          console.error('STOMP error:', frame?.headers, frame?.body);
        },
      });

      stompClient.activate();
    }

    const pollingId = token ? setInterval(fetchData, 30000) : null;
    return () => {
      clearInterval(pollingId);
      if (stompClient && stompClient.active) {
        stompClient.deactivate();
      }
    };
  }, [token]);

  const markRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await apiMarkAllRead();
    setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, isRead: true })));
  };

  const refetch = async () => {
    if (!token) return;
    try {
      const response = await getNotifications();
      const raw = response?.data?.data ?? response?.data;
      setNotifications(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error('Failed to reload notifications:', error);
    }
  };

  const list = Array.isArray(notifications) ? notifications : [];
  return {
    notifications: list,
    unreadCount: list.filter((n) => !n.isRead).length,
    markRead,
    markAllRead,
    refetch,
  };
}
