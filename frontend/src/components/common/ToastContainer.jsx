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
        iconBg: 'rgba(46,213,115,0.18)',
        iconColor: '#A7F3C0',
        accent: '#2ED573',
        title: 'Thành công',
        progressColor: '#2ED573',
        shadow: '0 14px 36px rgba(46,213,115,0.18)',
    },
    error: {
        Icon: ErrorIcon,
        iconBg: 'rgba(255,71,87,0.18)',
        iconColor: '#FCA5A5',
        accent: '#FF4757',
        title: 'Lỗi',
        progressColor: '#FF4757',
        shadow: '0 14px 36px rgba(255,71,87,0.18)',
    },
    warning: {
        Icon: WarningIcon,
        iconBg: 'rgba(255,165,2,0.2)',
        iconColor: '#FCD34D',
        accent: '#FFA502',
        title: 'Cảnh báo',
        progressColor: '#FFA502',
        shadow: '0 14px 36px rgba(255,165,2,0.18)',
    },
    info: {
        Icon: InfoIcon,
        iconBg: 'rgba(157,110,237,0.2)',
        iconColor: '#DDD6FE',
        accent: '#9D6EED',
        title: 'Thông báo',
        progressColor: '#9D6EED',
        shadow: '0 14px 36px rgba(157,110,237,0.18)',
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

function ToastItem({ toast, onDismiss }) {
    const v = VARIANTS[toast.variant] ?? VARIANTS.info;
    const { Icon } = v;
    const duration = toast.duration ?? 4000;

    return (
        <Box
            role="alert"
            sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                width: 350,
                px: 1.75,
                pt: 1.15,
                pb: 1.9,
                borderRadius: '14px',
                background: 'linear-gradient(180deg, rgba(24,22,32,0.98) 0%, rgba(20,18,28,0.98) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: v.shadow,
                backdropFilter: 'blur(10px)',
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
            <Box
                sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    bgcolor: v.accent,
                }}
            />
            {/* Icon circle */}
            <Box sx={{
                width: 38, height: 38, borderRadius: '11px',
                bgcolor: v.iconBg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `inset 0 0 0 1px ${v.accent}55`,
            }}>
                <Icon sx={{ fontSize: 20, color: v.iconColor }} />
            </Box>

            {/* Text */}
            <Box flex={1} sx={{ overflow: 'hidden', mr: 0.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#fff', lineHeight: 1.2, mb: 0.2 }}>
                    {v.title}
                </Typography>
                <Typography sx={{ fontSize: '12.8px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.42, wordBreak: 'break-word' }}>
                    {toast.message}
                </Typography>
            </Box>

            {/* Close */}
            <IconButton
                size="small"
                onClick={() => onDismiss(toast.id)}
                sx={{
                    alignSelf: 'flex-start',
                    mt: -0.3,
                    mr: -0.5,
                    color: 'rgba(255,255,255,0.42)',
                    width: 26, height: 26,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.88)' },
                }}
            >
                <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>

            {/* Progress bar */}
            {duration > 0 && <ProgressBar color={v.progressColor} duration={duration} />}
        </Box>
    );
}

export default function ToastContainer({ toasts, onDismiss }) {
    if (!toasts.length) return null;

    return (
        <Box sx={{
            position: 'fixed',
            bottom: 22,
            right: 22,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: 'flex-end',
            pointerEvents: 'none',
            '& > *': { pointerEvents: 'auto' },
        }}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </Box>
    );
}

ToastContainer.propTypes = {
    toasts: PropTypes.array.isRequired,
    onDismiss: PropTypes.func.isRequired,
};
