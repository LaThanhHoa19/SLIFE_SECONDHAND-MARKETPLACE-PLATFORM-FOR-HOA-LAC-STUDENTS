import { Box, Typography } from '@mui/material';
import { STITCH_CARD, STITCH_CARD_BORDER, STITCH_PURPLE } from './myListingsConfig';

export default function MyListingsEmptyState({ tab }) {
    const messages = {
        ACTIVE:   { icon: '📭', title: 'Chưa có tin đăng',       text: 'Bạn chưa có tin đăng nào đang hoạt động.' },
        HIDDEN:   { icon: '👁️', title: 'Không có tin đã ẩn',      text: 'Bạn chưa ẩn bài đăng nào.' },
        DRAFT:    { icon: '📝', title: 'Không có bản nháp',       text: 'Chưa có bản nháp nào được lưu lại.' },
        EXPIRED:  { icon: '⏳', title: 'Không có tin hết hạn',    text: 'Tất cả tin đăng của bạn vẫn còn hiệu lực.' },
        REPORTED: { icon: '🛡️', title: 'Không bị báo cáo',        text: 'Tin đăng của bạn chưa bị báo cáo nào.' },
    };
    const { icon, title, text } = messages[tab] || { icon: '📭', title: 'Trống', text: 'Không có dữ liệu.' };
    return (
        <Box sx={{
            textAlign: 'center',
            py: 9,
            px: 3,
            borderRadius: '16px',
            bgcolor: STITCH_CARD,
            border: `1px dashed ${STITCH_CARD_BORDER}`,
            boxShadow: `inset 0 0 0 1px rgba(157, 110, 237, 0.08)`,
        }}>
            <Typography fontSize={44} sx={{ mb: 1.5, lineHeight: 1 }}>{icon}</Typography>
            <Typography fontSize={16} fontWeight={700} color={STITCH_PURPLE} sx={{ mb: 0.75 }}>
                {title}
            </Typography>
            <Typography fontSize={13.5} color="rgba(255,255,255,0.38)">{text}</Typography>
        </Box>
    );
}
