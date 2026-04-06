import {
    Box,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Autorenew as RenewIcon,
    DeleteOutline as DeleteIcon,
    EditOutlined as EditIcon,
    ImageNotSupported as NoImageIcon,
    Replay as RepostIcon,
    Visibility as UnhideIcon,
    VisibilityOff as HideIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fullImageUrl } from '../../../utils/constants';
import { formatDate } from '../../../utils/formatDate';
import {
    isRenewable,
    STATUS_BADGE_LABELS,
    STITCH_ACTION_BAR_BG,
    STITCH_CARD,
    STITCH_CARD_BORDER,
    STITCH_PRICE_CYAN,
    STITCH_PURPLE,
    toCurrency,
} from './myListingsConfig';
import { formatRelativeTimeVi } from './myListingsUtils';

const iconBtnSx = {
    color: 'rgba(255,255,255,0.5)',
    p: '5px',
    borderRadius: '10px',
    '&:hover': {
        color: STITCH_PURPLE,
        bgcolor: 'rgba(157, 110, 237, 0.12)',
    },
};

export default function MyListingCard({
                                          listing,
                                          activeTab,
                                          onHide,
                                          onUnhide,
                                          onRenew,
                                          onRepost,
                                          onDeleteDraft,
                                      }) {
    const navigate = useNavigate();
    const id = listing?.id ?? listing?.listingId;
    const images = Array.isArray(listing?.images) ? listing.images : [];
    const thumb = images[0];
    const badge =
        STATUS_BADGE_LABELS[listing?.status] ||
        (listing?.status ? String(listing.status).toUpperCase() : 'TIN');

    const goDetail = (e) => {
        e?.stopPropagation?.();
        navigate(`/listings/${id}`);
    };

    return (
        <Box sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            bgcolor: STITCH_CARD,
            border: `1px solid ${STITCH_CARD_BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.2s',
            '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(157, 110, 237, 0.12)',
                borderColor: 'rgba(157, 110, 237, 0.22)',
            },
        }}>

            {/* Ảnh vuông — giống mockup */}
            <Box
                onClick={goDetail}
                sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1.7 / 1', // Further reduced height
                    cursor: 'pointer',
                    bgcolor: 'rgba(0,0,0,0.4)',
                    flexShrink: 0,
                }}
            >
                {thumb ? (
                    <Box
                        component="img"
                        src={fullImageUrl(thumb)}
                        alt=""
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.5,
                        }}
                    >
                        <NoImageIcon sx={{ fontSize: 44, color: 'rgba(255,255,255,0.12)' }} />
                        <Typography fontSize={11} color="rgba(255,255,255,0.22)">Chưa có ảnh</Typography>
                    </Box>
                )}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        px: 1.1,
                        py: 0.5,
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg, rgba(157,110,237,0.98), rgba(123,79,191,0.95))',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                    }}
                >
                    <Typography
                        fontSize={9.5}
                        fontWeight={800}
                        letterSpacing={0.08}
                        color="#fff"
                        lineHeight={1.2}
                    >
                        {badge}
                    </Typography>
                </Box>
            </Box>

            <Stack sx={{ p: 1.25, pt: 1, pb: 1.25, flex: 1, gap: 0.5 }}>
                 <Typography
                     onClick={goDetail}
                     fontSize={14}
                     fontWeight={700}
                     color="rgba(255,255,255,0.95)"
                     sx={{
                         cursor: 'pointer',
                         lineHeight: 1.3,
                         display: '-webkit-box',
                         WebkitLineClamp: 2,
                         WebkitBoxOrient: 'vertical',
                         overflow: 'hidden',
                         minHeight: 32,
                         letterSpacing: '-0.01em',
                         '&:hover': { color: STITCH_PURPLE },
                     }}
                 >
                     {listing?.title || 'Không có tiêu đề'}
                 </Typography>
 
                 <Typography
                     fontSize={16}
                     fontWeight={800}
                     color={listing?.isGiveaway ? '#5CE1A8' : STITCH_PRICE_CYAN}
                     sx={{
                         letterSpacing: '-0.02em',
                         textShadow: listing?.isGiveaway ? 'none' : '0 0 12px rgba(92, 225, 230, 0.18)',
                     }}
                 >
                     {listing?.isGiveaway ? 'Cho tặng' : toCurrency(listing?.price)}
                 </Typography>

                {(listing?.expirationDate || listing?.reportCount > 0) && (
                    <Stack gap={0.35}>
                        {listing?.expirationDate && (
                            <Typography fontSize={10.5} color="rgba(255,255,255,0.32)">
                                Hết hạn {formatDate(listing.expirationDate)}
                            </Typography>
                        )}
                        {listing?.reportCount > 0 && (
                            <Typography fontSize={10.5} fontWeight={600} color="#ff6b7a">
                                {listing.reportCount} báo cáo
                            </Typography>
                        )}
                    </Stack>
                )}
            </Stack>

            {/* Thanh hành động tối — giống Stitch */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    bgcolor: STITCH_ACTION_BAR_BG,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <Stack direction="row" alignItems="center" gap={0.25}>
                    {activeTab === 'ACTIVE' && (
                        <>
                            <Tooltip title="Chỉnh sửa">
                                <IconButton
                                    type="button"
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); id && navigate(`/listings/${id}/edit`); }}
                                    sx={iconBtnSx}
                                >
                                    <EditIcon sx={{ fontSize: 19 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Ẩn tin">
                                <IconButton
                                    type="button"
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); onHide(id); }}
                                    sx={iconBtnSx}
                                >
                                    <HideIcon sx={{ fontSize: 19 }} />
                                </IconButton>
                            </Tooltip>
                            {isRenewable(listing?.expirationDate) ? (
                                <Tooltip title="Gia hạn 15 ngày">
                                    <IconButton
                                        type="button"
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); onRenew(id); }}
                                        sx={iconBtnSx}
                                    >
                                        <RenewIcon sx={{ fontSize: 19 }} />
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <Tooltip title="Tin đang đăng không xóa trực tiếp — dùng Ẩn tin để gỡ khỏi feed.">
                                    <Box component="span" sx={{ display: 'inline-block' }}>
                                        <IconButton type="button" size="small" disabled sx={{ ...iconBtnSx, opacity: 0.35 }}>
                                            <DeleteIcon sx={{ fontSize: 19 }} />
                                        </IconButton>
                                    </Box>
                                </Tooltip>
                            )}
                        </>
                    )}

                    {activeTab === 'DRAFT' && (
                        <>
                            <Tooltip title="Chỉnh sửa & đăng">
                                <IconButton
                                    type="button"
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); id && navigate(`/drafts/${id}/publish`); }}
                                    sx={iconBtnSx}
                                >
                                    <EditIcon sx={{ fontSize: 19 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa bản nháp">
                                <IconButton
                                    type="button"
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); onDeleteDraft(id); }}
                                    sx={{
                                        ...iconBtnSx,
                                        '&:hover': { color: '#ff6b7a', bgcolor: 'rgba(255,107,122,0.12)' },
                                    }}
                                >
                                    <DeleteIcon sx={{ fontSize: 19 }} />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}

                    {activeTab === 'EXPIRED' && (
                        <Tooltip title="Đăng lại">
                            <IconButton
                                type="button"
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onRepost(id); }}
                                sx={iconBtnSx}
                            >
                                <RepostIcon sx={{ fontSize: 19 }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {activeTab === 'HIDDEN' && (
                        <Tooltip title="Hiển thị lại">
                            <IconButton
                                type="button"
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onUnhide(id); }}
                                sx={iconBtnSx}
                            >
                                <UnhideIcon sx={{ fontSize: 19 }} />
                            </IconButton>
                        </Tooltip>
                    )}

                    {activeTab === 'REPORTED' && (
                        <Tooltip title="Chỉnh sửa">
                            <IconButton
                                type="button"
                                size="small"
                                onClick={(e) => { e.stopPropagation(); id && navigate(`/listings/${id}/edit`); }}
                                sx={iconBtnSx}
                            >
                                <EditIcon sx={{ fontSize: 19 }} />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>

                <Typography
                    fontSize={9.5}
                    fontWeight={800}
                    letterSpacing={0.06}
                    color="rgba(255,255,255,0.28)"
                    sx={{ flexShrink: 0, textAlign: 'right', lineHeight: 1.3, maxWidth: '42%' }}
                >
                    {formatRelativeTimeVi(listing?.updatedAt || listing?.createdAt)}
                </Typography>
            </Box>
        </Box>
    );
}
