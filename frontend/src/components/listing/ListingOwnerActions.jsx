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
            // Redirect to profile/listings instead of reload to prevent further interaction
            navigate('/profile', { state: { activeTab: 'listings' } });
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
            navigate('/profile', { state: { activeTab: 'listings' } });
        } catch (err) {
            onNotify(err?.message || 'Không thể ẩn tin', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const isSoldOrHidden = status === 'SOLD' || status === 'HIDDEN';

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
            {/* Mark Sold Button */}
            <Tooltip title={isSoldOrHidden ? "Đã đóng" : "Đánh dấu đã bán"}>
                <Button
                    variant="outlined"
                    onClick={handleMarkSold}
                    disabled={submitting || isSoldOrHidden}
                    sx={{
                        py: 2, borderRadius: '12px', border: `1px solid ${BORDER}`, 
                        bgcolor: status === 'SOLD' ? 'rgba(46, 213, 115, 0.1)' : CARD_BG,
                        color: status === 'SOLD' ? GREEN : TEXT_PRI, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: CARD_BG2, borderColor: GREEN, color: GREEN }
                    }}
                >
                    {submitting ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        <CheckCircleIcon sx={{ fontSize: 28 }} />
                    )}
                </Button>
            </Tooltip>

            {/* Hide Button */}
            <Tooltip title={isSoldOrHidden ? "Đã đóng" : "Ẩn bài đăng này"}>
                <Button
                    variant="outlined"
                    onClick={handleHide}
                    disabled={submitting || isSoldOrHidden}
                    sx={{
                        py: 2, borderRadius: '12px', border: `1px solid ${BORDER}`, 
                        bgcolor: status === 'HIDDEN' ? 'rgba(255, 165, 2, 0.1)' : CARD_BG,
                        color: status === 'HIDDEN' ? '#FFA502' : TEXT_PRI, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: CARD_BG2, borderColor: '#FFA502', color: '#FFA502' }
                    }}
                >
                    {submitting ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : (
                        <VisibilityOffIcon sx={{ fontSize: 28 }} />
                    )}
                </Button>
            </Tooltip>

            {/* Edit Button */}
            <Tooltip title="Sửa nội dung tin">
                <Button
                    variant="outlined"
                    onClick={handleEdit}
                    sx={{
                        py: 2, borderRadius: '12px', border: `1px solid ${BORDER}`, bgcolor: CARD_BG,
                        color: TEXT_PRI, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: CARD_BG2, borderColor: PURPLE, color: PURPLE }
                    }}
                >
                    <EditIcon sx={{ fontSize: 28 }} />
                </Button>
            </Tooltip>
        </Box>
    );
}
