/**
 * Mục đích: Quản lý user/token toàn cục.
 * API dùng: authApi.login/logout/refresh; userApi.getUser.
 * Request/Response mẫu login: xem authApi.
 * Props: children.
 * Validation: đồng bộ localStorage, tránh token giả mạo (TODO: verify exp).
 * Accessibility: trạng thái auth loading để hiển thị skeleton thay vì chớp màn hình.
 * Tests cần viết: persist token, logout clear state, refresh flow.
 */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi';
import * as userApi from '../api/userApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('slife_access_token'));
  const [user, setUser] = useState(null);
  const [isAuthLoading, setAuthLoading] = useState(true);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem('slife_access_token', data.accessToken);
    setToken(data.accessToken); setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem('slife_access_token');
    setToken(null); setUser(null);
  }, []);

  useEffect(() => {
    (async () => {
      if (!token) return setAuthLoading(false);
      try { const { data } = await userApi.getUser(); setUser(data); }
      catch { localStorage.removeItem('slife_access_token'); setToken(null); }
      finally { setAuthLoading(false); }
    })();
  }, [token]);

  const value = useMemo(() => ({ token, user, login, logout, isAuthLoading }), [token, user, login, logout, isAuthLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
