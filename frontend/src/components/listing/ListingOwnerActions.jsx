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

    const isSoldOrHidden = status === 'SOLD' || status === 'HIDDEN';

    return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Split Button Status Group */}
            <Box sx={{ 
                display: 'flex', width: '100%', borderRadius: '14px', 
                overflow: 'hidden', border: `1px solid ${BORDER}`, bgcolor: CARD_BG 
            }}>
                <Tooltip title={isSoldOrHidden ? "Đã đóng" : "Đánh dấu đã bán"}>
                    <Button
                        fullWidth
                        onClick={handleMarkSold}
                        disabled={submitting || isSoldOrHidden}
                        sx={{
                            py: 2.5, borderRadius: 0, border: 'none',
                            bgcolor: status === 'SOLD' ? 'rgba(46, 213, 115, 0.1)' : 'transparent',
                            color: status === 'SOLD' ? GREEN : TEXT_PRI,
                            borderRight: `1px solid ${BORDER}`,
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: CARD_BG2, color: GREEN },
                            '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(0,0,0,0.1)' }
                        }}
                    >
                        {submitting ? <CircularProgress size={24} color="inherit" /> : <CheckCircleIcon sx={{ fontSize: 36 }} />}
                    </Button>
                </Tooltip>

                <Tooltip title={isSoldOrHidden ? "Đã đóng" : "Ẩn bài đăng này"}>
                    <Button
                        fullWidth
                        onClick={handleHide}
                        disabled={submitting || isSoldOrHidden}
                        sx={{
                            py: 2.5, borderRadius: 0, border: 'none',
                            bgcolor: status === 'HIDDEN' ? 'rgba(255, 165, 2, 0.1)' : 'transparent',
                            color: status === 'HIDDEN' ? '#FFA502' : TEXT_PRI,
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: CARD_BG2, color: '#FFA502' },
                            '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)', bgcolor: 'rgba(0,0,0,0.1)' }
                        }}
                    >
                        {submitting ? <CircularProgress size={24} color="inherit" /> : <VisibilityOffIcon sx={{ fontSize: 36 }} />}
                    </Button>
                </Tooltip>
            </Box>

            {/* Edit Button */}
            <Tooltip title="Sửa nội dung tin">
                <Button
                    variant="outlined"
                    onClick={handleEdit}
                    sx={{
                        py: 2.5, borderRadius: '14px', border: `1px solid ${BORDER}`, bgcolor: CARD_BG,
                        color: TEXT_PRI, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: CARD_BG2, borderColor: PURPLE, color: PURPLE }
                    }}
                >
                    <EditIcon sx={{ fontSize: 36 }} />
                </Button>
            </Tooltip>
        </Box>
    );
}
