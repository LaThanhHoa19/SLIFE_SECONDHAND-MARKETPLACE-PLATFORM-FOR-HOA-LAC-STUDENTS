/**
 * ToastContainer — render stack các toast ở góc dưới bên phải.
 * Dùng bởi ToastContext, không dùng trực tiếp.
 */
import {
    CheckCircle as SuccessIcon,
    Cancel as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

const VARIANTS = {
    success: {
        Icon: SuccessIcon,
        gradient: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)',
        iconBg: '#059669',
        iconColor: '#fff',
        accent: '#059669',
        title: 'Thành công',
        progressColor: '#059669',
        shadow: '0 20px 60px rgba(5, 150, 105, 0.2)',
    },
    error: {
        Icon: ErrorIcon,
        gradient: 'linear-gradient(135deg, #ffe4e6 0%, #fff1f2 100%)',
        iconBg: '#e11d48',
        iconColor: '#fff',
        accent: '#e11d48',
        title: 'Lỗi',
        progressColor: '#e11d48',
        shadow: '0 20px 60px rgba(225, 29, 72, 0.2)',
    },
    warning: {
        Icon: WarningIcon,
        gradient: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
        iconBg: '#d97706',
        iconColor: '#fff',
        accent: '#d97706',
        title: 'Cảnh báo',
        progressColor: '#d97706',
        shadow: '0 20px 60px rgba(217, 119, 6, 0.2)',
    },
    info: {
        Icon: InfoIcon,
        gradient: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
        iconBg: '#7C3AED',
        iconColor: '#fff',
        accent: '#7C3AED',
        title: 'Thông báo',
        progressColor: '#7C3AED',
        shadow: '0 20px 60px rgba(124, 58, 237, 0.2)',
    },
};

function ProgressBar({ color, duration }) {
    const [width, setWidth] = useState(100);
    const rafRef = useRef(null);
    const startRef = useRef(null);

    useEffect(() => {
        startRef.current = performance.now();

        const tick = (now) => {
            const elapsed = now - startRef.current;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setWidth(remaining);
            if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [duration]);

    return (
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, bgcolor: 'rgba(0,0,0,0.06)', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${width}%`, bgcolor: color, borderRadius: 'inherit', transition: 'width 0.1s linear' }} />
        </Box>
    );
}

function ToastItem({ toast, onDismiss, duration }) {
    const v = VARIANTS[toast.variant] ?? VARIANTS.info;
    const { Icon } = v;

    return (
        <Box
            role="alert"
            sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                width: 360,
                px: 2,
                pt: 1.75,
                pb: 2.5,
                borderRadius: '16px',
                background: v.gradient,
                border: `1px solid ${v.accent}22`,
                boxShadow: v.shadow,
                transform: toast.exiting ? 'translateX(calc(100% + 32px)) scale(0.95)' : 'translateX(0) scale(1)',
                opacity: toast.exiting ? 0 : 1,
                transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease',
                animation: toast.exiting ? 'none' : 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                '@keyframes toastIn': {
                    from: { transform: 'translateX(calc(100% + 32px)) scale(0.8)', opacity: 0 },
                    to: { transform: 'translateX(0) scale(1)', opacity: 1 },
                },
                overflow: 'hidden',
            }}
        >
            {/* Icon circle */}
            <Box sx={{
                width: 40, height: 40, borderRadius: '12px',
                bgcolor: v.iconBg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 12px ${v.accent}44`,
            }}>
                <Icon sx={{ fontSize: 22, color: v.iconColor }} />
            </Box>

            {/* Text */}
            <Box flex={1} sx={{ overflow: 'hidden', mr: 0.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: v.accent, lineHeight: 1.2, mb: 0.4 }}>
                    {v.title}
                </Typography>
                <Typography sx={{ fontSize: '13px', color: '#374151', lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {toast.message}
                </Typography>
            </Box>

            {/* Close */}
            <IconButton
                size="small"
                onClick={() => onDismiss(toast.id)}
                sx={{
                    alignSelf: 'flex-start',
                    mt: -0.25,
                    mr: -0.5,
                    color: '#9ca3af',
                    width: 26, height: 26,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.08)', color: '#374151' },
                }}
            >
                <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>

            {/* Progress bar */}
            {duration > 0 && <ProgressBar color={v.progressColor} duration={duration} />}
        </Box>
    );
}

export default function ToastContainer({ toasts, onDismiss, duration = 4000 }) {
    if (!toasts.length) return null;

    return (
        <Box sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            alignItems: 'flex-end',
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' },
        }}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} duration={duration} />
            ))}
        </Box>
    );
}

ToastContainer.propTypes = {
    toasts: PropTypes.array.isRequired,
    onDismiss: PropTypes.func.isRequired,
    duration: PropTypes.number,
};
