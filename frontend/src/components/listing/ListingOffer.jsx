import { Box, Button, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import OfferModal from './OfferModal';
import * as chatApi from '../../api/chatApi';
import { useAuth } from '../../hooks/useAuth';

const CARD_BG = '#201D26';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_SEC = 'rgba(255,255,255,0.55)';
const PURPLE = '#9D6EED';

export default function ListingOffer({ listing, onNotify }) {
    const { isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const [price, setPrice] = useState('');
    const [message, setMessage] = useState('Để cho mình giá này nhé sếp!');
    const [loading, setLoading] = useState(false);

    // Tự động mở popup nếu quay lại từ trang đăng nhập
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'makeOffer' && isAuthenticated) {
            setOpen(true);
            // Xóa action khỏi URL để tránh mở lại khi load trang
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [isAuthenticated]);

    const handleOpen = () => {
        if (!isAuthenticated) {
            const redirectUrl = encodeURIComponent(`${window.location.pathname}?action=makeOffer`);
            onNotify?.(
                'Bạn cần đăng nhập để thực hiện trả giá.',
                'warning',
                <Button
                    variant="contained"
                    size="small"
                    sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        ml: 2,
                        bgcolor: '#fff',
                        color: '#000',
                        borderRadius: '20px',
                        px: 2,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                    }}
                    onClick={() => window.location.href = `/login?redirect=${redirectUrl}`}
                >
                    Đăng nhập
                </Button>
            );
            return;
        }
        setOpen(true);
    };

    const handleSubmit = async () => {
        const numericPrice = Number(price);
        const originalPrice = listing?.price || 0;

        if (!numericPrice || numericPrice <= 0 || numericPrice >= originalPrice) {
            onNotify?.('Giá đề xuất không hợp lệ.', 'error');
            return;
        }

        setLoading(true);
        try {
            const offerRes = await chatApi.makeOfferByListing(listing.id, numericPrice);
            const offerMsg = offerRes?.data?.data ?? offerRes?.data;
            const sessionId = offerMsg?.sessionId;
            if (!sessionId) {
                throw new Error('Không tạo được phiên chat.');
            }

            // Optional note from buyer after offer is created.
            const note = String(message || '').trim();
            if (note) {
                await chatApi.sendMessage(sessionId, note, 'TEXT');
            }

            onNotify?.('Đã gửi giá đề xuất thành công!', 'success');
            setOpen(false);
        } catch (err) {
            onNotify?.(err?.response?.data?.message || 'Không thể gửi yêu cầu trả giá.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ 
            bgcolor: '#252230', 
            border: `1px solid ${PURPLE}33`, 
            borderRadius: '12px', // Đồng bộ với các khối khác
            p: 1.5,
            mt: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
                borderColor: 'rgba(157, 110, 237, 0.5)',
                bgcolor: 'rgba(157, 110, 237, 0.06)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
            }
        }}>
            <Box>
                <Typography fontSize={13} fontWeight={800} color={PURPLE} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Deal giá
                </Typography>
                <Typography fontSize={12} color={TEXT_SEC}>
                    Đề xuất giá tốt nhất cho bạn
                </Typography>
            </Box>

            <Button
                variant="contained"
                onClick={handleOpen}
                startIcon={<LocalOfferOutlinedIcon sx={{ fontSize: 18 }} />}
                sx={{
                    height: 40,
                    bgcolor: PURPLE,
                    color: '#fff',
                    borderRadius: '12px',
                    px: 3,
                    fontSize: 13,
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: `0 4px 15px rgba(157, 110, 237, 0.2)`,
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': {
                        bgcolor: '#8B5CF6',
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 25px rgba(157, 110, 237, 0.5)`, // Glow mạnh cho nút quan trọng
                    },
                    '&:active': { transform: 'translateY(0)' }
                }}
            >
                Trả giá ngay
            </Button>

            <OfferModal
                open={open}
                onClose={() => setOpen(false)}
                loading={loading}
                listing={listing}
                price={price}
                onPriceChange={setPrice}
                message={message}
                onMessageChange={setMessage}
                onSubmit={handleSubmit}
            />
        </Box>
    );
}
