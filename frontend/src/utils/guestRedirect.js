/**
 * Đường dẫn mà user chưa đăng nhập (Guest) có thể mở mà không bị RouteGuard đẩy về /login.
 * Cần khớp với các route public trong AppRouter (MainLayout).
 */
export function isGuestAccessiblePath(pathWithSearch) {
    if (!pathWithSearch || typeof pathWithSearch !== 'string') return false;
    const path = pathWithSearch.split('?')[0] || '';

    if (path === '/' || path === '/landing' || path === '/feed' || path === '/search' || path === '/community' || path === '/terms') {
        return true;
    }
    if (path.startsWith('/community/posts/')) return true;

    if (path.startsWith('/listings/')) {
        const parts = path.split('/').filter(Boolean);
        if (parts[0] !== 'listings') return false;
        if (parts.length === 2 && parts[1] && parts[1] !== 'new') return true;
        return false;
    }

    if (path.startsWith('/profile/')) {
        const parts = path.split('/').filter(Boolean);
        return parts.length >= 2 && parts[0] === 'profile';
    }

    if (path === '/backendtest' || path === '/backend-test') return true;

    return false;
}
