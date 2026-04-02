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
    NEW:           { label: 'Mới',         color: GREEN },
    USED_LIKE_NEW: { label: 'Như mới',     color: '#1DD3B0' },
    USED_GOOD:     { label: 'Đã dùng – tốt', color: PURPLE },
    USED_FAIR:     { label: 'Đã dùng',     color: '#FFA502' },
};

export const getConditionInfo = (condition) =>
    CONDITION_MAP[condition] || { label: condition || 'Không rõ', color: TEXT_SEC };

export default function ListingSummary({ title, price, isGiveaway, locationText, createdAt, itemCondition }) {
    const conditionInfo = getConditionInfo(itemCondition);

    return (
        <Box>
            <Typography
                fontSize={{ xs: 22, sm: 28 }}
                fontWeight={800}
                color={TEXT_PRI}
                sx={{
                    lineHeight: 1.25,
                    mb: 2,
                    letterSpacing: '-0.01em',
                    wordBreak: 'break-word'
                }}
            >
                {title}
            </Typography>

            <Box
                sx={{
                    mb: 2.75,
                    px: 2,
                    py: 1.5,
                    borderRadius: '12px',
                    border: `1px solid ${isGiveaway ? 'rgba(46,213,115,0.35)' : 'rgba(255,71,87,0.35)'}`,
                    bgcolor: isGiveaway ? 'rgba(46,213,115,0.08)' : 'rgba(255,71,87,0.08)',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    width: 'fit-content',
                    maxWidth: '100%',
                }}
            >
                <Typography fontSize={12} fontWeight={700} color={TEXT_SEC} sx={{ mb: 0.4 }}>
                    Giá bán
                </Typography>
                <Typography
                    fontSize={{ xs: 24, sm: 30 }}
                    fontWeight={900}
                    color={isGiveaway ? GREEN : RED}
                    sx={{ lineHeight: 1.15 }}
                >
                    {isGiveaway ? 'Cho tặng miễn phí' : toCurrency(price)}
                </Typography>
            </Box>

            {/* Meta thông tin: Location, Time, Condition */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 2, sm: 3.5 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    {locationText && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <LocationOnOutlinedIcon sx={{ fontSize: 18, color: PURPLE }} />
                            <Typography fontSize={14} color={'rgba(255,255,255,0.88)'}>{locationText}</Typography>
                        </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <AccessTimeOutlinedIcon sx={{ fontSize: 18, color: PURPLE }} />
                        <Typography fontSize={14} color={'rgba(255,255,255,0.88)'}>
                            {formatDate(createdAt) || 'Vừa đăng'}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LocalOfferOutlinedIcon sx={{ fontSize: 18, color: PURPLE }} />
                        <Chip
                            label={conditionInfo.label}
                            size="small"
                            sx={{
                                bgcolor: `${conditionInfo.color}22`,
                                color: conditionInfo.color,
                                border: `1px solid ${conditionInfo.color}44`,
                                fontSize: 12, fontWeight: 600, height: 24, paddingX: 1
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
