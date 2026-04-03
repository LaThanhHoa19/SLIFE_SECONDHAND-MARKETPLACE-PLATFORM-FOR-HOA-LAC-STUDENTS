import { Box, Typography, Chip } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { formatDate } from '../../utils/formatDate';

export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';
export const RED = '#FF4757';
export const GREEN = '#2ED573';

export const toCurrency = (value) =>
    value == null ? '—' : `${Number(value).toLocaleString('vi-VN')} ₫`;

const CONDITION_MAP = {
    NEW: { label: 'Mới', color: GREEN },
    USED_LIKE_NEW: { label: 'Như mới', color: '#1DD3B0' },
    USED_GOOD: { label: 'Đã dùng – tốt', color: PURPLE },
    USED_FAIR: { label: 'Đã dùng', color: '#FFA502' },
};

export const getConditionInfo = (condition) =>
    CONDITION_MAP[condition] || { label: condition || 'Không rõ', color: TEXT_SEC };

export default function ListingSummary({ title, price, isGiveaway, locationText, createdAt, itemCondition }) {
    const conditionInfo = getConditionInfo(itemCondition);

    return (
        <Box>
            <Typography
                fontSize={{ xs: 20, sm: 24 }}
                fontWeight={700}
                color={TEXT_PRI}
                sx={{
                    lineHeight: 1.3,
                    mb: 1.5,
                    letterSpacing: '-0.01em',
                    wordBreak: 'break-word'
                }}
            >
                {title}
            </Typography>

            <Box sx={{ mb: 1.5 }}>
                <Typography
                    fontSize={{ xs: 22, sm: 28 }}
                    fontWeight={800}
                    color={isGiveaway ? GREEN : RED}
                    sx={{ lineHeight: 1.2 }}
                >
                    {isGiveaway ? 'Cho tặng miễn phí' : toCurrency(price)}
                </Typography>
            </Box>

            {/* Meta thông tin: Location, Time, Condition */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {locationText && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnOutlinedIcon sx={{ fontSize: 18, color: TEXT_SEC }} />
                        <Typography fontSize={14} color={TEXT_SEC}>{locationText}</Typography>
                    </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeOutlinedIcon sx={{ fontSize: 18, color: TEXT_SEC }} />
                    <Typography fontSize={14} color={TEXT_SEC}>
                        {formatDate(createdAt) || 'Vừa đăng'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <LocalOfferOutlinedIcon sx={{ fontSize: 16, color: TEXT_SEC }} />
                    <Chip
                        label={conditionInfo.label}
                        size="small"
                        sx={{
                            bgcolor: `${conditionInfo.color}11`,
                            color: conditionInfo.color,
                            border: `1px solid ${conditionInfo.color}33`,
                            fontSize: 10, fontWeight: 700, height: 20, px: 0.5,
                            textTransform: 'uppercase'
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}
