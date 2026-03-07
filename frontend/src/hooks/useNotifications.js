/**
 * Mục đích: Lấy thông báo và hỗ trợ realtime qua socket.io, fallback polling.
 * API dùng: GET /api/notifications, PATCH read endpoints.
 */
import {useEffect, useState} from 'react';
import {io} from 'socket.io-client';
import {getNotifications, markNotificationRead} from '../api/notificationApi';
import {API_BASE_URL} from '../utils/constants';
import {useAuth} from './useAuth';

export default function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const {token} = useAuth();

    useEffect(() => {
        if (!token) {
            setNotifications([]);
            return () => {};
        }


        let socket;

        const fetchData = async () => {
            try {
                setNotifications((await getNotifications()).data || []);
            } catch {
                setNotifications([]);
            }
        };

        fetchData();

        // TODO: nếu BE chưa có socket gateway thì bỏ đoạn này và dùng polling.
        socket = io(API_BASE_URL, { auth: { token } });
        socket.on('notification:new', (payload) => setNotifications((prev) => [payload, ...prev]));

        const pollingId = setInterval(fetchData, 30000);
        return () => {
            clearInterval(pollingId);
            socket?.disconnect();
        };
    }, [token]);

    const markRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        } catch {
            // no-op
        }
    };


    return {notifications, unreadCount: notifications.filter((n) => !n.isRead).length, markRead};
}
