/** Mục đích: helper format ngày giờ cho listing/deal/notification. */
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Mặc định trả về thời gian tương đối: thời gian hiện tại - thời gian đăng bài.
 * Nếu truyền fmt thì trả về chuỗi theo format cụ thể.
 */
export const formatDate = (value, fmt) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    if (fmt) return format(date, fmt);

    return formatDistanceToNow(date, {
        addSuffix: true,
        locale: vi,
    });
};