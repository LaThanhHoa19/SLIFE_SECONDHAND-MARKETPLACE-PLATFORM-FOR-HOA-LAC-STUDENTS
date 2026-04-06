import { useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Tooltip,
    Typography,
    InputAdornment,
    Rating,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import CloseIcon from '@mui/icons-material/Close';
import FlagIcon from '@mui/icons-material/Flag';
import BlockIcon from '@mui/icons-material/Block';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StarIcon from '@mui/icons-material/Star';
import { DialogTitle, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FollowListDialog from './FollowListDialog';

const PURPLE = '#9D6EED';

export default function ProfileHeader({
    user,
    isMe,
    editing,
    setEditing,
    saving,
    handleSave,
    editForm,
    setEditForm,
    avatarUrl,
    fullName,
    joinDate,
    reputationScore,
    ratingCount,
    chatLoading = false,
    handleAvatarChange,
    avatarInputRef,
    uploadingAvatar,
    handleChat,
    handleOpenReportDialog,
    error,
    isFollowing,
    followLoading,
    onToggleFollow,
    followListUserId,
    onOpenFollowList,
    listingCount,
    sendingPhoneOtp,
    verifyingPhoneOtp,
    otpSent,
    otpCode,
    setOtpCode,
    onRequestPhoneOtp,
    onVerifyPhoneOtp,
    otpCooldownActive,
    otpCooldownLeftSeconds,
    /** Đăng nhập và đang xem hồ sơ người khác — hiện mục chặn trong menu */
    canBlock = false,
    onOpenBlockDialog,
}) {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [avatarAnchorEl, setAvatarAnchorEl] = useState(null);
    const [viewAvatarOpen, setViewAvatarOpen] = useState(false);
    const [otpVerificationOpen, setOtpVerificationOpen] = useState(false);

    const canOpenFollowList = followListUserId != null && typeof onOpenFollowList === 'function';
    const hasPhoneNumber = !!(user.phoneNumber || user.phone_number);
    const isPhoneVerified = !!(user.phoneVerifiedAt || user.phone_verified_at);

    const textFieldStyle = {
        mb: 2.5,
        '& .MuiOutlinedInput-root': {
            color: 'white',
            borderRadius: 2,
            transition: 'all 0.2s ease',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            '&.Mui-focused fieldset': { borderColor: PURPLE, borderWidth: '1px' },
            '& input': { outline: 'none' },
        },
        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' },
        '& .MuiInputLabel-root.Mui-focused': { color: PURPLE, outline: 'none' }
    };

    const [fieldErrors, setFieldErrors] = useState({ fullName: '', phoneNumber: '', bio: '' });

    const oldPhoneRaw = String(user.phoneNumber || user.phone_number || '').trim();
    const newPhoneRaw = editForm.phoneNumber?.trim();
    const phoneChanged = !!newPhoneRaw && newPhoneRaw !== oldPhoneRaw && (oldPhoneRaw.endsWith(newPhoneRaw) === false);
    // Logic mới: phoneOk chỉ cần đủ 9 số và không bắt đầu bằng 0 (vì ta đã gọt 0 ở onChange)
    const phoneOk = /^[1-9]\d{8}$/.test(newPhoneRaw || '');
    /** Hiện nút gửi OTP cho đến khi server báo đã xác thực (không chỉ khi vừa đổi số). */
    const needsPhoneVerification = isMe && phoneOk && !isPhoneVerified;

    const handleLocalSave = (e) => {
        if (e) e.preventDefault();
        
        let isValid = true;
        const errors = { fullName: '', phoneNumber: '', bio: '' };

        // Validate Full Name
        const nameWords = editForm.fullName?.trim().split(/\s+/) || [];
        if (nameWords.length < 2) {
            errors.fullName = 'Họ và tên phải có ít nhất 2 từ';
            isValid = false;
        }

        // Validate Phone Number
        const phoneRegex = /^[1-9]\d{8}$/;
        if (!phoneRegex.test(editForm.phoneNumber?.trim() || '')) {
            errors.phoneNumber = 'Số điện thoại phải gồm đúng 9 chữ số thuê bao (không bao gồm số 0 ở đầu)';
            isValid = false;
        }

        // Validate Bio
        const bioLen = editForm.bio?.trim().length || 0;
        if (bioLen <= 1 || bioLen >= 200) {
            errors.bio = 'Giới thiệu phải từ 2 đến 199 kí tự';
            isValid = false;
        }

        setFieldErrors(errors);

        if (isValid) {
            // Cho phép lưu ngay cả khi chưa xác thực số điện thoại.
            // Người dùng có thể chủ động bấm "Gửi mã OTP" để xác thực sau.
            handleSave();
        }
    };

    const handleConfirmOtpAndSave = async () => {
        const success = await onVerifyPhoneOtp();
        if (success) {
            setOtpVerificationOpen(false);
            handleSave();
        }
    };

    const handleCloseEdit = () => {
        if (saving) return;
        setEditing(false);
        setFieldErrors({ fullName: '', phoneNumber: '', bio: '' });
    };

    return (
        <Box sx={{ maxWidth: 880, width: { xs: '100%', sm: '76%' }, mx: 'auto', px: { xs: 2, sm: 4 }, pt: { xs: 2, sm: 4 }, pb: 2, position: 'relative' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 3, sm: 4 }, alignItems: { xs: 'center', sm: 'flex-start' } }}>

                {/* ─── Avatar Section ─────────────────────────────── */}
                <Box sx={{ flexShrink: 0, position: 'relative' }}>
                    <IconButton
                        onClick={(e) => isMe ? setAvatarAnchorEl(e.currentTarget) : setViewAvatarOpen(true)}
                        sx={{ p: 0.5, border: '1px solid rgba(255,255,255,0.1)', '&:hover': { opacity: 0.85 } }}
                    >
                        {uploadingAvatar
                            ? <Box sx={{ width: { xs: 90, sm: 150 }, height: { xs: 90, sm: 150 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
                            : <Avatar
                                src={avatarUrl}
                                sx={{
                                    width: { xs: 90, sm: 150 },
                                    height: { xs: 90, sm: 150 },
                                    bgcolor: PURPLE,
                                    fontSize: { xs: '2rem', sm: '4rem' },
                                }}
                            >
                                <PersonIcon sx={{ fontSize: { xs: '3rem', sm: '6rem' }, color: 'rgba(255,255,255,0.85)' }} />
                            </Avatar>
                        }
                    </IconButton>

                    {user.isOnline && (
                        <Box sx={{
                            position: 'absolute', bottom: '10%', left: '10%',
                            width: 16, height: 16, bgcolor: '#4caf50',
                            borderRadius: '50%', border: '2px solid #000', zIndex: 3
                        }} />
                    )}

                    {!isMe && (
                        <Tooltip title={isFollowing ? 'Bỏ theo dõi' : 'Theo dõi'}>
                            <IconButton
                                onClick={onToggleFollow}
                                disabled={followLoading}
                                sx={{
                                    position: 'absolute',
                                    bottom: 5, right: 5,
                                    width: 44, height: 44,
                                    bgcolor: '#fff',
                                    color: '#000',
                                    border: '4px solid #000',
                                    zIndex: 4,
                                    p: 0,
                                    transition: 'transform 0.1s ease',
                                    '&:hover': { bgcolor: '#f0f0f0' },
                                    '&:active': { transform: 'scale(0.9)' },
                                    '&.Mui-disabled': { bgcolor: '#333', color: '#888' },
                                }}
                            >
                                {followLoading
                                    ? <CircularProgress size={16} color="inherit" />
                                    : isFollowing
                                        ? <CheckIcon sx={{ fontSize: 26 }} />
                                        : <AddIcon sx={{ fontSize: 28 }} />
                                }
                            </IconButton>
                        </Tooltip>
                    )}

                    <Menu
                        anchorEl={avatarAnchorEl}
                        open={Boolean(avatarAnchorEl)}
                        onClose={() => setAvatarAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                        PaperProps={{
                            sx: {
                                bgcolor: '#201D26', 
                                color: 'white', 
                                borderRadius: 3, 
                                minWidth: 210,
                                mt: 1.5,
                                border: '1px solid rgba(255,255,255,0.06)',
                                boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                                '& .MuiList-root': { p: 1 },
                                '& .MuiMenuItem-root': { 
                                    py: 1.25, px: 2, gap: 1.5, borderRadius: 2,
                                    transition: 'all 0.2s',
                                    fontSize: '0.95rem',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' }
                                }
                            }
                        }}
                    >
                        <MenuItem onClick={() => { setAvatarAnchorEl(null); setViewAvatarOpen(true); }} sx={{ fontWeight: 600 }}>
                            <VisibilityIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }} /> Xem ảnh
                        </MenuItem>
                        <MenuItem onClick={() => { setAvatarAnchorEl(null); avatarInputRef.current?.click(); }} sx={{ fontWeight: 600, color: '#0095f6' }}>
                            <PhotoCameraIcon sx={{ fontSize: 20 }} /> Chỉnh sửa ảnh
                        </MenuItem>
                        <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.06)' }} />
                        <MenuItem onClick={() => setAvatarAnchorEl(null)} sx={{ color: 'rgba(255,255,255,0.4)', justifyContent: 'center', py: 1 }}>Hủy</MenuItem>
                    </Menu>

                    <input type="file" accept="image/*" ref={avatarInputRef} style={{ display: 'none' }} onChange={handleAvatarChange} />
                </Box>

                {/* ─── Info Section ──────────────────────────────── */}
                    <Box 
                        sx={{ 
                            flex: 1, pt: 0.5, minWidth: 0, textAlign: { xs: 'center', sm: 'left' },
                            '&:hover .settings-btn': { opacity: 1 } 
                        }}
                    >
                        {/* Name + More Options */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 2.5, gap: 1.5 }}>
                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.2px', fontSize: '1.65rem' }}>
                                {fullName}
                            </Typography>

                            {isMe ? (
                                <IconButton 
                                    className="settings-btn"
                                    onClick={() => setEditing(true)}
                                    sx={{ 
                                        color: 'white', 
                                        opacity: 0.1, 
                                        transition: 'opacity 0.3s ease',
                                        p: 0.5
                                    }}
                                >
                                    <SettingsIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                            ) : (
                                <IconButton 
                                    className="settings-btn"
                                    onClick={(e) => setAnchorEl(e.currentTarget)}
                                    sx={{ color: 'rgba(255,255,255,0.6)', p: 0.5, opacity: 0.1, transition: 'opacity 0.3s ease' }}
                                >
                                    <MoreHorizIcon />
                                </IconButton>
                            )}
                        </Box>

                    {/* Report Menu */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        PaperProps={{
                            sx: {
                                bgcolor: '#262626', color: 'white', borderRadius: 3,
                                '& .MuiMenuItem-root': { py: 1.5, px: 3, textAlign: 'center', justifyContent: 'center' }
                            }
                        }}
                    >
                        {canBlock && typeof onOpenBlockDialog === 'function' && (
                            <MenuItem
                                onClick={() => {
                                    setAnchorEl(null);
                                    onOpenBlockDialog();
                                }}
                                sx={{ color: 'rgba(255,255,255,0.92)', fontWeight: 600, display: 'flex', gap: 1 }}
                            >
                                <BlockIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.65)' }} />
                                Chặn người dùng
                            </MenuItem>
                        )}
                        <MenuItem 
                            onClick={() => { setAnchorEl(null); handleOpenReportDialog(); }} 
                            sx={{ color: '#ed4956', fontWeight: 700, display: 'flex', gap: 1 }}
                        >
                            <FlagIcon sx={{ fontSize: 18 }} />
                            Báo cáo
                        </MenuItem>
                        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        <MenuItem onClick={() => setAnchorEl(null)}>Hủy</MenuItem>
                    </Menu>

                    {/* Stats + Rating Row */}
                    <Box sx={{ display: 'flex', gap: { xs: 2.5, sm: 3.5 }, mb: 3, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: 'white', fontSize: '1rem', fontWeight: 300 }}>
                            <span style={{ fontWeight: 600 }}>{listingCount ?? 0}</span> bài viết
                        </Typography>
                        <Typography
                            onClick={() => canOpenFollowList && onOpenFollowList('followers')}
                            variant="body2"
                            sx={{ 
                                color: 'white', fontSize: '1rem', fontWeight: 300,
                                cursor: canOpenFollowList ? 'pointer' : 'default', 
                                transition: 'all 0.15s ease',
                                '&:hover': canOpenFollowList ? { 
                                    textShadow: '0.5px 0 currentColor',
                                    textDecoration: 'none' 
                                } : {} 
                            }}
                        >
                            <span style={{ fontWeight: 600 }}>{user.followerCount ?? user.followers ?? 0}</span> người theo dõi
                        </Typography>
                        <Typography
                            onClick={() => canOpenFollowList && onOpenFollowList('following')}
                            variant="body2"
                            sx={{ 
                                color: 'white', fontSize: '1rem', fontWeight: 300,
                                cursor: canOpenFollowList ? 'pointer' : 'default', 
                                transition: 'all 0.15s ease',
                                '&:hover': canOpenFollowList ? { 
                                    textShadow: '0.5px 0 currentColor',
                                    textDecoration: 'none' 
                                } : {} 
                            }}
                        >
                            Đang theo dõi <span style={{ fontWeight: 600 }}>{user.followingCount ?? 0}</span> người dùng
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'white' }}>
                            <StarIcon sx={{ color: '#fbbf24', fontSize: '1.2rem' }} />
                            <Typography variant="body2" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                                {Number(reputationScore || 0).toFixed(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', ml: 0.5 }}>
                                ({ratingCount ?? 0} đánh giá)
                            </Typography>
                        </Box>
                    </Box>

                    {/* Bio / Verification / Join Date */}
                    <Box sx={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' } }}>
                        {!editing && (
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 300, mb: 1.5 }}>
                                {user.bio || (isMe ? 'Thêm giới thiệu về bản thân bạn…' : '')}
                            </Typography>
                        )}

                        {/* Số điện thoại + trạng thái xác thực */}
                        {(isMe || hasPhoneNumber) && (
                            <Box sx={{ mt: 0.5 }}>
                                {isMe && (user.phoneNumber || user.phone_number) && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: 'rgba(255,255,255,0.8)',
                                            fontSize: '0.9rem',
                                            mb: 0.25,
                                        }}
                                    >
                                        Số điện thoại: <strong>{user.phoneNumber || user.phone_number}</strong>
                                    </Typography>
                                )}
                                <Box 
                                    sx={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        mt: 0.25,
                                        bgcolor: isPhoneVerified ? 'rgba(74, 222, 128, 0.08)' : 'transparent',
                                        px: isPhoneVerified ? 1.4 : 0, py: isPhoneVerified ? 0.4 : 0, 
                                        borderRadius: '20px',
                                        border: isPhoneVerified ? '1px solid rgba(74, 222, 128, 0.2)' : 'none',
                                        width: 'fit-content'
                                    }}
                                >
                                    {isPhoneVerified ? (
                                        <>
                                            <CheckCircleIcon sx={{ fontSize: 13, color: '#4ade80' }} />
                                            <Typography variant="caption" sx={{ ml: 0.8, fontWeight: 700, color: '#bbf7d0', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '10px' }}>
                                                Đã xác minh số điện thoại
                                            </Typography>
                                        </>
                                    ) : (
                                        <>
                                            <WarningAmberIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                                            <Typography variant="caption" sx={{ ml: 0.8, fontWeight: 500, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                                                Số điện thoại chưa xác thực
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                                {isMe && hasPhoneNumber && !isPhoneVerified && !editing && (
                                    <Box sx={{ mt: 1.25 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            disabled={sendingPhoneOtp || otpCooldownActive}
                                            onClick={() => {
                                                if (sendingPhoneOtp || otpCooldownActive) return;
                                                onRequestPhoneOtp();
                                                setOtpVerificationOpen(true);
                                            }}
                                            sx={{
                                                borderRadius: 999,
                                                borderColor: 'rgba(163,116,249,0.6)',
                                                color: '#e9d5ff',
                                                textTransform: 'none',
                                                fontSize: '0.8rem',
                                                px: 2,
                                                py: 0.6,
                                                '&:hover': {
                                                    borderColor: 'rgba(163,116,249,0.9)',
                                                    backgroundColor: 'rgba(163,116,249,0.08)',
                                                },
                                            }}
                                        >
                                            {sendingPhoneOtp
                                                ? 'Đang gửi...'
                                                : otpCooldownActive
                                                    ? `Gửi lại sau ${otpCooldownLeftSeconds}s`
                                                    : 'Gửi mã OTP để xác thực'}
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        )}

                        {joinDate && (
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', mt: 1, display: 'block' }}>
                                {joinDate}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ─── Edit Profile Popup Dialog ────────────────── */}
            <Dialog 
                open={editing} 
                onClose={handleCloseEdit}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#242526',
                        backgroundImage: 'none',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                    }
                }}
                BackdropProps={{
                    sx: {
                        backdropFilter: 'blur(8px)',
                        bgcolor: 'rgba(0,0,0,0.7)',
                    }
                }}
            >
                <DialogTitle sx={{ color: 'white', textAlign: 'center', fontWeight: 700, pt: 4, pb: 1 }}>
                    Chỉnh sửa trang cá nhân
                </DialogTitle>
                <DialogContent sx={{ pt: 2, pb: 4, px: { xs: 3, sm: 4 } }}>
                    <Box component="form" onSubmit={handleLocalSave}>
                        <TextField 
                            fullWidth label="Họ tên" variant="outlined" value={editForm.fullName}
                            onChange={(e) => {
                                setEditForm((f) => ({ ...f, fullName: e.target.value }));
                                if (fieldErrors.fullName) setFieldErrors(e => ({...e, fullName: ''}));
                            }}
                            error={Boolean(fieldErrors.fullName)}
                            helperText={fieldErrors.fullName}
                            sx={{ ...textFieldStyle, mt: 1 }}
                            size="small"
                        />
                        <TextField 
                            fullWidth 
                            label="Số điện thoại" 
                            value={editForm.phoneNumber}
                            placeholder="Nhập 9 số thuê bao"
                            onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, ''); // Chỉ lấy số (xóa d cách, chữ)
                                if (val.startsWith('0')) val = val.slice(1);  // Chặn/gọt số 0 ở đầu
                                val = val.slice(0, 9); // Giới hạn 9 số
                                setEditForm((f) => ({ ...f, phoneNumber: val }));
                                if (fieldErrors.phoneNumber) setFieldErrors(e => ({...e, phoneNumber: ''}));
                            }}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 700 }, mr: 1 }}>+84</InputAdornment>,
                            }}
                            error={Boolean(fieldErrors.phoneNumber)}
                            helperText={fieldErrors.phoneNumber}
                            sx={textFieldStyle}
                            size="small"
                        />

                        {needsPhoneVerification && (
                            <Box sx={{ mb: 2.5, mt: -0.5 }}>
                                {phoneChanged && (
                                    <Typography
                                        variant="caption"
                                        sx={{ display: 'block', color: 'rgba(255,255,255,0.65)', mb: 0.75 }}
                                    >
                                        Bạn đã thay đổi số điện thoại. Để bảo vệ tài khoản, số này cần xác thực lại trước khi được coi là đã xác minh.
                                    </Typography>
                                )}
                                {!phoneChanged && (
                                    <Typography
                                        variant="caption"
                                        sx={{ display: 'block', color: 'rgba(255,255,255,0.65)', mb: 0.75 }}
                                    >
                                        Số điện thoại của bạn chưa được xác thực. Bạn có thể gửi mã OTP bất cứ lúc nào — hoặc lưu hồ sơ trước, xác thực sau.
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        disabled={sendingPhoneOtp || otpCooldownActive}
                                        onClick={() => {
                                            if (sendingPhoneOtp || otpCooldownActive) return;
                                            onRequestPhoneOtp();
                                            setOtpVerificationOpen(true);
                                        }}
                                        sx={{
                                            borderRadius: 999,
                                            borderColor: 'rgba(163,116,249,0.6)',
                                            color: '#e9d5ff',
                                            textTransform: 'none',
                                            fontSize: '0.8rem',
                                            px: 1.8,
                                            py: 0.5,
                                            '&:hover': {
                                                borderColor: 'rgba(163,116,249,0.9)',
                                                backgroundColor: 'rgba(163,116,249,0.08)',
                                            },
                                        }}
                                    >
                                        {sendingPhoneOtp
                                            ? 'Đang gửi...'
                                            : otpCooldownActive
                                                ? `Gửi lại sau ${otpCooldownLeftSeconds}s`
                                                : 'Gửi mã OTP để xác thực'}
                                    </Button>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', flex: '1 1 200px' }}>
                                        Bạn vẫn có thể lưu mà chưa xác thực; sau khi xác thực thành công, dòng trạng thái phía trên sẽ chuyển sang &quot;Đã xác minh&quot;.
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                        <TextField 
                            fullWidth multiline rows={3} label="Giới thiệu" value={editForm.bio}
                            onChange={(e) => {
                                setEditForm((f) => ({ ...f, bio: e.target.value }));
                                if (fieldErrors.bio) setFieldErrors(e => ({...e, bio: ''}));
                            }}
                            error={Boolean(fieldErrors.bio)}
                            helperText={fieldErrors.bio}
                            sx={{ ...textFieldStyle, mb: 1 }}
                            size="small"
                        />
                        
                        {error && (
                            <Typography color="error" variant="caption" sx={{ display: 'block', mb: 2, textAlign: 'center' }}>
                                {error}
                            </Typography>
                        )}
                        
                        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Button 
                                fullWidth
                                onClick={handleLocalSave}
                                variant="contained" 
                                disabled={saving}
                                sx={{ 
                                    bgcolor: PURPLE, 
                                    color: 'white', 
                                    borderRadius: 3, 
                                    height: 44,
                                    textTransform: 'none', 
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    '&:hover': { bgcolor: '#835cd4' },
                                    boxShadow: '0 8px 16px rgba(157, 110, 237, 0.2)'
                                }}
                            >
                                {saving ? <CircularProgress size={20} color="inherit" /> : 'Lưu thay đổi'}
                            </Button>
                            <Button 
                                fullWidth
                                variant="text" 
                                onClick={handleCloseEdit}
                                sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontSize: '0.9rem', '&:hover': { background: 'transparent' } }}
                            >
                                Hủy
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>


            {/* ─── OTP Verification Popup Dialog ─────────────── */}
            <Dialog
                open={otpVerificationOpen}
                onClose={() => setOtpVerificationOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#242526',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
                    }
                }}
            >
                <DialogTitle sx={{ color: 'white', textAlign: 'center', fontWeight: 700, mt: 1 }}>
                    <IconButton
                        onClick={() => setOtpVerificationOpen(false)}
                        sx={{ position: 'absolute', right: 12, top: 12, color: 'rgba(255,255,255,0.5)' }}
                    >
                        <CloseIcon />
                    </IconButton>
                    Xác thực OTP
                </DialogTitle>
                <DialogContent sx={{ px: 4, pb: 4, textAlign: 'center' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', mb: 1, textAlign: 'left' }}>
                        Nhập mã OTP được gửi đến số điện thoại:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 1.5, mb: 3 }}>
                        <Typography sx={{ color: 'white', fontSize: '1.2rem', fontWeight: 700 }}>
                            +84{editForm.phoneNumber}
                        </Typography>
                        <Button 
                            variant="text" 
                            onClick={() => setOtpVerificationOpen(false)} 
                            sx={{ textTransform: 'none', color: '#a374f9', p: 0, minWidth: 'auto', '&:hover': { background: 'transparent' } }}
                        >
                            Đổi số điện thoại khác
                        </Button>
                    </Box>

                    <Box sx={{ position: 'relative', width: '100%', maxWidth: 360, mx: 'auto', mb: 4 }}>
                        <input
                            autoFocus
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                opacity: 0, cursor: 'text', zIndex: 2
                            }}
                        />
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
                            {[0, 1, 2, 3, 4, 5].map((index) => {
                                const char = otpCode[index] || '';
                                return (
                                    <Box
                                        key={index}
                                        sx={{
                                            width: 50,
                                            height: 50,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '10px',
                                            bgcolor: 'rgba(255,255,255,0.05)',
                                            border: '2px solid',
                                            borderColor: char 
                                                ? '#b996ff' 
                                                : (otpCode.length === index ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'),
                                            color: 'white',
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                            transition: 'border-color 0.2s',
                                        }}
                                    >
                                        {char}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>

                    <Button
                        variant="contained"
                        fullWidth
                        disabled={verifyingPhoneOtp || (otpCode?.trim()?.length !== 6)}
                        onClick={handleConfirmOtpAndSave}
                        sx={{
                            textTransform: 'none',
                            bgcolor: '#a374f9',
                            color: 'white',
                            mb: 2,
                            height: 48,
                            borderRadius: '10px',
                            fontSize: '1rem',
                            fontWeight: 700,
                            '&:hover': { bgcolor: '#8b5cf6' },
                            '&.Mui-disabled': { 
                                bgcolor: 'rgba(255,255,255,0.1)', 
                                color: 'rgba(255,255,255,0.3)' 
                            }
                        }}
                    >
                        {verifyingPhoneOtp ? <CircularProgress size={24} color="inherit" /> : 'Tiếp tục'}
                    </Button>

                    <Box sx={{ mt: 1 }}>
                        {sendingPhoneOtp ? (
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                                Đang gửi mã...
                            </Typography>
                        ) : otpCooldownActive ? (
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                                Gửi lại mã sau {otpCooldownLeftSeconds}s
                            </Typography>
                        ) : (
                            <Button
                                variant="text"
                                onClick={onRequestPhoneOtp}
                                sx={{ textTransform: 'none', color: '#a374f9', fontWeight: 600, '&:hover': { background: 'transparent' } }}
                            >
                                Gửi lại mã
                            </Button>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>

            {/* ─── Floating Chat button – bottom-right of page ── */}
            {!isMe && (
                <Button
                    onClick={handleChat}
                    disabled={chatLoading}
                    startIcon={chatLoading ? <CircularProgress size={18} color="inherit" /> : <ForwardToInboxIcon />}
                    variant="contained"
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 1300,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        borderRadius: 10, // Pill shape
                        px: 3,
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 800, // Bold font
                        fontSize: '0.95rem',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '&:hover': { 
                            bgcolor: '#fff', 
                            color: '#000', 
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 40px rgba(255,255,255,0.2)'
                        },
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&.Mui-disabled': { bgcolor: '#333', color: '#666' },
                    }}
                >
                    Tin nhắn
                </Button>
            )}

            {/* ─── Avatar full-screen dialog ────────────────── */}
            <Dialog
                open={viewAvatarOpen}
                onClose={() => setViewAvatarOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { bgcolor: '#000', borderRadius: 2 } }}
            >
                <DialogContent sx={{ p: 0, position: 'relative' }}>
                    <IconButton
                        onClick={() => setViewAvatarOpen(false)}
                        sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1 }}
                    >
                        <CloseIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, minHeight: 300 }}>
                        {avatarUrl
                            ? <img src={avatarUrl} alt={fullName} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain' }} />
                            : <Avatar sx={{ width: 200, height: 200, bgcolor: PURPLE }}>
                                <PersonIcon sx={{ fontSize: '8rem', color: 'rgba(255,255,255,0.85)' }} />
                            </Avatar>
                        }
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Legacy FollowListDialog kept for follow-list (followers/following) */}
            <FollowListDialog
                open={false}
                onClose={() => {}}
                userId={-1}
            />
        </Box>
    );
}
