import { useState } from 'react';
import { Box, Button, Card, Typography } from '@mui/material';

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
                    overflow: 'hidden',
                    maxHeight: isExpanded ? 'none' : '300px',
                    color: 'rgba(255,255,255,0.82)',
                    fontSize: 15,
                    lineHeight: 1.72,
                    '& p': { mb: 1.5, mt: 0 },
                    '& ul': { mb: 1.5, pl: 2.5 },
                    '& li': { mb: 0.6 },
                    '& img': { maxWidth: '100%', borderRadius: '8px', mt: 1, mb: 1.5 },
                    '& strong': { color: TEXT_PRI, fontWeight: 700 },
                    '& em': { color: '#FFC107' },
                }}
                dangerouslySetInnerHTML={{ __html: displayHtml }}
            />

            {/* Lớp phủ mờ (gradient) khi chưa mở rộng */}
            {!isExpanded && (
                <Box
                    sx={{
                        position: 'relative',
                        mt: -7,
                        height: 54,
                        background: `linear-gradient(rgba(32, 29, 38, 0), rgba(32, 29, 38, 1) 90%)`,
                        pointerEvents: 'none'
                    }}
                />
            )}

            {/* Nút Xem thêm / Thu gọn */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    disableRipple
                    sx={{
                        color: '#FFB300', // Amber color for high visibility
                        textTransform: 'none',
                        fontSize: 14,
                        fontWeight: 800,
                        transition: 'all 0.2s',
                        '&:hover': {
                            background: 'transparent',
                            color: '#FFD54F',
                            textDecoration: 'underline'
                        }
                    }}
                >
                    {isExpanded ? 'Thu gọn' : 'Xem thêm'}
                </Button>
            </Box>
        </Card>
    );
}
