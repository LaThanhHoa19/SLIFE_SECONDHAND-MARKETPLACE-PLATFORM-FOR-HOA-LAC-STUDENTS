import React from 'react';
import {
    Box,
    Card,
    Typography,
    Button,
    Stack,
    alpha,
} from '@mui/material';
import {
    CheckCircleOutline as CompleteIcon,
    CancelOutlined as CancelIcon,
    AccessTime as TimeIcon,
    RateReviewOutlined as RateIcon,
} from '@mui/icons-material';
import { fullImageUrl } from '../../utils/constants';

const toCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

export default function DealCard({ deal, onComplete, onCancel }) {
    // Handle both camelCase and snake_case for robustness
    const dealId = deal.dealId || deal.deal_id;
    const price = deal.price;
    const status = deal.status;
    const createdAt = deal.createdAt || deal.created_at;
    const listingTitle = deal.listingTitle || deal.listing_title || 'Tin đăng';
    const listingImage = deal.listingImage || deal.listing_image;
    const isReviewed = deal.isReviewed || deal.is_reviewed;

    // Tính toán thời gian 7 ngày
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isExpired = diffDays > 7;

    // Helper to render badge based on status
    const renderStatusBadge = () => {
        switch (status) {
            case 'SUCCESS':
                return (
                    <Box sx={{ 
                        px: 1.5, py: 0.5, borderRadius: '8px', 
                        bgcolor: alpha('#10B981', 0.1), color: '#10B981',
                        fontSize: '0.75rem', fontWeight: 800, border: '1px solid currentColor'
                    }}>
                        ĐÃ HOÀN TẤT
                    </Box>
                );
            case 'CANCELLED':
                return (
                    <Box sx={{ 
                        px: 1.5, py: 0.5, borderRadius: '8px', 
                        bgcolor: alpha('#EF4444', 0.1), color: '#EF4444',
                        fontSize: '0.75rem', fontWeight: 800, border: '1px solid currentColor'
                    }}>
                        ĐÃ HỦY
                    </Box>
                );
            case 'COMPLETED':
            default:
                return (
                    <Box sx={{ 
                        px: 1.5, py: 0.5, borderRadius: '8px', 
                        bgcolor: alpha('#A78BFA', 0.1), color: '#A78BFA',
                        fontSize: '0.75rem', fontWeight: 800, border: '1px solid currentColor'
                    }}>
                        CHỜ HOÀN THÀNH
                    </Box>
                );
        }
    };

    return (
        <Card
            sx={{
                p: 2,
                mb: 2,
                display: 'flex',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '20px',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.06)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    borderColor: 'rgba(167, 139, 250, 0.3)'
                }
            }}
        >
            {/* Image Preview */}
            <Box
                sx={{
                    width: 110,
                    height: 110,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    mr: 2.5,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    bgcolor: '#000'
                }}
            >
                <Box
                    component="img"
                    src={fullImageUrl(listingImage)}
                    alt={listingTitle}
                    sx={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'block',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': { transform: 'scale(1.15)' }
                    }}
                />
            </Box>

            {/* Content Section */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography 
                        variant="h6" 
                        fontWeight={900} 
                        color="#fff" 
                        noWrap 
                        sx={{ 
                            fontSize: '1.15rem',
                            letterSpacing: '-0.02em',
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                        }}
                    >
                        {listingTitle}
                    </Typography>
                    {renderStatusBadge()}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="h5" fontWeight={900} color="#FF6B6B" sx={{ mr: 1, letterSpacing: '-0.03em' }}>
                        {toCurrency(price)}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'rgba(255,255,255,0.4)' }}>
                        <TimeIcon sx={{ fontSize: 18 }} />
                        <Typography variant="caption" fontWeight={600}>
                            Ngày chốt: {new Date(createdAt).toLocaleDateString('vi-VN')}
                        </Typography>
                    </Box>
                </Stack>

                {/* Case 1: Chờ xác nhận (Chưa quá 7 ngày) */}
                {status === 'COMPLETED' && !isExpired && (
                    <Stack direction="row" spacing={2} sx={{ mt: 'auto' }}>
                        <Button
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => onCancel(deal)}
                            sx={{
                                flex: 1,
                                py: 1.2,
                                borderRadius: '14px',
                                textTransform: 'none',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                borderColor: 'rgba(239, 68, 68, 0.4)',
                                color: '#EF4444',
                                '&:hover': {
                                    bgcolor: alpha('#EF4444', 0.12),
                                    borderColor: '#EF4444',
                                }
                            }}
                        >
                            Hủy chốt
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<CompleteIcon />}
                            onClick={() => onComplete(deal)}
                            sx={{
                                flex: 1,
                                py: 1.2,
                                borderRadius: '14px',
                                textTransform: 'none',
                                fontWeight: 900,
                                fontSize: '0.9rem',
                                background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                                color: '#fff',
                                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                                }
                            }}
                        >
                            Đã nhận hàng
                        </Button>
                    </Stack>
                )}

                {/* Case 2: Đã thành công nhưng CHƯA ĐÁNH GIÁ (Còn hạn 7 ngày) */}
                {status === 'SUCCESS' && !isReviewed && !isExpired && (
                    <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                            Bạn chưa đánh giá người bán này
                        </Typography>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<RateIcon />}
                            onClick={() => onComplete(deal)} // Mở RatingModal
                            sx={{
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 800,
                                px: 2,
                                bgcolor: alpha('#A78BFA', 0.2),
                                color: '#A78BFA',
                                border: '1px solid currentColor',
                                '&:hover': { bgcolor: alpha('#A78BFA', 0.3) }
                            }}
                        >
                            Đánh giá ngay
                        </Button>
                    </Box>
                )}

                {/* Case 3: Đã chốt thành công và ĐÃ ĐÁNH GIÁ */}
                {status === 'SUCCESS' && isReviewed && (
                    <Typography variant="caption" sx={{ mt: 'auto', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CompleteIcon sx={{ fontSize: 16 }} /> Bạn đã đánh giá người bán này. Cảm ơn bạn!
                    </Typography>
                )}

                {/* Case 4: Mọi trường hợp nếu đã quá 7 ngày */}
                {isExpired && status !== 'SUCCESS' && (
                    <Typography variant="caption" sx={{ mt: 'auto', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                        Giao dịch này đã tự động kết thúc sau 7 ngày.
                    </Typography>
                )}
                
                {isExpired && status === 'SUCCESS' && !isReviewed && (
                    <Typography variant="caption" sx={{ mt: 'auto', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
                        Đã hết thời hạn đánh giá giao dịch này.
                    </Typography>
                )}
            </Box>
        </Card>
    );
}
