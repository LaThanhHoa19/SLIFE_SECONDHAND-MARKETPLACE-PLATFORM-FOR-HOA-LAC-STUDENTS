/**
 * ConfirmDialog — hộp thoại xác nhận tái sử dụng (SCRUM-51).
 *
 * Props:
 *   open          – hiện/ẩn dialog
 *   title         – tiêu đề
 *   content       – nội dung mô tả
 *   variant       – 'danger' | 'warning' | 'info' (default 'danger')
 *   confirmLabel  – label nút xác nhận
 *   cancelLabel   – label nút hủy (default 'Hủy')
 *   onConfirm     – callback khi xác nhận (có thể async)
 *   onClose       – callback khi đóng
 *   loading       – control loading từ bên ngoài
 */
import {
    DeleteOutline as DeleteIcon,
    InfoOutlined as InfoIcon,
    WarningAmberOutlined as WarningIcon,
} from '@mui/icons-material';
import {
    alpha,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    Fade,
    Stack,
    Typography,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

const VARIANTS = {
    danger: {
        Icon: DeleteIcon,
        iconBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(220, 38, 38, 0.1))',
        iconColor: '#ef4444',
        glow: alpha('#ef4444', 0.28),
        confirmBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        confirmHoverBg: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        defaultTitle: 'Xác nhận xoá',
        defaultConfirmLabel: 'Xoá',
    },
    warning: {
        Icon: WarningIcon,
        iconBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.05))',
        iconColor: '#f43f5e',
        glow: alpha('#f43f5e', 0.15),
        confirmBg: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
        confirmHoverBg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        defaultTitle: 'Xác nhận thao tác',
        defaultConfirmLabel: 'Tiếp tục',
    },
    info: {
        Icon: InfoIcon,
        iconBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.05))',
        iconColor: '#f43f5e',
        glow: alpha('#f43f5e', 0.15),
        confirmBg: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
        confirmHoverBg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        defaultTitle: 'Xác nhận',
        defaultConfirmLabel: 'Đồng ý',
    },
};

export default function ConfirmDialog({
                                          open,
                                          title,
                                          content,
                                          variant = 'danger',
                                          confirmLabel,
                                          cancelLabel = 'Hủy',
                                          onConfirm,
                                          onClose,
                                          loading: externalLoading,
                                      }) {
    const [internalLoading, setInternalLoading] = useState(false);
    const isLoading = externalLoading ?? internalLoading;

    const {
        Icon,
        iconBg,
        iconColor,
        glow,
        confirmBg,
        confirmHoverBg,
        defaultTitle,
        defaultConfirmLabel,
    } = VARIANTS[variant] ?? VARIANTS.danger;

    const handleConfirm = async () => {
        if (!onConfirm) return;
        const result = onConfirm();
        if (result instanceof Promise) {
            setInternalLoading(true);
            try {
                await result;
            } finally {
                setInternalLoading(false);
            }
        }
    };

    return (
        <Dialog
            open={open}
            onClose={isLoading ? undefined : onClose}
            maxWidth="xs"
            fullWidth
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 180 }}
            slotProps={{
                backdrop: {
                    sx: {
                        backdropFilter: 'blur(4px)',
                        backgroundColor: 'rgba(2, 6, 23, 0.5)',
                    },
                },
                paper: {
                    elevation: 0,
                    sx: {
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        boxShadow: '0 28px 64px rgba(15, 23, 42, 0.28)',
                    },
                },
            }}
        >
            <Box
                sx={{
                    px: 3,
                    pt: 3,
                    pb: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: 1.5,
                }}
            >
                <Box
                    sx={{
                        width: 66,
                        height: 66,
                        borderRadius: '50%',
                        background: iconBg,
                        border: '1px solid rgba(148, 163, 184, 0.25)',
                        boxShadow: `0 0 0 6px ${glow}`,
                        display: 'grid',
                        placeItems: 'center',
                    }}
                >
                    <Icon sx={{ fontSize: 31, color: iconColor }} />
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
                    {title || defaultTitle}
                </Typography>
            </Box>

            {content && (
                <DialogContent sx={{ pt: 0, pb: 1.5, px: 3 }}>
                    <DialogContentText sx={{ textAlign: 'left', color: '#475569', fontSize: 14.5, lineHeight: 1.6 }}>
                        {content}
                    </DialogContentText>
                </DialogContent>
            )}

            <DialogActions sx={{ px: 3, pb: 3, pt: 1.5 }}>
                <Stack direction="row" spacing={1.25} width="100%">
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={onClose}
                        disabled={isLoading}
                        sx={{
                            borderRadius: 999,
                            py: 1.05,
                            fontWeight: 700,
                            textTransform: 'none',
                            borderColor: 'rgba(148, 163, 184, 0.45)',
                            color: '#475569',
                            background: '#ffffff',
                            '&:hover': {
                                borderColor: 'rgba(100, 116, 139, 0.58)',
                                background: '#f8fafc',
                            },
                        }}
                    >
                        {cancelLabel}
                    </Button>

                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        sx={{
                            borderRadius: 999,
                            py: 1.05,
                            fontWeight: 800,
                            textTransform: 'none',
                            color: '#fff',
                            background: confirmBg,
                            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.22)',
                            '&:hover': {
                                background: confirmHoverBg,
                                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.26)',
                            },
                        }}
                    >
                        {isLoading ? (
                            <CircularProgress size={18} color="inherit" />
                        ) : (
                            confirmLabel || defaultConfirmLabel
                        )}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}

ConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    title: PropTypes.string,
    content: PropTypes.node,
    variant: PropTypes.oneOf(['danger', 'warning', 'info']),
    confirmLabel: PropTypes.string,
    cancelLabel: PropTypes.string,
    onConfirm: PropTypes.func,
    onClose: PropTypes.func,
    loading: PropTypes.bool,
};
