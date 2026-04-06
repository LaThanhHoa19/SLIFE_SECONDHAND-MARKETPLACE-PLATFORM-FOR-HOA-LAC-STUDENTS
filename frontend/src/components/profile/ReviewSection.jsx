import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, Rating, Stack, Chip, CircularProgress } from '@mui/material';
import { getUserReviews } from '../../api/userApi';
import { fullImageUrl } from '../../utils/constants';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import StarIcon from '@mui/icons-material/Star';

export default function ReviewSection({ userId }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!userId) return;
            try {
                setLoading(true);
                const res = await getUserReviews(userId);
                const payload = res?.data?.data || res?.data || res;
                setReviews(Array.isArray(payload) ? payload : []);
            } catch (err) {
                console.error('Failed to load reviews:', err);
                setError('Không thể tải đánh giá. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [userId]);

    if (loading) {
        return <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Typography sx={{ py: 4, textAlign: 'center', color: '#EF4444' }}>{error}</Typography>;
    }

    if (!reviews || reviews.length === 0) {
        return (
            <Box sx={{ py: 6, textAlign: 'center' }}>
                <StarIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    Người dùng này chưa có đánh giá nào.
                </Typography>
            </Box>
        );
    }

    // Tính toán thống kê
    const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
    
    // Đếm số lượng các tags
    const tagCounts = {};
    reviews.forEach(review => {
        let text = review.comment || '';
        if (text.includes("Tiêu chí nổi bật:")) {
            const parts = text.split("Tiêu chí nổi bật:");
            const tagStr = parts[1].trim();
            if (tagStr) {
                const tags = tagStr.split(",").map(t => t.trim());
                tags.forEach(t => {
                    tagCounts[t] = (tagCounts[t] || 0) + 1;
                });
            }
        }
    });

    const formatPrice = (price) => {
        if (!price) return '0 đ';
        return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
    };

    return (
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
             {/* Stats Box */}
             <Box sx={{ 
                mb: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                pt: 1
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography fontSize="2rem" fontWeight={900} color="white" sx={{ lineHeight: 1 }}>
                        {avgRating.toFixed(1)}
                    </Typography>
                    <Rating 
                        value={avgRating} 
                        precision={0.1}
                        readOnly 
                        icon={<StarIcon sx={{ color: '#fbbf24', fontSize: '1.3rem' }} />}
                        emptyIcon={<StarIcon sx={{ color: 'rgba(255,255,255,0.1)', fontSize: '1.3rem' }} />}
                    />
                </Box>

                {Object.keys(tagCounts).length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 0.5 }}>
                        {Object.entries(tagCounts)
                            .sort((a, b) => b[1] - a[1]) // Sắp xếp theo số lượng giảm dần
                            .map(([tag, count]) => (
                            <Chip 
                                key={tag} 
                                label={`${tag} (${count})`}
                                size="small"
                                sx={{ 
                                    bgcolor: 'rgba(255,255,255,0.05)', 
                                    color: 'rgba(255,255,255,0.7)', 
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '6px',
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    height: 26,
                                    '& .MuiChip-label': { px: 1.5 }
                                }} 
                            />
                        ))}
                    </Box>
                )}
            </Box>

            {/* Title Tabs (Tất cả, Từ người mua) - Currently just "Tất cả" as requested */}
            <Box sx={{ borderBottom: '2px solid #a374f9', display: 'inline-block', pb: 1, mb: 3 }}>
                <Typography fontWeight={700} color="#a374f9" textTransform="uppercase" fontSize="0.9rem">
                    Tất cả ({reviews.length})
                </Typography>
            </Box>

            {/* List Reviews */}
            <Stack spacing={3}>
                {reviews.map(review => {
                     let displayedComment = review.comment || '';
                     let tags = [];
                     if (displayedComment.includes("Tiêu chí nổi bật:")) {
                         const parts = displayedComment.split("Tiêu chí nổi bật:");
                         displayedComment = parts[0].trim();
                         const tagStr = parts[1].trim();
                         if (tagStr) {
                             tags = tagStr.split(",").map(t => t.trim());
                         }
                     }

                     const dateFormatted = review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: vi }) : '';

                     return (
                         <Box key={review.id} sx={{ display: 'flex', gap: 2 }}>
                             <Avatar src={fullImageUrl(review.reviewerAvatar)} sx={{ width: 44, height: 44 }} />
                             <Box sx={{ flex: 1 }}>
                                 <Typography fontWeight={600} color="white" fontSize="0.95rem">
                                     {review.reviewerName || 'Người dùng'}
                                 </Typography>
                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 0.5 }}>
                                     <Rating 
                                         value={review.rating} 
                                         readOnly 
                                         size="small"
                                         icon={<StarIcon sx={{ color: '#fbbf24', fontSize: '1rem' }} />}
                                         emptyIcon={<StarIcon sx={{ color: 'rgba(255,255,255,0.2)', fontSize: '1rem' }} />}
                                     />
                                     <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                                         | {dateFormatted}
                                     </Typography>
                                 </Box>

                                 {/* Tags for this particular review */}
                                 {tags.length > 0 && (
                                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, my: 1.5 }}>
                                         {tags.map((t, idx) => (
                                             <Chip 
                                                key={idx} 
                                                label={t} 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: 'rgba(255,255,255,0.06)', 
                                                    color: 'rgba(255,255,255,0.8)', 
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    height: 24
                                                }} 
                                            />
                                         ))}
                                     </Box>
                                 )}

                                 {displayedComment && (
                                     <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', mt: tags.length ? 0 : 1, mb: 1.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                         {displayedComment}
                                     </Typography>
                                 )}

                                 {/* Product Info Box */}
                                 {review.listingTitle && (
                                     <Box sx={{ 
                                         display: 'flex', 
                                         alignItems: 'center', 
                                         gap: 1.5, 
                                         p: 1.5, 
                                         bgcolor: 'rgba(0,0,0,0.2)', 
                                         borderRadius: 2,
                                         border: '1px solid rgba(255,255,255,0.04)'
                                     }}>
                                         <Box 
                                            component="img" 
                                            src={fullImageUrl(review.listingImage)} 
                                            sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover', bgcolor: '#333' }}
                                         />
                                         <Box>
                                             <Typography fontSize="0.85rem" fontWeight={500} color="rgba(255,255,255,0.7)" sx={{
                                                 display: '-webkit-box',
                                                 WebkitLineClamp: 1,
                                                 WebkitBoxOrient: 'vertical',
                                                 overflow: 'hidden'
                                             }}>
                                                 {review.listingTitle}
                                             </Typography>
                                             <Typography fontSize="0.85rem" fontWeight={700} color="#fbbf24" mt={0.25}>
                                                 {formatPrice(review.listingPrice)}
                                             </Typography>
                                         </Box>
                                     </Box>
                                 )}
                             </Box>
                         </Box>
                     );
                })}
            </Stack>
        </Box>
    );
}
