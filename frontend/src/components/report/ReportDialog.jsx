import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
    Box,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { createReport, uploadReportImage } from '../../api/reportApi';
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
    const [evidenceImageUrl, setEvidenceImageUrl] = useState('');
    const [evidencePreviewUrl, setEvidencePreviewUrl] = useState('');
    const [uploadingEvidence, setUploadingEvidence] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();

    const normalizedTargetType = String(targetType || '').toUpperCase();
    const targetLabel =
        normalizedTargetType === 'LISTING'
            ? 'tin đăng'
            : normalizedTargetType === 'COMMUNITY_POST'
                ? 'bài cộng đồng'
                : 'người dùng';

    const resolveErrorMessage = (err) => {
        const serverMessage = String(err?.response?.data?.message || err?.message || '').trim();
        if (serverMessage) {
            const lowered = serverMessage.toLowerCase();
            if (lowered.includes('already') || lowered.includes('exist') || lowered.includes('đã báo cáo')) {
                return `Bạn đã báo cáo ${targetLabel} này trước đó.`;
            }
            if (lowered.includes('forbidden') || lowered.includes('unauthorized')) {
                return 'Bạn không có quyền thực hiện báo cáo này.';
            }
            if (lowered.includes('not found') || lowered.includes('không tồn tại')) {
                return `${targetLabel.charAt(0).toUpperCase() + targetLabel.slice(1)} không còn tồn tại.`;
            }
        }
        return `Gửi báo cáo ${targetLabel} thất bại. Vui lòng thử lại.`;
    };

    const validateImageFile = (file) => {
        if (!file) return 'Không tìm thấy tệp ảnh.';
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(String(file.type || '').toLowerCase())) {
            return 'Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.';
        }
        if (file.size > 5 * 1024 * 1024) {
            return 'Ảnh bằng chứng không được vượt quá 5MB.';
        }
        return '';
    };

    const handleEvidenceChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const validationError = validateImageFile(file);
        if (validationError) {
            showToast(validationError, 'warning');
            return;
        }

        setUploadingEvidence(true);
        try {
            const res = await uploadReportImage(file);
            const payload = res?.data?.data ?? res?.data;
            const uploadedUrl = payload?.imageUrl || '';
            if (!uploadedUrl) {
                showToast('Upload ảnh thất bại. Vui lòng thử lại.', 'error');
                return;
            }
            setEvidenceImageUrl(uploadedUrl);
            setEvidencePreviewUrl(URL.createObjectURL(file));
            showToast('Đã tải ảnh bằng chứng thành công.', 'success');
        } catch {
            showToast('Upload ảnh thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setUploadingEvidence(false);
        }
    };

    const handleRemoveEvidence = () => {
        if (evidencePreviewUrl) {
            try { URL.revokeObjectURL(evidencePreviewUrl); } catch { /* ignore */ }
        }
        setEvidencePreviewUrl('');
        setEvidenceImageUrl('');
    };

    const handleSubmit = async () => {
        if (!targetId || !reason.trim()) return;
        if (uploadingEvidence) {
            showToast('Vui lòng chờ tải xong ảnh bằng chứng.', 'warning');
            return;
        }
        setSubmitting(true);
        try {
            await createReport({
                targetType,
                targetId,
                reason: reason.trim(),
                evidenceImage: evidenceImageUrl || undefined
            });
            showToast(`Đã gửi báo cáo ${targetLabel} thành công.`, 'success');
            setReason('');
            handleRemoveEvidence();
            onClose();
        } catch (err) {
            showToast(resolveErrorMessage(err), 'error');
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
                Báo cáo {targetLabel}
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
                <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mb: 1 }}>
                        Ảnh bằng chứng (tùy chọn)
                    </Typography>
                    <Button
                        component="label"
                        variant="outlined"
                        disabled={uploadingEvidence || submitting}
                        sx={{
                            textTransform: 'none',
                            borderColor: 'rgba(255,255,255,0.25)',
                            color: 'rgba(255,255,255,0.88)',
                            '&:hover': { borderColor: 'rgba(255,255,255,0.45)' },
                        }}
                    >
                        {uploadingEvidence ? 'Đang tải ảnh...' : (evidenceImageUrl ? 'Đổi ảnh bằng chứng' : 'Tải ảnh bằng chứng')}
                        <input hidden type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={handleEvidenceChange} />
                    </Button>

                    {evidencePreviewUrl && (
                        <Box sx={{ mt: 1.25, position: 'relative', width: 132, height: 132, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <img src={evidencePreviewUrl} alt="evidence-preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <IconButton
                                size="small"
                                onClick={handleRemoveEvidence}
                                sx={{
                                    position: 'absolute',
                                    top: 6,
                                    right: 6,
                                    bgcolor: 'rgba(0,0,0,0.55)',
                                    color: '#fff',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    )}
                </Box>
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
                    disabled={submitting || uploadingEvidence || !reason.trim()}
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
