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
    Favorite as HeartIcon 
} from '@mui/icons-material';

const SUGGESTED_TAGS = [
    'Thái độ thân thiện',
    'Đến đúng giờ',
    'Sản phẩm như mô tả',
    'Giao dịch nhanh chóng'
];

export default function RatingModal({ open, onClose, onConfirm, loading }) {
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
        onConfirm({
            rating,
            comment,
            tags: selectedTags
        });
    };

    const handleClose = () => {
        if (!loading) {
            setRating(5);
            setComment('');
            setSelectedTags([]);
            onClose();
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '28px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                    background: 'linear-gradient(135deg, #161822 0%, #1e202a 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    p: 1
                }
            }}
        >
            <DialogTitle sx={{ m: 0, px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight={950} color="#fff" sx={{ letterSpacing: '-0.04em' }}>
                    Đánh giá <HeartIcon sx={{ verticalAlign: 'middle', ml: 1, color: '#FF6B6B' }} />
                </Typography>
                <IconButton 
                    onClick={handleClose} 
                    disabled={loading}
                    sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 3 }}>
                    <Rating
                        value={rating}
                        onChange={(event, newValue) => setRating(newValue)}
                        size="large"
                        emptyIcon={<StarIcon style={{ opacity: 0.1, color: '#fff' }} fontSize="inherit" />}
                        sx={{
                            fontSize: '3.5rem',
                            '& .MuiRating-iconFilled': { color: '#fbbf24' },
                            '& .MuiRating-iconHover': { color: '#f59e0b' },
                        }}
                    />
                    <Typography variant="h6" sx={{ mt: 2, color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {rating === 5 ? 'TUYỆT VỜI!' : rating >= 4 ? 'HÀI LÒNG' : rating >= 3 ? 'ỔN' : rating >= 2 ? 'KÉM' : 'RẤT TỆ'}
                    </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        Bạn ấn tượng điều gì ở người bán?
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {SUGGESTED_TAGS.map((tag) => {
                            const isSelected = selectedTags.includes(tag);
                            return (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    onClick={() => handleTagClick(tag)}
                                    sx={{
                                        mb: 1,
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        bgcolor: isSelected ? alpha('#A78BFA', 0.2) : 'rgba(255,255,255,0.03)',
                                        color: isSelected ? '#A78BFA' : 'rgba(255,255,255,0.5)',
                                        border: `1px solid ${isSelected ? alpha('#A78BFA', 0.4) : 'rgba(255,255,255,0.1)'}`,
                                        '&:hover': {
                                            bgcolor: isSelected ? alpha('#A78BFA', 0.3) : 'rgba(255,255,255,0.06)',
                                            transform: 'scale(1.05)',
                                        }
                                    }}
                                />
                            );
                        })}
                    </Stack>
                </Box>

                <TextField
                    fullWidth
                    label="Chia sẻ thêm cảm nhận của bạn..."
                    multiline
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    variant="outlined"
                    slotProps={{
                        input: {
                            sx: {
                                borderRadius: '16px',
                                color: '#fff',
                                bgcolor: 'rgba(255,255,255,0.02)',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                '&.Mui-focused fieldset': { borderColor: '#A78BFA' }
                            }
                        },
                        inputLabel: {
                            sx: { color: 'rgba(255,255,255,0.4)', '&.Mui-focused': { color: '#A78BFA' } }
                        }
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 4, pt: 0 }}>
                <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{
                        py: 1.8,
                        borderRadius: '16px',
                        textTransform: 'none',
                        fontWeight: 900,
                        fontSize: '1rem',
                        background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                        boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.5)',
                            transform: 'translateY(-2px)'
                        }
                    }}
                >
                    {loading ? 'ĐANG GỬI...' : 'GỬI ĐÁNH GIÁ NGAY'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
