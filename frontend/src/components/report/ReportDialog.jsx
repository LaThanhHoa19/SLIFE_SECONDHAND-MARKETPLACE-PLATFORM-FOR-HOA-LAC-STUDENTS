import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
    Box
} from '@mui/material';
import { createReport } from '../../api/reportApi';
import { useToast } from '../../context/ToastContext';
import { DARK_DIALOG_PAPER_PROPS } from '../common/dialogStyles';

/**
 * Reusable Report Dialog for both Users and Listings.
 * 
 * @param {boolean} open - Dialog open state
 * @param {function} onClose - Function to close the dialog
 * @param {string} targetType - 'LISTING' or 'USER'
 * @param {string|number} targetId - ID of the target being reported
 * @param {string} targetTitle - Title or name of the target for display
 */
const ReportDialog = ({ open, onClose, targetType, targetId, targetTitle }) => {
    const [reason, setReason] = useState('');
    const [evidence, setEvidence] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async () => {
        if (!targetId || !reason.trim()) return;
        setSubmitting(true);
        try {
            await createReport({
                targetType,
                targetId,
                reason: reason.trim(),
                evidenceImage: evidence.trim() || undefined
            });
            showToast('Đã gửi báo cáo thành công.', 'success');
            setReason('');
            setEvidence('');
            onClose();
        } catch (err) {
            showToast(err?.message || 'Gửi báo cáo thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => !submitting && onClose()}
            maxWidth="xs"
            fullWidth
            PaperProps={DARK_DIALOG_PAPER_PROPS}
        >
            <DialogTitle sx={{ fontWeight: 700 }}>
                Báo cáo {targetType === 'LISTING' ? 'tin đăng' : 'người dùng'}
            </DialogTitle>
            <DialogContent dividers sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {targetTitle && (
                    <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 2 }}>
                        Bạn đang báo cáo: <strong>{targetTitle}</strong>
                    </Typography>
                )}
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Mô tả chi tiết lý do bạn báo cáo nội dung này.
                </Typography>
                <TextField
                    label="Lý do báo cáo"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                    sx={{
                        mb: 2,
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                        '& .MuiOutlinedInput-root': {
                            color: '#fff',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        }
                    }}
                    autoFocus
                />
                <TextField
                    label="Link bằng chứng (tùy chọn)"
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    fullWidth
                    placeholder="Ví dụ: link ảnh, đoạn chat..."
                    sx={{
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                        '& .MuiOutlinedInput-root': {
                            color: '#fff',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        }
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button 
                    onClick={onClose} 
                    sx={{ color: 'rgba(255,255,255,0.6)', textTransform: 'none' }}
                >
                    Hủy
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting || !reason.trim()}
                    sx={{
                        bgcolor: '#FF4757',
                        color: '#fff',
                        '&:hover': { bgcolor: '#FF6B81' },
                        '&.Mui-disabled': {
                            bgcolor: 'rgba(255, 71, 87, 0.3)',
                            color: 'rgba(255, 255, 255, 0.3)',
                        },
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3
                    }}
                >
                    {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReportDialog;
