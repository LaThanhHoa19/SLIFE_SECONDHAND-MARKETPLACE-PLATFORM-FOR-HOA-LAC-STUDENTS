/**
 * ToastContext — hệ thống thông báo toast toàn cục.
 *
 * Variants: 'success' | 'error' | 'warning' | 'info'
 *
 * Dùng qua hook useToast():
 *   const { showToast } = useToast();
 *   showToast('Lưu thành công!', 'success');
 *   showToast('Có lỗi xảy ra', 'error', { duration: 5000 });
 */
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import ToastContainer from '../components/common/ToastContainer';

const ToastContext = createContext(null);

let idCounter = 0;
const TOAST_DEDUPE_WINDOW_MS = 1200;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});
    const recentRef = useRef({ key: '', at: 0, id: null });

    const dismiss = useCallback((id) => {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, []);

    const showToast = useCallback((message, variant = 'info', options = {}) => {
        const id = ++idCounter;
        const duration = options.duration ?? 4000;
        const onClick = typeof options.onClick === 'function' ? options.onClick : null;
        const text = String(message || '').trim();
        const key = `${variant}:${text}`;
        const now = Date.now();
        const latest = recentRef.current;

        const existing = toasts.find(
            (t) => !t.exiting && `${t.variant}:${String(t.message || '').trim()}` === key,
        );
        if (existing) {
            if (duration > 0) {
                clearTimeout(timersRef.current[existing.id]);
                timersRef.current[existing.id] = setTimeout(() => dismiss(existing.id), duration);
            }
            recentRef.current = { key, at: now, id: existing.id };
            return existing.id;
        }

        // Prevent duplicate toast spam for rapid repeated actions.
        if (
            latest.key === key &&
            now - latest.at < TOAST_DEDUPE_WINDOW_MS &&
            latest.id != null
        ) {
            if (duration > 0) {
                clearTimeout(timersRef.current[latest.id]);
                timersRef.current[latest.id] = setTimeout(() => dismiss(latest.id), duration);
            }
            recentRef.current = { ...latest, at: now };
            return latest.id;
        }

        setToasts(prev => [...prev.slice(-4), { id, message: text, variant, exiting: false, duration, onClick }]);

        if (duration > 0) {
            timersRef.current[id] = setTimeout(() => dismiss(id), duration);
        }
        recentRef.current = { key, at: now, id };
        return id;
    }, [dismiss, toasts]);

    return (
        <ToastContext.Provider value={{ showToast, dismiss }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
}

export default ToastProvider;
