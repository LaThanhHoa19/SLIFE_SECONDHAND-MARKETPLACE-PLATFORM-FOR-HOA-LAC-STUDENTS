import { Box, Button, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hideListing } from '../../api/listingApi';
import ConfirmDialog from '../common/ConfirmDialog';

const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_PRI = 'rgba(255,255,255,0.95)';
const PURPLE = '#9D6EED';

export default function ListingOwnerActions({ listingId, onNotify, status }) {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [confirmHideOpen, setConfirmHideOpen] = useState(false);

    const handleEdit = () => {
        navigate(`/listings/${listingId}/edit`);
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
                onClick={() => setConfirmHideOpen(true)}
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
                {submitting ? <CircularProgress size={20} color="inherit" /> : 'Ẩn tin'}
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
            <ConfirmDialog
                open={confirmHideOpen}
                variant="warning"
                title="Xác nhận ẩn tin"
                content="Bạn có chắc chắn muốn ẩn tin bài này không? Tin bị ẩn sẽ không hiển thị trên bảng tin."
                confirmLabel="Ẩn tin"
                cancelLabel="Hủy"
                loading={submitting}
                onClose={() => {
                    if (!submitting) setConfirmHideOpen(false);
                }}
                onConfirm={async () => {
                    await handleHide();
                    setConfirmHideOpen(false);
                }}
            />
        </Box>
    );
}
