/**
 * Đọc mã lỗi nghiệp vụ từ ApiResponse lỗi (axios interceptor vẫn giữ response).
 * @param {import('axios').AxiosError | { response?: { data?: { code?: string } }; status?: number } | null | undefined} err
 * @returns {string | undefined}
 */
export function getBusinessErrorCode(err) {
  return err?.response?.data?.code ?? err?.raw?.response?.data?.code;
}

export function isUserNotFoundError(err) {
  return getBusinessErrorCode(err) === 'USER_NOT_FOUND' || err?.status === 404;
}

export function isListingNotFoundError(err) {
  return getBusinessErrorCode(err) === 'LISTING_NOT_FOUND' || err?.status === 404;
}

export function isFollowBlockedError(err) {
  return getBusinessErrorCode(err) === 'FOLLOW_BLOCKED';
}
