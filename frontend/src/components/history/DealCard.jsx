import {
    Box,
    Button,
    Card,
    Stack,
    Typography,
    alpha
} from '@mui/material';
import {
    AccessTime as TimeIcon,
    Cancel as CancelIcon,
    CheckCircle as CompleteIcon,
    ImageNotSupported as NoImageIcon,
    RateReview as ReviewIcon
} from '@mui/icons-material';
import { fullImageUrl } from '../../utils/constants';
import { Link } from 'react-router-dom';
import { formatCurrency as toCurrency } from '../../utils/listingFormatUtils';

// toCurrency imported from listingFormatUtils

const STATUS_CONFIG = {
    'COMPLETED': { label: 'ĐÃ HOÀN TẤT', color: '#10B981' },
    'SUCCESS': { label: 'GIAO DỊCH THÀNH CÔNG', color: '#10B981' },
    'CANCELLED': { label: 'ĐÃ HỦY', color: '#EF4444' }
};

export default function DealCard({ deal, onComplete, onCancel, onRate }) {
    const {
        listingTitle,
        listingImage, // Fixed: was thumbnail
        price,
        status,
        createdAt,
        sellerName,
        sellerId,
        isReviewed, // Added to check for rating button
        updatedAt,
        confirmedAt
    } = deal;

    const config = STATUS_CONFIG[status] || { label: status, color: '#9D6EED' };

    // Logic hiển thị nút:
    // 1. SUCCESS -> Hiện "Đánh giá ngay" (nếu chưa đánh giá)
    // 2. COMPLETED -> Hiện "Hủy" và "Đã nhận"
    // 3. CANCELLED -> Không hiện gì
    // Logic hiển thị nút:
    const showReview = status === 'SUCCESS';
    const showActions = status === 'COMPLETED';

    // Logic 7 ngày đánh giá kể từ lúc "Chốt trong chat" (confirmedAt hoặc createdAt)
    let reviewDaysLeft = null;
    const startPoint = confirmedAt || createdAt;
    if (showReview && startPoint) {
        const deadline = new Date(startPoint);
        deadline.setDate(deadline.getDate() + 7);
        reviewDaysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
    }

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: '16px',
                overflow: 'hidden',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                    borderColor: 'rgba(167, 139, 250, 0.2)'
                }
            }}
        >
            {/* Image Section - Compact Aspect Ratio matching MyListings (1.7/1) */}
            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1.7 / 1', flexShrink: 0, bgcolor: 'rgba(0,0,0,0.2)' }}>
                {listingImage ? (
                    <Box
                        component="img"
                        src={fullImageUrl(listingImage)}
                        alt={listingTitle}
                        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                        <NoImageIcon sx={{ fontSize: 32, color: 'rgba(255,255,255,0.1)' }} />
                    </Box>
                )}
                
                {/* Status Badge */}
                <Box sx={{ 
                    position: 'absolute', top: 8, left: 8, 
                    px: 1, py: 0.35, borderRadius: '999px',
                    bgcolor: alpha(config.color, 0.95),
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                    <Typography fontSize={8.5} fontWeight={900} color="#fff" letterSpacing={0.5}>
                        {config.label}
                    </Typography>
                </Box>
            </Box>

            {/* Info Section - Tighter padding and smaller fonts matching MyListings 20% reduction */}
            <Stack sx={{ p: 1.25, pt: 1, flexGrow: 1, gap: 0.5 }}>
                <Typography
                    fontSize={14}
                    fontWeight={700}
                    color="#fff"
                    sx={{
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 32,
                        mb: 0.25
                    }}
                >
                    {listingTitle}
                </Typography>
                
                <Typography fontSize={16} fontWeight={800} color="#FF6B6B">
                    {toCurrency(price)}
                </Typography>

                <Stack sx={{ gap: 0.25, mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(255,255,255,0.3)' }}>
                        <TimeIcon sx={{ fontSize: 13 }} />
                        <Typography variant="caption" fontWeight={600} fontSize={9}>
                            Chốt trong chat: <strong>{new Date(createdAt).toLocaleDateString('vi-VN')}</strong>
                        </Typography>
                    </Box>

                    {(status === 'SUCCESS' || status === 'CANCELLED') && updatedAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(255,255,255,0.3)' }}>
                            <CompleteIcon sx={{ fontSize: 13, color: status === 'SUCCESS' ? '#10B981' : '#EF4444' }} />
                            <Typography variant="caption" fontWeight={600} fontSize={9}>
                                {status === 'SUCCESS' ? 'Hoàn tất lúc' : 'Hủy lúc'}: <strong>{new Date(updatedAt).toLocaleDateString('vi-VN')}</strong>
                            </Typography>
                        </Box>
                    )}
                </Stack>

                <Typography variant="caption" color="rgba(255,255,255,0.35)" fontSize={9.5} sx={{ mt: 'auto', pt: 1 }}>
                    Người bán: {' '}
                    <Link 
                        to={`/profile/${sellerId}`}
                        style={{ 
                            color: '#A78BFA', 
                            textDecoration: 'none', 
                            fontWeight: 800,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                        {sellerName}
                    </Link>
                </Typography>
            </Stack>

            {/* Actions Bar - Consistent compact buttons */}
            {showReview && (
                <Stack spacing={0.5} sx={{ p: 1, pt: 0 }}>
                    {!isReviewed ? (
                        <>
                            <Button
                                fullWidth
                                size="small"
                                variant="contained"
                                startIcon={<ReviewIcon sx={{ fontSize: '14px !important' }} />}
                                onClick={() => onRate(deal)}
                                disabled={reviewDaysLeft !== null && reviewDaysLeft <= 0}
                                sx={{
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    py: 0.75,
                                    background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                                    '&:hover': { background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
                                    '&.Mui-disabled': { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', boxShadow: 'none' }
                                }}
                            >
                                Đánh giá ngay
                            </Button>
                            {reviewDaysLeft !== null && (
                                <Typography textAlign="center" fontSize={9.5} color={(reviewDaysLeft <= 2 && reviewDaysLeft > 0) ? '#EF4444' : 'rgba(255,255,255,0.45)'} fontWeight={600} letterSpacing={0.2}>
                                    {reviewDaysLeft > 0 ? `Còn ${reviewDaysLeft} ngày để đánh giá` : 'Đã quá thời hạn đánh giá'}
                                </Typography>
                            )}
                        </>
                    ) : (
                        <Box sx={{ 
                            py: 1, px: 1.5, borderRadius: '8px', 
                            bgcolor: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75
                        }}>
                            <CompleteIcon sx={{ fontSize: 14, color: '#10B981' }} />
                            <Typography fontSize={11} fontWeight={700} color="#10B981">ĐÃ ĐÁNH GIÁ</Typography>
                        </Box>
                    )}
                </Stack>
            )}

            {showActions && (
                <Stack direction="row" spacing={1} sx={{ p: 1, pt: 0 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => onCancel(deal)}
                        sx={{
                            flex: 1, borderRadius: '8px', textTransform: 'none',
                            fontSize: '0.7rem', fontWeight: 700, color: '#EF4444', 
                            borderColor: 'rgba(239, 68, 68, 0.3)', py: 0.5,
                            '&:hover': { borderColor: '#EF4444', bgcolor: 'rgba(239, 68, 68, 0.05)' }
                        }}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => onComplete(deal)}
                        sx={{
                            flex: 1.5, borderRadius: '8px', textTransform: 'none',
                            fontSize: '0.7rem', fontWeight: 700, bgcolor: '#10B981',
                            py: 0.5,
                            '&:hover': { bgcolor: '#059669' }
                        }}
                    >
                        Đã nhận
                    </Button>
                </Stack>
            )}
        </Card>
    );
}
