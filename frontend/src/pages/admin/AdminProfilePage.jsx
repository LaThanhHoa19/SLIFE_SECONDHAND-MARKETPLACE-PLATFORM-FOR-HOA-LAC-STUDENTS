/** Mục đích: Trang profile của admin. */
import { useCallback, useEffect, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../hooks/useAuth';
import * as userApi from '../../api/userApi';
import { fullImageUrl } from '../../utils/constants';
import { unwrapApiData } from '../../utils/apiPayload';

const textFieldSx = {
    '& .MuiInputBase-input': { color: '#fff' },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.55)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#a78bfa' },
    '& .MuiOutlinedInput-root': {
        bgcolor: '#2a2733',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
        '&:hover fieldset': { borderColor: 'rgba(167,139,250,0.45)' },
        '&.Mui-focused fieldset': { borderColor: '#a78bfa' },
    },
    '& .MuiFormHelperText-root': { color: '#f87171' },
};

function formatRole(role) {
    if (role === 'ADMIN') return 'Quản trị viên (ADMIN)';
    if (role === 'MODERATOR') return 'Điều hành (MODERATOR)';
    if (!role) return '—';
    return String(role);
}

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
}

function InfoRow({ label, value }) {
    return (
        <Box
            sx={{
                py: 1.25,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.25, sm: 2 },
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                '&:last-of-type': { borderBottom: 'none' },
            }}
        >
            <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.5)', minWidth: { sm: 160 }, flexShrink: 0 }}
            >
                {label}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.92)', wordBreak: 'break-word' }}>
                {value ?? '—'}
            </Typography>
        </Box>
    );
}

const MIN_PASSWORD_LEN = 8;
const PROFILE_BIO_MAX = 500;
const PROFILE_PHONE_10_RE = /^\d{10}$/;

export default function AdminProfilePage() {
    const { user, updateUser: updateAuthUser } = useAuth() || {};
    const displayName = user?.fullName || user?.name || 'Admin User';
    const initial = (displayName || 'A').charAt(0).toUpperCase();

    const email = user?.email;
    const phone = user?.phoneNumber ?? user?.phone;
    const roleLabel = formatRole(user?.role);
    const memberSince = formatDate(user?.createdAt ?? user?.created_at);

    const [pwdOpen, setPwdOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwdErrors, setPwdErrors] = useState({});
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    const [profileEditOpen, setProfileEditOpen] = useState(false);
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        phone: '',
        bio: '',
    });
    const [profileErrors, setProfileErrors] = useState({});
    const [profileSaving, setProfileSaving] = useState(false);
    /** Sau khi Lưu trong popup (mock) — dùng để hiển thị bio (và mở lại form) đồng bộ với popup. */
    const [lastSavedProfile, setLastSavedProfile] = useState(null);

    useEffect(() => {
        setLastSavedProfile(null);
    }, [user?.id]);

    const bioForDisplay =
        (lastSavedProfile?.bio !== undefined ? lastSavedProfile.bio : user?.bio)?.trim() || undefined;

    const resetPwdForm = useCallback(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPwdErrors({});
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
    }, []);

    const closePwdDialog = useCallback(() => {
        setPwdOpen(false);
        resetPwdForm();
    }, [resetPwdForm]);

    const validatePasswordForm = useCallback(() => {
        const next = {};
        if (!currentPassword.trim()) next.currentPassword = 'Nhập mật khẩu hiện tại.';
        if (!newPassword.trim()) next.newPassword = 'Nhập mật khẩu mới.';
        else if (newPassword.length < MIN_PASSWORD_LEN)
            next.newPassword = `Mật khẩu mới tối thiểu ${MIN_PASSWORD_LEN} ký tự.`;
        if (!confirmPassword.trim()) next.confirmPassword = 'Nhập lại mật khẩu mới.';
        else if (newPassword !== confirmPassword) next.confirmPassword = 'Mật khẩu xác nhận không khớp.';
        if (currentPassword && newPassword && currentPassword === newPassword)
            next.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
        setPwdErrors(next);
        return Object.keys(next).length === 0;
    }, [currentPassword, newPassword, confirmPassword]);

    const handleSubmitPassword = useCallback(
        (e) => {
            e?.preventDefault?.();
            if (!validatePasswordForm()) return;
            setSnackbar({ open: true, message: 'Đã cập nhật mật khẩu (mock — chưa gọi API).' });
            closePwdDialog();
        },
        [validatePasswordForm, closePwdDialog],
    );

    const openProfileEdit = useCallback(() => {
        setProfileForm({
            fullName: lastSavedProfile?.fullName ?? user?.fullName ?? user?.name ?? '',
            phone: lastSavedProfile?.phone ?? user?.phoneNumber ?? user?.phone ?? '',
            bio:
                lastSavedProfile?.bio !== undefined ? lastSavedProfile.bio : (user?.bio ?? ''),
        });
        setProfileErrors({});
        setProfileEditOpen(true);
    }, [user, lastSavedProfile]);

    const closeProfileEdit = useCallback(() => {
        setProfileEditOpen(false);
    }, []);

    const validateProfileForm = useCallback(() => {
        const next = {};
        if (!profileForm.fullName?.trim()) next.fullName = 'Nhập họ tên.';
        const ph = profileForm.phone?.trim();
        if (ph && !PROFILE_PHONE_10_RE.test(ph)) next.phone = 'Số điện thoại phải đúng 10 chữ số.';
        if (profileForm.bio && profileForm.bio.length > PROFILE_BIO_MAX)
            next.bio = `Tối đa ${PROFILE_BIO_MAX} ký tự.`;
        setProfileErrors(next);
        return Object.keys(next).length === 0;
    }, [profileForm]);

    const handleSubmitProfileEdit = useCallback(
        async (e) => {
            e?.preventDefault?.();
            if (!validateProfileForm()) return;
            setProfileSaving(true);
            try {
                const payload = {
                    fullName: profileForm.fullName.trim(),
                    phoneNumber: profileForm.phone?.trim() ?? '',
                    bio: profileForm.bio?.trim() ?? '',
                };
                const res = await userApi.updateUser(payload);
                const updated = unwrapApiData(res) ?? payload;

                setLastSavedProfile({
                    fullName: updated?.fullName ?? payload.fullName,
                    phone: updated?.phoneNumber ?? updated?.phone ?? payload.phoneNumber,
                    bio: updated?.bio ?? payload.bio,
                });
                if (updateAuthUser) updateAuthUser(updated);

                setSnackbar({ open: true, message: 'Đã lưu hồ sơ.' });
                closeProfileEdit();
            } catch (err) {
                setSnackbar({
                    open: true,
                    message: err?.message || err?.raw?.response?.data?.message || 'Cập nhật hồ sơ thất bại.',
                });
            } finally {
                setProfileSaving(false);
            }
        },
        [validateProfileForm, closeProfileEdit, profileForm, updateAuthUser],
    );

    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', mb: 3 }}>
                Hồ sơ quản trị viên
            </Typography>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#19191B',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Avatar
                    src={fullImageUrl(user?.avatarUrl || user?.avatar)}
                    sx={{
                        width: 64,
                        height: 64,
                        bgcolor: 'rgba(139,92,246,0.2)',
                        color: '#8B5CF6',
                        fontWeight: 700,
                        fontSize: 24,
                    }}
                >
                    {initial}
                </Avatar>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
                        {displayName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Quản trị viên
                    </Typography>
                    {user?.email && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
                            {user.email}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3, mb: 2 }} alignItems={{ sm: 'center' }}>
                <Button
                    variant="outlined"
                    startIcon={<EditOutlinedIcon />}
                    onClick={openProfileEdit}
                    sx={{
                        alignSelf: { xs: 'stretch', sm: 'flex-start' },
                        borderColor: 'rgba(167,139,250,0.5)',
                        color: '#e9d5ff',
                        '&:hover': { borderColor: '#a78bfa', bgcolor: 'rgba(167,139,250,0.08)' },
                    }}
                >
                    Chỉnh sửa hồ sơ
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<LockOutlinedIcon />}
                    onClick={() => setPwdOpen(true)}
                    sx={{
                        alignSelf: { xs: 'stretch', sm: 'flex-start' },
                        borderColor: 'rgba(167,139,250,0.5)',
                        color: '#e9d5ff',
                        '&:hover': { borderColor: '#a78bfa', bgcolor: 'rgba(167,139,250,0.08)' },
                    }}
                >
                    Đổi mật khẩu
                </Button>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                    Chi tiết tài khoản và form đổi mật khẩu phía dưới (mock, chưa gọi API).
                </Typography>
            </Stack>

            <Box
                sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: '#19191B',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, fontWeight: 700 }}>
                    Chi tiết tài khoản
                </Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1 }} />
                <Grid container>
                    <Grid item xs={12} md={6}>
                        <InfoRow label="Email" value={email} />
                        <InfoRow label="Số điện thoại" value={phone} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <InfoRow label="Vai trò (hệ thống)" value={roleLabel} />
                        <InfoRow label="Tham gia" value={memberSince} />
                    </Grid>
                    <Grid item xs={12}>
                        <InfoRow label="Giới thiệu (bio)" value={bioForDisplay} />
                    </Grid>
                </Grid>
            </Box>

            <Dialog
                open={profileEditOpen}
                onClose={closeProfileEdit}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: '#25232C',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Chỉnh sửa hồ sơ</DialogTitle>
                <form onSubmit={handleSubmitProfileEdit}>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                                Thay đổi sẽ được lưu vào tài khoản hiện tại.
                            </Typography>
                            <TextField
                                label="Họ và tên"
                                value={profileForm.fullName}
                                onChange={(e) => {
                                    setProfileForm((f) => ({ ...f, fullName: e.target.value }));
                                    if (profileErrors.fullName) setProfileErrors((er) => ({ ...er, fullName: undefined }));
                                }}
                                error={Boolean(profileErrors.fullName)}
                                helperText={profileErrors.fullName}
                                fullWidth
                                sx={textFieldSx}
                            />
                            <TextField
                                label="Số điện thoại"
                                value={profileForm.phone}
                                onChange={(e) => {
                                    setProfileForm((f) => ({ ...f, phone: e.target.value }));
                                    if (profileErrors.phone) setProfileErrors((er) => ({ ...er, phone: undefined }));
                                }}
                                error={Boolean(profileErrors.phone)}
                                helperText={profileErrors.phone}
                                fullWidth
                                autoComplete="tel"
                                sx={textFieldSx}
                            />
                            <TextField
                                label="Giới thiệu (bio)"
                                value={profileForm.bio}
                                onChange={(e) => {
                                    setProfileForm((f) => ({ ...f, bio: e.target.value }));
                                    if (profileErrors.bio) setProfileErrors((er) => ({ ...er, bio: undefined }));
                                }}
                                error={Boolean(profileErrors.bio)}
                                helperText={profileErrors.bio || `${profileForm.bio?.length ?? 0}/${PROFILE_BIO_MAX}`}
                                fullWidth
                                multiline
                                minRows={3}
                                inputProps={{ maxLength: PROFILE_BIO_MAX }}
                                sx={textFieldSx}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button type="button" onClick={closeProfileEdit} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={profileSaving}
                            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                        >
                            {profileSaving ? 'Đang lưu...' : 'Lưu'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog
                open={pwdOpen}
                onClose={closePwdDialog}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        bgcolor: '#25232C',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Đổi mật khẩu</DialogTitle>
                <form onSubmit={handleSubmitPassword}>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                                Giao diện thử nghiệm — chưa gửi yêu cầu lên server.
                            </Typography>
                            <TextField
                                label="Mật khẩu hiện tại"
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => {
                                    setCurrentPassword(e.target.value);
                                    if (pwdErrors.currentPassword) setPwdErrors((p) => ({ ...p, currentPassword: undefined }));
                                }}
                                error={Boolean(pwdErrors.currentPassword)}
                                helperText={pwdErrors.currentPassword}
                                fullWidth
                                autoComplete="current-password"
                                sx={textFieldSx}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="Ẩn/hiện mật khẩu"
                                                onClick={() => setShowCurrent((v) => !v)}
                                                edge="end"
                                                sx={{ color: 'rgba(255,255,255,0.5)' }}
                                            >
                                                {showCurrent ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                label="Mật khẩu mới"
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (pwdErrors.newPassword) setPwdErrors((p) => ({ ...p, newPassword: undefined }));
                                }}
                                error={Boolean(pwdErrors.newPassword)}
                                helperText={pwdErrors.newPassword || `Tối thiểu ${MIN_PASSWORD_LEN} ký tự.`}
                                fullWidth
                                autoComplete="new-password"
                                sx={textFieldSx}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="Ẩn/hiện mật khẩu"
                                                onClick={() => setShowNew((v) => !v)}
                                                edge="end"
                                                sx={{ color: 'rgba(255,255,255,0.5)' }}
                                            >
                                                {showNew ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                label="Xác nhận mật khẩu mới"
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (pwdErrors.confirmPassword) setPwdErrors((p) => ({ ...p, confirmPassword: undefined }));
                                }}
                                error={Boolean(pwdErrors.confirmPassword)}
                                helperText={pwdErrors.confirmPassword}
                                fullWidth
                                autoComplete="new-password"
                                sx={textFieldSx}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="Ẩn/hiện mật khẩu"
                                                onClick={() => setShowConfirm((v) => !v)}
                                                edge="end"
                                                sx={{ color: 'rgba(255,255,255,0.5)' }}
                                            >
                                                {showConfirm ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button type="button" onClick={closePwdDialog} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                        >
                            Lưu mật khẩu
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                message={snackbar.message}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
}