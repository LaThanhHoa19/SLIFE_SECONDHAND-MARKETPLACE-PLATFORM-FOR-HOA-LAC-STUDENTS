import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Rating,
    TextField,
    Chip,
    Stack,
    IconButton,
    alpha,
} from '@mui/material';
import { 
    Close as CloseIcon, 
    Star as StarIcon,
    InfoOutlined as InfoIcon
} from '@mui/icons-material';

const SUGGESTED_TAGS = [
    'Thái độ thân thiện',
    'Đến đúng giờ',
    'Phản hồi nhanh',
    'Sản phẩm như mô tả',
    'Giao dịch nhanh chóng'
];

export default function RatingModal({ open, onClose, onConfirm, loading, sellerName }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);

    const handleTagClick = (tag) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag) 
                : [...prev, tag]
        );
    };

    const handleSubmit = () => {
        onConfirm({ rating, comment, tags: selectedTags });
    };

    const handleClose = () => {
        if (!loading) {
            setRating(5);
            setComment('');
            setSelectedTags([]);
            onClose();
        }
    };

    const ratingLabel = rating === 5 ? 'TUYỆT VỜI!' : rating >= 4 ? 'HÀI LÒNG' : rating >= 3 ? 'ỔN' : rating >= 2 ? 'KÉM' : 'RẤT TỆ';

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            PaperProps={{
                sx: {
                    width: '380px',
                    maxWidth: '92vw',
                    borderRadius: '20px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                    background: 'linear-gradient(135deg, #161822 0%, #1e202a 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                    m: 2,
                }
            }}
        >
            {/* Header Banner + Close */}
            <DialogTitle sx={{ m: 0, p: 0, position: 'relative' }}>
                <Box sx={{ 
                    bgcolor: 'rgba(59, 130, 246, 0.08)', 
                    color: '#60A5FA',
                    py: 1, px: 2.5,
                    display: 'flex', alignItems: 'center', gap: 1,
                    borderBottom: '1px solid rgba(59, 130, 246, 0.12)'
                }}>
                    <InfoIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                    <Typography fontSize={12} fontWeight={600} lineHeight={1.4}>
                        Đánh giá để xây dựng cộng đồng mua bán chất lượng hơn.
                    </Typography>
                </Box>
                <IconButton 
                    onClick={handleClose} 
                    disabled={loading}
                    size="small"
                    sx={{ 
                        position: 'absolute', top: 4, right: 6,
                        color: 'rgba(255,255,255,0.4)', 
                        '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } 
                    }}
                >
                    <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pb: 1.5, pt: 3, px: 2.5, overflow: 'hidden' }}>
                <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 16, textAlign: 'center', mb: 2, mt: 1 }}>
                    Trải nghiệm với <span style={{ color: '#A78BFA' }}>{sellerName || 'người bán'}</span> như thế nào?
                </Typography>

                {/* Stars */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Rating
                        value={rating}
                        onChange={(_, v) => setRating(v)}
                        emptyIcon={<StarIcon style={{ opacity: 0.15, color: '#fff' }} fontSize="inherit" />}
                        sx={{
                            fontSize: '2.2rem',
                            '& .MuiRating-iconFilled': { color: '#fbbf24' },
                            '& .MuiRating-iconHover': { color: '#f59e0b' },
                        }}
                    />
                    <Typography sx={{ color: '#fbbf24', fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', mt: 0.5 }}>
                        {ratingLabel}
                    </Typography>
                </Box>

                <Typography sx={{ mb: 1, color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Điều gì làm bạn ấn tượng ở người bán?
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                    {SUGGESTED_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                onClick={() => handleTagClick(tag)}
                                sx={{
                                    mb: 0.75,
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    height: 28,
                                    transition: 'all 0.2s ease',
                                    bgcolor: isSelected ? alpha('#A78BFA', 0.2) : 'rgba(255,255,255,0.04)',
                                    color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.5)',
                                    border: `1px solid ${isSelected ? alpha('#A78BFA', 0.4) : 'rgba(255,255,255,0.1)'}`,
                                    '&:hover': {
                                        bgcolor: isSelected ? alpha('#A78BFA', 0.3) : 'rgba(255,255,255,0.08)',
                                        transform: 'scale(1.04)',
                                    }
                                }}
                            />
                        );
                    })}
                </Stack>

                {/* Comment */}
                <TextField
                    fullWidth
                    placeholder="Chia sẻ thêm cảm nhận của bạn..."
                    multiline
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    variant="outlined"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '0.86rem',
                            bgcolor: 'rgba(255,255,255,0.03)',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                            '&.Mui-focused fieldset': { borderColor: '#A78BFA' }
                        },
                        '& .MuiInputBase-input': {
                            color: '#fff',
                        },
                        '& .MuiInputBase-input::placeholder': {
                            color: 'rgba(255,255,255,0.4)',
                            opacity: 1
                        }
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
                <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{
                        py: 1.2,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        // Bỏ logic ẩn màu
                        color: '#fff',
                        background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                        boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            boxShadow: '0 8px 28px rgba(139, 92, 246, 0.55)',
                            transform: 'translateY(-1px)'
                        },
                        '&.Mui-disabled': {
                            background: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.25)',
                            boxShadow: 'none'
                        }
                    }}
                >
                    {loading ? 'ĐANG GỬI...' : 'ĐÁNH GIÁ'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
