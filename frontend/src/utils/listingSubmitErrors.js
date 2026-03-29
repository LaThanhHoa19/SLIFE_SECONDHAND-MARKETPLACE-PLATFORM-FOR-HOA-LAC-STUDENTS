/**
 * Gom message / phân loại lỗi khi submit tin đăng (ảnh vs các lỗi khác).
 */

export function getListingSubmitErrorMessage(err, fallback = 'Có lỗi xảy ra.') {
    const d = err?.response?.data;
    const m = d?.message;
    if (typeof m === 'string' && m.trim()) return m.trim();
    if (typeof err?.message === 'string' && err.message.trim()) return err.message.trim();
    return fallback;
}

/** Lỗi liên quan ảnh / upload → hiển thị và cuộn tới khối ảnh trong ListingForm */
export function isListingImageRelatedApiError(err) {
    const code = String(err?.response?.data?.code || '').toUpperCase();
    if (
        ['FILE_TOO_LARGE', 'FILE_UPLOAD_FAILED', 'INVALID_FILE_TYPE', 'UNSUPPORTED_MEDIA_TYPE'].includes(code)
    ) {
        return true;
    }
    const msg = String(err?.response?.data?.message || err?.message || '').toLowerCase();
    return /ảnh|hình|image|maximum|exceeded|giới hạn|vượt quá|upload|multipart|file|đính kèm/.test(msg);
}
