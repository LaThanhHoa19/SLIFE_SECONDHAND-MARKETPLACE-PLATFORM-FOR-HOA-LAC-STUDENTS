/**
 * Mục đích: Lấy thông báo; làm mới định kỳ (polling).
 * BE dùng STOMP/SockJS tại /chat — không phải Socket.IO; gọi io(localhost:8080) sẽ 403 và spam console.
 * Khi cần realtime: nối STOMP client tới /chat (SockJS), không dùng socket.io-client.
 * API dùng: GET /api/notifications, PATCH read endpoints.
 */
import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead, markAllRead as apiMarkAllRead } from '../api/notificationApi';
import { useAuth } from './useAuth';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
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

    const pollingId = token ? setInterval(fetchData, 30000) : null;
    return () => {
      clearInterval(pollingId);
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
