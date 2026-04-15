/** SCRUM-172: Provider gom logic thông báo để Header/NotificationsPage dùng thống nhất. */
import { createContext } from 'react';
import { useLocation } from 'react-router-dom';
import useNotifications from '../hooks/useNotifications';

export const NotificationContext = createContext({
    notifications: [],
    unreadCount: 0,
    markRead: async () => {},
    markAllRead: async () => {},
    refetch: () => {},
});

export function NotificationProvider({ children }) {
    const location = useLocation();
    const scope = location.pathname === '/community' || location.pathname.startsWith('/community/')
        ? 'community'
        : 'market';
    const value = useNotifications(scope);
    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
