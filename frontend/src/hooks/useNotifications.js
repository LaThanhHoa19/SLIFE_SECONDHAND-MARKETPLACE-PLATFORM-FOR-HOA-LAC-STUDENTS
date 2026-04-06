/**
 * Mục đích: Lấy thông báo; làm mới định kỳ (polling).
 * BE dùng STOMP/SockJS tại /chat — không phải Socket.IO; gọi io(localhost:8080) sẽ 403 và spam console.
 * Khi cần realtime: nối STOMP client tới /chat (SockJS), không dùng socket.io-client.
 * API dùng: GET /api/notifications, PATCH read endpoints.
 */
import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import {
  getNotificationsPage,
  searchNotificationsPage,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllRead as apiMarkAllRead,
} from '../api/notificationApi';
import { useAuth } from './useAuth';
import { API_BASE_URL } from '../utils/constants';

/** Giống ChatPage: WS ở /chat, không nằm dưới /api */
function getChatSockJsUrl(token) {
  const base =
    import.meta.env.VITE_WS_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/chat`
      : 'http://localhost:8080/chat');
  if (!token) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}token=${encodeURIComponent(token)}`;
}

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();

  useEffect(() => {
    let stompClient;
    const fetchFirstPage = async () => {
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        const response = await getNotificationsPage({ limit: 30 });
        const page = response?.data?.data ?? response?.data;
        const items = page?.items ?? [];
        setNotifications(Array.isArray(items) ? items : []);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setNotifications([]);
      }
    };

    const fetchUnreadCount = async () => {
      if (!token) return;
      try {
        const resp = await getUnreadNotificationCount();
        const n = resp?.data?.data ?? resp?.data;
        if (typeof n === 'number') setUnreadCount(n);
      } catch {
        // ignore
      }
    };

    fetchFirstPage();
    fetchUnreadCount();

    if (token) {
      // Backend WebSocket: Spring STOMP + SockJS endpoint `/chat`
      // JwtHandshakeHandler chỉ đọc JWT từ query ?token= (không phải header SockJS GET)
      // NotificationService push unread count to: `/user/queue/notifications`
      stompClient = new Client({
        // SockJS is used because backend registers with `.withSockJS()`.
        webSocketFactory: () => new SockJS(getChatSockJsUrl(token)),
        reconnectDelay: 5000,
        debug: () => {},
        onConnect: () => {
          stompClient.subscribe('/user/queue/notifications', (message) => {
            // Payload is unread count (number). We refetch notifications to keep UI consistent.
            if (!token) return;
            const maybe = Number(message?.body);
            if (!Number.isNaN(maybe)) setUnreadCount(maybe);
            fetchFirstPage();
          });
        },
        onStompError: (frame) => {
          // Fallback to polling will still work.
          console.error('STOMP error:', frame?.headers, frame?.body);
        },
      });

      stompClient.activate();
    }

    const pollingId = token
      ? setInterval(() => {
          fetchFirstPage();
          fetchUnreadCount();
        }, 30000)
      : null;
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
    setUnreadCount((c) => Math.max(0, (typeof c === 'number' ? c : 0) - 1));
  };

  const markAllRead = async () => {
    await apiMarkAllRead();
    setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const refetch = async () => {
    if (!token) return;
    try {
      const response = await getNotificationsPage({ limit: 30 });
      const page = response?.data?.data ?? response?.data;
      const items = page?.items ?? [];
      setNotifications(Array.isArray(items) ? items : []);
      // Prefer true count from BE
      const resp2 = await getUnreadNotificationCount();
      const n = resp2?.data?.data ?? resp2?.data;
      if (typeof n === 'number') setUnreadCount(n);
    } catch (error) {
      console.error('Failed to reload notifications:', error);
    }
  };

  const list = Array.isArray(notifications) ? notifications : [];
  return {
    notifications: list,
    unreadCount,
    markRead,
    markAllRead,
    refetch,
  };
}
