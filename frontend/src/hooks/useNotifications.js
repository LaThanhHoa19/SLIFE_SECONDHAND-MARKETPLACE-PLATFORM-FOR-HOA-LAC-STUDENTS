/**
 * Mục đích: Lấy thông báo qua REST API với fallback polling.
 * Lưu ý: Đã loại bỏ Socket.io vì BE dùng STOMP/WebSocket.
 */
import { useEffect, useState, useCallback } from 'react';
import { getNotifications, markNotificationRead } from '../api/notificationApi';
import { useAuth } from './useAuth';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const { token } = useAuth();

  // Sử dụng useCallback để fetchData ổn định hơn trong useEffect
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getNotifications();
      // Xử lý linh hoạt format data từ cả 2 nhánh (res.data.data hoặc res.data)
      const data = res?.data?.data ?? res?.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Giữ lại data cũ thay vì xóa sạch nếu lỗi mạng đột ngột
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }

    // Lấy dữ liệu lần đầu
    fetchData();

    // Thiết lập Polling mỗi 30 giây (Fallback cho đến khi tích hợp STOMP)
    const pollingId = setInterval(fetchData, 30000);

    return () => {
      clearInterval(pollingId);
    };
  }, [token, fetchData]);

  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    markRead,
    refresh: fetchData // Cho phép component chủ động refresh
  };
}