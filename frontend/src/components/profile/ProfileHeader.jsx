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
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import CloseIcon from '@mui/icons-material/Close';
import FlagIcon from '@mui/icons-material/Flag';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
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
    chatLoading,
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
}) {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [avatarAnchorEl, setAvatarAnchorEl] = useState(null);
    const [viewAvatarOpen, setViewAvatarOpen] = useState(false);

    const canOpenFollowList = followListUserId != null && typeof onOpenFollowList === 'function';

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
                                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
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
                        PaperProps={{
                            sx: {
                                bgcolor: '#262626', color: 'white', borderRadius: 3, minWidth: 210,
                                '& .MuiMenuItem-root': { py: 1.5, gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }
                            }
                        }}
                    >
                        <MenuItem onClick={() => { setAvatarAnchorEl(null); setViewAvatarOpen(true); }} sx={{ fontWeight: 600 }}>
                            <VisibilityIcon sx={{ fontSize: 20 }} /> Xem ảnh
                        </MenuItem>
                        <MenuItem onClick={() => { setAvatarAnchorEl(null); avatarInputRef.current?.click(); }} sx={{ fontWeight: 600, color: '#0095f6' }}>
                            <PhotoCameraIcon sx={{ fontSize: 20 }} /> Chỉnh sửa ảnh
                        </MenuItem>
                        <MenuItem onClick={() => setAvatarAnchorEl(null)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Hủy</MenuItem>
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
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StarIcon sx={{ fontSize: 19, color: '#FFC107' }} />
                            <Typography variant="body2" fontWeight={300} sx={{ color: 'white', fontSize: '1rem' }}>
                                <span style={{ fontWeight: 600 }}>{reputationScore > 0 ? Number(reputationScore).toFixed(1) : '5.0'}</span>
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

                        {/* Verified phone status */}
                        {(isMe || user.phoneNumber || user.phone_number) && (
                            <Box 
                                sx={{ 
                                    display: 'flex', alignItems: 'center', mb: 0.5,
                                    bgcolor: (user.phoneVerified || user.phoneNumber || user.phone_number) ? 'rgba(74, 222, 128, 0.08)' : 'transparent',
                                    px: (user.phoneVerified || user.phoneNumber || user.phone_number) ? 1.4 : 0, py: (user.phoneVerified || user.phoneNumber || user.phone_number) ? 0.4 : 0, 
                                    borderRadius: '20px',
                                    border: (user.phoneVerified || user.phoneNumber || user.phone_number) ? '1px solid rgba(74, 222, 128, 0.2)' : 'none',
                                    width: 'fit-content'
                                }}
                            >
                                {(user.phoneVerified || user.phoneNumber || user.phone_number) ? (
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
                onClose={() => !saving && setEditing(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#121212',
                        backgroundImage: 'none',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
                    }
                }}
                BackdropProps={{
                    sx: {
                        backdropFilter: 'blur(8px)',
                        bgcolor: 'rgba(0,0,0,0.7)',
                    }
                }}
            >
                <DialogTitle sx={{ color: 'white', textAlign: 'center', fontWeight: 700, pt: 5, pb: 1 }}>
                    Chỉnh sửa trang cá nhân
                </DialogTitle>
                <DialogContent sx={{ mt: 2, pb: 3, px: 4 }}>
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <TextField 
                            fullWidth label="Họ tên" variant="outlined" value={editForm.fullName}
                            onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                            sx={textFieldStyle}
                            size="small"
                        />
                        <TextField 
                            fullWidth label="Số điện thoại" value={editForm.phoneNumber}
                            onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                            sx={textFieldStyle}
                            size="small"
                        />
                        <TextField 
                            fullWidth multiline rows={3} label="Giới thiệu" value={editForm.bio}
                            onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
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
                                onClick={handleSave}
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
                                onClick={() => setEditing(false)}
                                sx={{ color: 'rgba(255,255,255,0.5)', textTransform: 'none', fontSize: '0.9rem' }}
                            >
                                Hủy
                            </Button>
                        </Box>
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
                            : <Avatar sx={{ width: 200, height: 200, bgcolor: PURPLE, fontSize: '5rem' }}>{fullName?.charAt(0)?.toUpperCase()}</Avatar>
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
