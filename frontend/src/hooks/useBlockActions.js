import { useCallback } from 'react';
import * as userApi from '../api/userApi';
import { useToast } from '../context/ToastContext';

/**
 * Chặn / bỏ chặn — thông báo thống nhất; caller lo điều hướng hoặc invalidate UI.
 */
export function useBlockActions() {
  const { showToast } = useToast();

  const blockUserById = useCallback(
    async (userId) => {
      if (userId == null) return false;
      try {
        await userApi.blockUser(userId);
        showToast(
          'Đã chặn. Hai bên không còn thấy hồ sơ, tin đăng và tin nhắn của nhau.',
          'success',
        );
        return true;
      } catch (e) {
        showToast(e?.message || 'Không thể chặn người dùng này.', 'error');
        throw e;
      }
    },
    [showToast],
  );

  const unblockUserById = useCallback(
    async (userId) => {
      if (userId == null) return false;
      try {
        await userApi.unblockUser(userId);
        showToast('Đã bỏ chặn.', 'success');
        return true;
      } catch (e) {
        showToast(e?.message || 'Không thể bỏ chặn.', 'error');
        throw e;
      }
    },
    [showToast],
  );

  return { blockUserById, unblockUserById };
}
