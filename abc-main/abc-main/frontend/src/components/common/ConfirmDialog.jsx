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
        confirmColor: 'error',
        iconBg: '#fff1f0',
        iconColor: '#d32f2f',
        defaultTitle: 'Xác nhận xoá',
        defaultConfirmLabel: 'Xoá',
    },
    warning: {
        Icon: WarningIcon,
        confirmColor: 'warning',
        iconBg: '#fffbeb',
        iconColor: '#ed6c02',
        defaultTitle: 'Xác nhận thao tác',
        defaultConfirmLabel: 'Tiếp tục',
    },
    info: {
        Icon: InfoIcon,
        confirmColor: 'primary',
        iconBg: '#e8f4fd',
        iconColor: '#0288d1',
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

    const { Icon, confirmColor, iconBg, iconColor, defaultTitle, defaultConfirmLabel } =
    VARIANTS[variant] ?? VARIANTS.danger;

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
            TransitionProps={{ timeout: 200 }}
            PaperProps={{
                elevation: 8,
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                },
            }}
        >
            {/* Header với icon nổi bật */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pt: 4,
                    pb: 2,
                    px: 3,
                    gap: 1.5,
                }}
            >
                {/* Icon circle */}
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon sx={{ fontSize: 32, color: iconColor }} />
                </Box>

                <Typography variant="h6" fontWeight={700} textAlign="center" lineHeight={1.3}>
                    {title || defaultTitle}
                </Typography>
            </Box>

            {/* Content */}
            {content && (
                <DialogContent sx={{ pt: 0, pb: 1, px: 3 }}>
                    <DialogContentText textAlign="center" fontSize="0.9rem">
                        {content}
                    </DialogContentText>
                </DialogContent>
            )}

            {/* Actions */}
            <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
                <Stack direction="row" spacing={1.5} width="100%">
                    <Button
                        fullWidth
                        variant="outlined"
                        color="inherit"
                        onClick={onClose}
                        disabled={isLoading}
                        sx={{
                            borderRadius: 2,
                            py: 1.2,
                            fontWeight: 600,
                            borderColor: 'divider',
                            color: 'text.secondary',
                            '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
                        }}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        color={confirmColor}
                        onClick={handleConfirm}
                        disabled={isLoading}
                        sx={{
                            borderRadius: 2,
                            py: 1.2,
                            fontWeight: 600,
                            boxShadow: 'none',
                            '&:hover': { boxShadow: 'none' },
                        }}
                    >
                        {isLoading ? (
                            <CircularProgress size={20} color="inherit" />
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
