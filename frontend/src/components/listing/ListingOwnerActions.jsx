import { Box, Button, CircularProgress, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { markSold, hideListing } from '../../api/listingApi';

const CARD_BG = '#201D26';
const CARD_BG2 = '#252230';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_PRI = 'rgba(255,255,255,0.95)';
const PURPLE = '#9D6EED';
const GREEN = '#2ED573';

export default function ListingOwnerActions({ listingId, onNotify, status }) {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const handleEdit = () => {
        navigate(`/listings/${listingId}/edit`);
    };

    const handleMarkSold = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await markSold(listingId);
            onNotify('Đã đánh dấu đã bán thành công', 'success');
            // Redirect to my-listings instead of profile to prevent further interaction
            navigate('/my-listings?status=SOLD');
        } catch (err) {
            onNotify(err?.message || 'Không thể đánh dấu đã bán', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleHide = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await hideListing(listingId);
            onNotify('Đã ẩn tin thành công', 'success');
            navigate('/my-listings?status=HIDDEN');
        } catch (err) {
            onNotify(err?.message || 'Không thể ẩn tin', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const normalizedStatus = String(status || '').toUpperCase();
    const isSoldOrHidden = normalizedStatus === 'SOLD' || normalizedStatus === 'HIDDEN' || normalizedStatus === 'MOD_HIDDEN';

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 2, my: 2.5 }}>
            {/* Single Hide Button with Confirmation */}
            <Button
                fullWidth
                onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn ẩn tin bài này này không? Các bài đăng bị ẩn sẽ không hiển thị trên bảng tin.')) {
                        handleHide();
                    }
                }}
                disabled={submitting || isSoldOrHidden}
                sx={{
                    py: 1.5,
                    borderRadius: '12px',
                    border: `1px solid ${(normalizedStatus === 'HIDDEN' || normalizedStatus === 'MOD_HIDDEN') ? '#FFA502' : BORDER}`,
                    bgcolor: (normalizedStatus === 'HIDDEN' || normalizedStatus === 'MOD_HIDDEN') ? 'rgba(255, 165, 2, 0.1)' : '#252230',
                    color: (normalizedStatus === 'HIDDEN' || normalizedStatus === 'MOD_HIDDEN') ? '#FFA502' : TEXT_PRI,
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: 'none',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': { 
                        bgcolor: 'rgba(157, 110, 237, 0.05)', 
                        borderColor: 'rgba(157, 110, 237, 0.8)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                    },
                    '&:active': { transform: 'translateY(0)' },
                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)', bgcolor: 'rgba(0,0,0,0.1)', borderColor: 'transparent' }
                }}
            >
                {submitting ? <CircularProgress size={20} color="inherit" /> : 'Ẩn tin / Đã bán'}
            </Button>

            {/* Edit Button with Premium Glow */}
            <Button
                variant="contained"
                onClick={handleEdit}
                startIcon={<EditIcon />}
                sx={{
                    py: 1.5, 
                    borderRadius: '12px', 
                    bgcolor: PURPLE, 
                    color: '#fff',
                    fontSize: 15, 
                    fontWeight: 700,
                    textTransform: 'none',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': { 
                        bgcolor: '#835cd4',
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 25px rgba(157, 110, 237, 0.4)`,
                    },
                    '&:active': { transform: 'translateY(0)' }
                }}
            >
                Sửa tin
            </Button>
        </Box>
    );
}
