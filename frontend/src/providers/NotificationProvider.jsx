/** Mục đích: Provider gom logic thông báo để Header dùng thống nhất. */
import { createContext } from 'react';
import useNotifications from '../hooks/useNotifications';
export const NotificationContext = createContext({ notifications: [], unreadCount: 0, markRead: async () => {} });
export function NotificationProvider({ children }) { const value = useNotifications(); return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>; }
