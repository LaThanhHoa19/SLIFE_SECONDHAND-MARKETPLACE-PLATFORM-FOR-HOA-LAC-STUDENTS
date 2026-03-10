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

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const dismiss = useCallback((id) => {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
    }, []);

    const showToast = useCallback((message, variant = 'info', options = {}) => {
        const id = ++idCounter;
        const duration = options.duration ?? 4000;

        setToasts(prev => [...prev.slice(-4), { id, message, variant, exiting: false }]);

        if (duration > 0) {
            timersRef.current[id] = setTimeout(() => dismiss(id), duration);
        }
        return id;
    }, [dismiss]);

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
