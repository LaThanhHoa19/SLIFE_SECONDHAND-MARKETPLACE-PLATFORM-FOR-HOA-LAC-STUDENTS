import { useState } from 'react';
import { Box, Button, Card, Typography, alpha } from '@mui/material';

export const CARD_BG = '#201D26';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';

export default function ListingDescription({ description }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Nếu description rỗng thì show thông báo fallback thay vì mock data
    const displayHtml = description && description.trim().length > 0
        ? description
        : `<p style="color: rgba(255,255,255,0.4); font-style: italic;">Người rao không cung cấp mô tả chi tiết cho vật phẩm này.</p>`;

    return (
        <Card
            sx={{
                bgcolor: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: '14px',
                p: 1.5,
            }}
        >
            <Typography fontSize={16} fontWeight={700} color={TEXT_PRI} sx={{ mb: 1.5 }}>
                Mô tả chi tiết
            </Typography>

            <Box
                sx={{
                    position: 'relative',
                    maxHeight: isExpanded ? 'none' : '200px',
                    transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: 15,
                        lineHeight: 1.8,
                        whiteSpace: 'pre-wrap', // Fix for line breaks
                        wordBreak: 'break-word',
                        '& p': { mb: 1.5, mt: 0 },
                        '& ul': { mb: 1.5, pl: 2.5 },
                        '& li': { mb: 0.6 },
                        '& img': { maxWidth: '100%', borderRadius: '12px', mt: 1, mb: 1.5, display: 'block' },
                        '& strong': { color: '#fff', fontWeight: 700 },
                        '& em': { color: '#FFC107', fontStyle: 'italic' },
                    }}
                    dangerouslySetInnerHTML={{ __html: displayHtml }}
                />

                {/* Lớp phủ mờ (gradient) khi chưa mở rộng - CHỈ hiện khi chưa expand và nội dung dài */}
                {!isExpanded && displayHtml.length > 250 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 100,
                            background: `linear-gradient(to bottom, transparent 0%, #201D26 90%)`,
                            pointerEvents: 'none',
                            zIndex: 1
                        }}
                    />
                )}
            </Box>

            {/* Nút Xem thêm / Thu gọn - Premium Style */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, position: 'relative', zIndex: 2 }}>
                <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    variant="contained"
                    sx={{
                        bgcolor: alpha(PURPLE, 0.1),
                        color: PURPLE,
                        borderRadius: '20px',
                        px: 4,
                        py: 0.8,
                        fontSize: 13,
                        fontWeight: 700,
                        textTransform: 'none',
                        border: `1px solid ${alpha(PURPLE, 0.3)}`,
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        '&:hover': {
                            bgcolor: PURPLE,
                            color: '#fff',
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 20px ${alpha(PURPLE, 0.4)}`,
                            borderColor: PURPLE
                        },
                        '&:active': { transform: 'scale(0.95)' }
                    }}
                >
                    {isExpanded ? 'Thu gọn nội dung' : 'Xem thêm mô tả'}
                </Button>
            </Box>
        </Card>
    );
}
