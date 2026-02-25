/** Mục đích: validator chung cho form listing/auth. */
export const validateTitleLength = (title) => (title || '').length >= 10 && (title || '').length <= 120;
export const validatePrice = (price) => Number.isFinite(Number(price)) && Number(price) >= 0;
export const containsBannedKeyword = (text, banned = []) => banned.some((k) => (text || '').toLowerCase().includes(String(k).toLowerCase()));
