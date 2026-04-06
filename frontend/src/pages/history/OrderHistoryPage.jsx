import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Container,
    Stack,
    CircularProgress,
    IconButton,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    History as HistoryIcon,
    StorefrontOutlined as ShoppingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { listMyDeals, finalizeDeal, submitDealReview } from '../../api/dealApi';
import DealCard from '../../components/history/DealCard';
import RatingModal from '../../components/common/RatingModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

export default function OrderHistoryPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Rating Modal State
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [ratingOpen, setRatingOpen] = useState(false);
    
    // Complete Confirm State
    const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);

    // Cancel Dialog State
    const [cancelOpen, setCancelOpen] = useState(false);
    const [dealToCancel, setDealToCancel] = useState(null);

    const fetchDeals = useCallback(async () => {
        try {
            setLoading(true);
            const response = await listMyDeals('proposed');
            const rawData = response.data?.data || response.data || [];
            
            const historyStatuses = ['COMPLETED', 'SUCCESS', 'CANCELLED'];
            const filteredDeals = rawData.filter(d => historyStatuses.includes(d.status));
            
            const sortedDeals = [...filteredDeals].sort((a, b) => {
                if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return -1;
                if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            setDeals(sortedDeals);
        } catch (error) {
            console.error('Failed to fetch deals:', error);
            showToast('Không thể tải lịch sử chốt đơn', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchDeals();
    }, [fetchDeals]);

    // BƯỚC 1: Buyer nhấn "Đã nhận hàng" -> Hiện xác nhận
    const handleCompleteClick = (deal) => {
        setSelectedDeal(deal);
        setCompleteConfirmOpen(true);
    };

    const handleRateClick = (deal) => {
        setSelectedDeal(deal);
        setRatingOpen(true);
    };

    // BƯỚC 2: Buyer Xác nhận trong Popup -> Chuyển trạng thái ngay
    const handleCompleteConfirm = async () => {
        if (!selectedDeal) return;
        try {
            setActionLoading(true);
            await finalizeDeal(selectedDeal.dealId, {
                completed: true
            });
            showToast('Đã xác nhận nhận hàng thành công! Tin đăng của người bán đã chuyển sang trạng thái Đã bán.', 'success');
            setCompleteConfirmOpen(false);
            
            // Cập nhật lại danh sách để hiện badge SUCCESS
            await fetchDeals();
            
            // BƯỚC 3: Sau khi chốt xong, tự động hiện Modal đánh giá (có thể skip)
            setRatingOpen(true);
        } catch (error) {
            console.error('Finalize failed:', error);
            showToast('Không thể hoàn thành giao dịch. Vui lòng thử lại!', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // BƯỚC 4: Xử lý lưu Đánh giá riêng biệt (deal đã SUCCESS)
    const handleRatingSubmit = async (ratingData) => {
        if (!selectedDeal) return;
        try {
            setActionLoading(true);
            // Gọi endpoint /review riêng, KHÔNG finalize lại
            await submitDealReview(selectedDeal.dealId, ratingData);
            showToast('Cảm ơn bạn đã để lại đánh giá!', 'success');
            setRatingOpen(false);
            fetchDeals(); // Refresh để ẩn nút đánh giá
        } catch (error) {
            console.error('Rating failed:', error);
            showToast('Không thể gửi đánh giá. Vui lòng thử lại!', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelClick = (deal) => {
        setDealToCancel(deal);
        setCancelOpen(true);
    };

    const handleCancelConfirm = async () => {
        if (!dealToCancel) return;
        try {
            setActionLoading(true);
            await finalizeDeal(dealToCancel.dealId, {
                completed: false
            });
            showToast('Đã hủy chốt đơn thành công', 'success');
            setCancelOpen(false);
            fetchDeals();
        } catch (error) {
            console.error('Cancel failed:', error);
            showToast('Có lỗi xảy ra khi hủy giao dịch', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            bgcolor: 'transparent',
            py: { xs: 2.5, md: 3.5 },
            px: { xs: 0, sm: 0 },
        }}>
            <Container maxWidth={1360}>
                {/* Header Section — Identical to MyListings style */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        fontSize={{ xs: 24, md: 30 }}
                        fontWeight={800}
                        color="#fff"
                        sx={{ letterSpacing: '-0.04em', lineHeight: 1.12 }}
                    >
                        Lịch sử chốt đơn
                    </Typography>
                    <Typography fontSize={14} lineHeight={1.55} color="rgba(255,255,255,0.45)" sx={{ mt: 1, maxWidth: 640 }}>
                        Theo dõi lịch sử mua hàng, xác nhận nhận hàng và đánh giá người bán để tích lũy uy tín cho cộng đồng.
                    </Typography>
                </Box>

                {/* Content List */}
                {loading ? (
                    <Box sx={{ display: 'grid', placeItems: 'center', py: 12 }}>
                        <CircularProgress sx={{ color: '#A78BFA' }} size={48} thickness={5} />
                        <Typography variant="body2" color="rgba(255,255,255,0.3)" sx={{ mt: 3, fontWeight: 700 }}>
                            ĐANG TÌM KIẾM GIAO DỊCH...
                        </Typography>
                    </Box>
                ) : deals.length > 0 ? (
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2.5,
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                    md: 'repeat(3, 1fr)',
                                    lg: 'repeat(4, 1fr)',
                                },
                            }}
                        >
                            {deals.map(deal => (
                                <DealCard 
                                    key={deal.dealId} 
                                    deal={deal} 
                                    onComplete={handleCompleteClick}
                                    onCancel={handleCancelClick}
                                    onRate={handleRateClick}
                                />
                            ))}
                        </Box>
                ) : (
                    <Box sx={{ 
                        textAlign: 'center', 
                        py: 15, 
                        px: 4, 
                        borderRadius: '32px', 
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '2px dashed rgba(255,255,255,0.05)',
                    }}>
                        <Box sx={{ 
                            width: 100, height: 100, 
                            borderRadius: '30px', 
                            bgcolor: 'rgba(167, 139, 250, 0.05)',
                            display: 'grid', placeItems: 'center',
                            mx: 'auto', mb: 3
                        }}>
                            <ShoppingIcon sx={{ fontSize: 48, color: 'rgba(167, 139, 250, 0.2)' }} />
                        </Box>
                        <Typography variant="h5" color="rgba(255,255,255,0.4)" fontWeight={900} sx={{ letterSpacing: '-0.02em', mb: 1 }}>
                            Trống không!
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.2)" sx={{ maxWidth: 300, mx: 'auto', fontWeight: 600 }}>
                            Tất cả các giao dịch bạn chốt trong chat sẽ xuất hiện tại đây để bạn tiện theo dõi.
                        </Typography>
                    </Box>
                )}

                {/* Modals & Dialogs */}
                
                {/* 1. Popup xác nhận đã nhận hàng */}
                <ConfirmDialog
                    open={completeConfirmOpen}
                    variant="info"
                    title="Xác nhận nhận hàng?"
                    content={
                        <span>
                            Bạn xác nhận đã nhận được sản phẩm từ <strong>{selectedDeal?.sellerName}</strong> và đồng ý kết thúc giao dịch này?
                        </span>
                    }
                    confirmLabel="Đã nhận hàng"
                    onConfirm={handleCompleteConfirm}
                    onClose={() => setCompleteConfirmOpen(false)}
                    loading={actionLoading}
                />

                {/* 2. Modal đánh giá (hiện sau khi đã confirm nhận hàng) */}
                <RatingModal
                    open={ratingOpen}
                    onClose={() => setRatingOpen(false)}
                    onConfirm={handleRatingSubmit}
                    loading={actionLoading}
                    sellerName={selectedDeal?.sellerName}
                />

                {/* 3. Popup xác nhận hủy */}
                <ConfirmDialog
                    open={cancelOpen}
                    variant="warning"
                    title="Xác nhận hủy chốt đơn?"
                    content={
                        <span>
                            <strong>Bạn sẽ không thể đánh giá {dealToCancel?.sellerName || 'người bán'}</strong> nếu hủy giao dịch này.
                        </span>
                    }
                    confirmLabel="Xác nhận hủy"
                    onConfirm={handleCancelConfirm}
                    onClose={() => setCancelOpen(false)}
                    loading={actionLoading}
                />
            </Container>
        </Box>
    );
}
