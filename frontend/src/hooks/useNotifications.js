/**
 * Mục đích: Lấy thông báo qua REST API với fallback polling.
 * Lưu ý: Đã loại bỏ Socket.io vì BE dùng STOMP/WebSocket.
 */
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getNotifications, markNotificationRead } from '../api/notificationApi';
import { API_BASE_URL } from '../utils/constants';
import { useAuth } from './useAuth';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    let socket;
    if (!token) {
      setNotifications([]);
      return undefined;
        }

    const fetchData = async () => {
      try {
        const response = await getNotifications();
        setNotifications(response.data || []);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };

    fetchData();

    // TODO: nếu BE chưa có socket gateway thì bỏ đoạn này và dùng polling.
    // socket = io(API_BASE_URL, { auth: { token } });
    // socket.on('notification:new', (payload) => setNotifications((prev) => [payload, ...prev]));

    const pollingId = setInterval(() => {
      fetchData();
    }, 30000);

    return () => {
      clearInterval(pollingId);
      socket?.disconnect();
    };  }, [token]);

  const markRead = async (id) => { await markNotificationRead(id); setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))); };
  return { notifications, unreadCount: notifications.filter((n) => !n.isRead).length, markRead };
}