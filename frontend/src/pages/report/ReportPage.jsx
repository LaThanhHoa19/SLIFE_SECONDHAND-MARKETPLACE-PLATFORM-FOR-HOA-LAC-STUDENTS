import { useMemo, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    TextField,
    Typography,
    Alert,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { createReport } from '../../api/reportApi';
import { useAuth } from '../../hooks/useAuth';

export default function ReportPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, user } = useAuth();

    const targetType = useMemo(() => {
        const raw = searchParams.get('targetType') || '';
        return raw.toUpperCase();
    }, [searchParams]);

    const targetId = useMemo(() => {
        const raw = searchParams.get('targetId');
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }, [searchParams]);

    const title = useMemo(() => {
        if (targetType === 'LISTING') return 'Báo cáo tin đăng';
        if (targetType === 'USER') return 'Báo cáo người dùng';
        return 'Báo cáo';
    }, [targetType]);

    const [reason, setReason] = useState('');
    const [evidenceImage, setEvidenceImage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const goBackAfterSuccess = () => {
        if (targetType === 'LISTING' && targetId) return navigate(`/listings/${targetId}`);
        if (targetType === 'USER' && targetId) return navigate(`/profile/${targetId}`);
        return navigate(-1);
    };

    const handleSubmit = async () => {
        setError('');
        if (!isAuthenticated || !user) {
            setError('Bạn cần đăng nhập để báo cáo.');
            return;
        }
        if (!targetType || !targetId) {
            setError('Thiếu thông tin đối tượng cần báo cáo.');
            return;
        }
        if (!reason.trim()) {
            setError('Vui lòng nhập lý do báo cáo.');
            return;
        }

        setSubmitting(true);
        try {
            await createReport({
                targetType,
                targetId,
                reason: reason.trim(),
                evidenceImage: evidenceImage.trim() || undefined,
            });
            goBackAfterSuccess();
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Gửi báo cáo thất bại.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!targetType || !targetId) {
        return (
            <Box sx={{ minHeight: '70vh', px: 2, py: 4 }}>
                <Paper sx={{ maxWidth: 720, mx: 'auto', p: 3, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                        {title}
                    </Typography>
                    <Alert severity="error">Thiếu query `targetType` / `targetId`.</Alert>
                    <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(-1)}>
                        Quay lại
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '70vh', px: 2, py: 4 }}>
            <Paper sx={{ maxWidth: 720, mx: 'auto', p: 3, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Vui lòng mô tả rõ ràng để hệ thống có thể xử lý báo cáo nhanh nhất.
                </Typography>

                {error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                ) : null}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Lý do báo cáo"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        fullWidth
                        multiline
                        minRows={4}
                    />

                    <TextField
                        label="Link bằng chứng (tùy chọn)"
                        value={evidenceImage}
                        onChange={(e) => setEvidenceImage(e.target.value)}
                        fullWidth
                        placeholder="Ví dụ: link ảnh, đoạn chat..."
                    />

                    <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                        <Button variant="outlined" disabled={submitting} onClick={() => navigate(-1)} sx={{ flex: 1 }}>
                            Hủy
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={submitting || !reason.trim()}
                            sx={{ flex: 1 }}
                        >
                            {submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Gửi báo cáo'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

