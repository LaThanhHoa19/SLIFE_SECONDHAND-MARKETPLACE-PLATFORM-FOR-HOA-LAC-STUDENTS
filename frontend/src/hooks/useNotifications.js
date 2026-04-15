/**
 * Mục đích: Lấy thông báo; làm mới định kỳ (polling).
 * BE dùng STOMP/SockJS tại /chat — không phải Socket.IO; gọi io(localhost:8080) sẽ 403 và spam console.
 * Khi cần realtime: nối STOMP client tới /chat (SockJS), không dùng socket.io-client.
 * API dùng: GET /api/notifications, PATCH read endpoints.
 */
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useNavigate } from 'react-router-dom';
import {
  getNotificationsPage,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllRead as apiMarkAllRead,
} from '../api/notificationApi';
import { useAuth } from './useAuth';
import { useToast } from '../context/ToastContext';

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

export default function useNotifications(scope = 'all') {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const prevIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    let stompClient;
    const fetchFirstPage = async (opts = {}) => {
      const { withToast = false } = opts;
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        prevIdsRef.current = new Set();
        initializedRef.current = false;
        return;
      }

      try {
        const response = await getNotificationsPage({ limit: 30, scope });
        const page = response?.data?.data ?? response?.data;
        const items = Array.isArray(page?.items) ? page.items : [];

        const currentIds = new Set(items.map((n) => n?.id).filter(Boolean));
        if (!initializedRef.current) {
          prevIdsRef.current = currentIds;
          initializedRef.current = true;
        } else if (withToast) {
          const newUnreadItems = items.filter(
              (n) => n && !n.isRead && n.id && !prevIdsRef.current.has(n.id),
          );
          if (newUnreadItems.length > 0) {
            const primary = newUnreadItems[0];
            const latestContent = String(primary?.content || '').trim();
            const message = newUnreadItems.length === 1
                ? (latestContent || 'Bạn có 1 thông báo mới')
                : `Bạn có ${newUnreadItems.length} thông báo mới`;

            showToast(message, 'info', {
              duration: 4500,
              onClick: () => navigate('/notifications'),
            });
          }
          prevIdsRef.current = currentIds;
        } else {
          prevIdsRef.current = currentIds;
        }

        setNotifications(items);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setNotifications([]);
      }
    };

    const fetchUnreadCount = async () => {
      if (!token) return;
      try {
        const resp = await getUnreadNotificationCount({ scope });
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
          stompClient.subscribe('/user/queue/notifications', () => {
            // Re-fetch by current scope to keep strict separation.
            if (!token) return;
            fetchFirstPage({ withToast: true });
            fetchUnreadCount();
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
          fetchFirstPage({ withToast: false });
          fetchUnreadCount();
        }, 30000)
        : null;
    return () => {
      clearInterval(pollingId);
      if (stompClient && stompClient.active) {
        stompClient.deactivate();
      }
    };
  }, [token, scope]);

  const markRead = async (id) => {
    await markNotificationRead(id, { scope });
    setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, (typeof c === 'number' ? c : 0) - 1));
  };

  const markAllRead = async () => {
    await apiMarkAllRead({ scope });
    setNotifications((prev) => (Array.isArray(prev) ? prev : []).map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const refetch = async () => {
    if (!token) return;
    try {
      const response = await getNotificationsPage({ limit: 30, scope });
      const page = response?.data?.data ?? response?.data;
      const items = Array.isArray(page?.items) ? page.items : [];
      setNotifications(items);
      // Prefer true count from BE
      const resp2 = await getUnreadNotificationCount({ scope });
      const n = resp2?.data?.data ?? resp2?.data;
      if (typeof n === 'number') setUnreadCount(n);
      prevIdsRef.current = new Set(items.map((n) => n?.id).filter(Boolean));
      initializedRef.current = true;
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
