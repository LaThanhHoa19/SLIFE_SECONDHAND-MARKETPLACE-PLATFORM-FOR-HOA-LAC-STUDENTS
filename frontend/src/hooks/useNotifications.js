/**
 * Mục đích: Lấy thông báo, fallback polling (BE dùng STOMP/WebSocket, không dùng socket.io nên tắt kết nối socket.io để tránh 403).
 * API dùng: GET /api/notifications, PATCH read endpoints.
 */
import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from '../api/notificationApi';
import { useAuth } from './useAuth';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }
    const fetchData = async () => {
      try {
        const res = await getNotifications();
        setNotifications(res?.data?.data ?? res?.data ?? []);
      } catch {
        setNotifications([]);
      }
    };
    fetchData();
    const pollingId = setInterval(fetchData, 30000);
    return () => clearInterval(pollingId);
  }, [token]);

  const markRead = async (id) => { await markNotificationRead(id); setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))); };
  return { notifications, unreadCount: notifications.filter((n) => !n.isRead).length, markRead };
}
