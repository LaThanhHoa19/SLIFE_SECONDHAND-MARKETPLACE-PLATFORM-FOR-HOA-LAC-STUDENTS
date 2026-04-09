import { Box, Typography, Chip } from '@mui/material';
import { formatDate } from '../../utils/formatDate';
import { 
    getConditionInfo, 
    getPurposeInfo,
    getStatusInfo,
    LISTING_ICONS,
    BRAND_COLORS,
    formatRelativeShort
} from '../../utils/listingFormatUtils';

export const TEXT_PRI = BRAND_COLORS.TEXT_PRI;
export const TEXT_SEC = BRAND_COLORS.TEXT_SEC;
export const PURPLE = BRAND_COLORS.PURPLE;
export const RED = BRAND_COLORS.RED;
export const GREEN = BRAND_COLORS.GREEN;

export default function ListingSummary({ title, price, isGiveaway, locationText, createdAt, itemCondition, status }) {
    const conditionInfo = getConditionInfo(itemCondition);
    const statusInfo = getStatusInfo(status);
    const purposeInfo = getPurposeInfo(isGiveaway, price);

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
                    color={purposeInfo.color}
                    sx={{ lineHeight: 1.2 }}
                >
                    {purposeInfo.priceText}
                </Typography>
            </Box>

            {/* Meta thông tin: Location, Time, Condition */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {locationText && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontSize={18} sx={{ opacity: 0.8 }}>{LISTING_ICONS.LOCATION}</Typography>
                        <Typography fontSize={14} color={TEXT_SEC}>{locationText}</Typography>
                    </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontSize={18} sx={{ opacity: 0.8 }}>{LISTING_ICONS.TIME}</Typography>
                    <Typography fontSize={14} color={TEXT_SEC}>
                        {formatRelativeShort(createdAt)}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {/* Status Badge (if not ACTIVE) */}
                    {status && status.toUpperCase() !== 'ACTIVE' && (
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.08)', px: 1.2, py: 0.5, borderRadius: '6px' }}>
                            <Typography fontSize={12} fontWeight={700} color={statusInfo.color}>
                                {LISTING_ICONS.STATUS} {statusInfo.label.toUpperCase()}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.08)', px: 1.2, py: 0.5, borderRadius: '6px' }}>
                        <Typography fontSize={12} fontWeight={500} color={conditionInfo.color}>
                            {LISTING_ICONS.CONDITION} {conditionInfo.label}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
