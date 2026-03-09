/**
 * ErrorState — component hiển thị trạng thái lỗi tái sử dụng (SCRUM-50).
 *
 * Props:
 *   title       – tiêu đề lỗi (default tuỳ theo variant)
 *   message     – mô tả chi tiết
 *   variant     – 'network' | 'notFound' | 'forbidden' | 'generic' (default 'generic')
 *   onRetry     – callback khi bấm "Thử lại" (nếu không truyền → ẩn nút)
 *   retryLabel  – label nút retry (default "Thử lại")
 *   fullPage    – true → chiếm toàn chiều cao viewport (dùng cho page-level error)
 */
import {
    Block as BlockIcon,
    CloudOff as CloudOffIcon,
    ErrorOutline as ErrorIcon,
    SearchOff as SearchOffIcon,
} from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import PropTypes from 'prop-types';

const VARIANTS = {
    network: {
        Icon: CloudOffIcon,
        defaultTitle: 'Không thể kết nối',
        defaultMessage: 'Vui lòng kiểm tra kết nối mạng và thử lại.',
        color: 'warning.main',
    },
    notFound: {
        Icon: SearchOffIcon,
        defaultTitle: 'Không tìm thấy',
        defaultMessage: 'Nội dung bạn tìm kiếm không tồn tại hoặc đã bị xoá.',
        color: 'text.secondary',
    },
    forbidden: {
        Icon: BlockIcon,
        defaultTitle: 'Không có quyền truy cập',
        defaultMessage: 'Bạn không có quyền xem nội dung này.',
        color: 'error.main',
    },
    generic: {
        Icon: ErrorIcon,
        defaultTitle: 'Đã xảy ra lỗi',
        defaultMessage: 'Có gì đó không đúng. Vui lòng thử lại.',
        color: 'error.main',
    },
};

export default function ErrorState({
                                       title,
                                       message,
                                       variant = 'generic',
                                       onRetry,
                                       retryLabel = 'Thử lại',
                                       fullPage = false,
                                   }) {
    const { Icon, defaultTitle, defaultMessage, color } = VARIANTS[variant] ?? VARIANTS.generic;

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            minHeight={fullPage ? '60vh' : 200}
            p={4}
            gap={1.5}
        >
            <Icon sx={{ fontSize: 56, color, mb: 0.5 }} />

            <Typography variant="h6" fontWeight={600}>
                {title || defaultTitle}
            </Typography>

            {(message || defaultMessage) && (
                <Typography variant="body2" color="text.secondary" maxWidth={400}>
                    {message || defaultMessage}
                </Typography>
            )}

            {onRetry && (
                <Button variant="outlined" size="small" onClick={onRetry} sx={{ mt: 1 }}>
                    {retryLabel}
                </Button>
            )}
        </Box>
    );
}

ErrorState.propTypes = {
    title: PropTypes.string,
    message: PropTypes.string,
    variant: PropTypes.oneOf(['network', 'notFound', 'forbidden', 'generic']),
    onRetry: PropTypes.func,
    retryLabel: PropTypes.string,
    fullPage: PropTypes.bool,
};
