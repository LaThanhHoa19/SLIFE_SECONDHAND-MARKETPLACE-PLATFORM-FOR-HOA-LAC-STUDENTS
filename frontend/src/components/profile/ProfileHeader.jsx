import {useState} from 'react';
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import StarIcon from '@mui/icons-material/Star';
import ChatIcon from '@mui/icons-material/Chat';
import ReportIcon from '@mui/icons-material/Report';
import ShareIcon from '@mui/icons-material/Share';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import ForumIcon from '@mui/icons-material/Forum';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';

const PURPLE = '#6366f1';
const GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';

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
                                          displayCoverUrl,
                                          fullName,
                                          joinDate,
                                          reputationScore,
                                          ratingCount,
                                          chatLoading,
                                          handleOpenReportDialog,
                                          handleCoverChange,
                                          handleAvatarChange,
                                          coverInputRef,
                                          avatarInputRef,
                                          uploadingCover,
                                          uploadingAvatar,
                                          handleChat,
                                          error,
                                          isFollowing,
                                          followLoading,
                                          onToggleFollow,
                                          loggedIn,
                                          onRequireLogin,
                                          followListUserId,
                                          onOpenFollowList,
                                      }) {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const canOpenFollowList = followListUserId != null && typeof onOpenFollowList === 'function';
    const statClickSx = canOpenFollowList
        ? {
            cursor: 'pointer',
            borderRadius: 2,
            px: 0.75,
            py: 0.5,
            mx: -0.75,
            my: -0.5,
            transition: 'background-color 0.15s',
            '&:hover': { bgcolor: 'rgba(157, 110, 237, 0.1)' },
        }
        : {};

    return (
        <>
            {/* Ảnh bìa */}
            <Box
                sx={{
                    height: { xs: 200, sm: 260 },
                    background: displayCoverUrl
                        ? `url(${displayCoverUrl}) center/cover`
                        : GRADIENT,
                    position: 'relative',
                    boxShadow: 'inset 0 0 100px rgba(0,0,0,0.2)',
                }}
            >
                {isMe ? (
                    <>
                        <input
                            type="file"
                            accept="image/*"
                            ref={coverInputRef}
                            style={{ display: 'none' }}
                            onChange={handleCoverChange}
                        />
                        <Button
                            startIcon={uploadingCover ? <CircularProgress size={18} color="inherit" /> : <PhotoCameraIcon />}
                            onClick={() => coverInputRef.current?.click()}
                            disabled={uploadingCover}
                            variant="contained"
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                textTransform: 'none',
                                borderRadius: 2,
                                fontWeight: 700,
                                bgcolor: 'rgba(255,255,255,0.7)',
                                backdropFilter: 'blur(10px)',
                                color: 'grey.900',
                                border: '1px solid rgba(255,255,255,0.4)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                '&:hover': { bgcolor: '#fff' },
                            }}
                        >
                            {uploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa'}
                        </Button>
                    </>
                ) : (
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                        <IconButton
                            onClick={handleMenuClick}
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.3)',
                                color: 'white',
                                backdropFilter: 'blur(10px)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' }
                            }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            PaperProps={{
                                sx: {
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                                    minWidth: 120,
                                    mt: 1,
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    '& .MuiMenuItem-root': {
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        py: 1,
                                    }
                                }
                            }}
                        >
                            <MenuItem onClick={() => { handleMenuClose(); handleOpenReportDialog(); }} sx={{ color: '#ff5252', gap: 1 }}>
                                <ReportIcon sx={{ fontSize: 18 }} /> Báo cáo
                            </MenuItem>
                        </Menu>
                    </Box>
                )}
            </Box>

            <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 1.5, sm: 2 }, mt: -10, position: 'relative', zIndex: 1 }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        bgcolor: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(30px) saturate(180%)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                            boxShadow: '0 30px 80px rgba(0,0,0,0.12)',
                        }
                    }}
                >
                    {/* Avatar + tên, ngày tham gia, rating, Chat/Báo cáo */}
                    <Box sx={{ px: { xs: 2, sm: 4 }, pt: 4, pb: 4 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 3 }}>
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    src={avatarUrl}
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        border: 4,
                                        borderColor: 'white',
                                        boxShadow: '0 8px 24px rgba(157, 110, 237, 0.25)',
                                        bgcolor: PURPLE,
                                        fontSize: '3rem',
                                    }}
                                >
                                    {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                                </Avatar>
                                {user.isOnline && (
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 5,
                                        right: 15,
                                        width: 18,
                                        height: 18,
                                        bgcolor: '#4caf50',
                                        borderRadius: '50%',
                                        border: '3px solid white',
                                        zIndex: 2
                                    }} />
                                )}
                                {isMe && (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={avatarInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleAvatarChange}
                                        />
                                        <Button
                                            size="small"
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={uploadingAvatar}
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                right: 0,
                                                minWidth: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                bgcolor: PURPLE,
                                                color: 'white',
                                                '&:hover': { bgcolor: '#4f46e5' },
                                                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                            }}
                                            title="Đổi avatar"
                                        >
                                            {uploadingAvatar ? (
                                                <CircularProgress size={20} color="inherit" />
                                            ) : (
                                                <PhotoCameraIcon sx={{ fontSize: 18 }} />
                                            )}
                                        </Button>
                                    </>
                                )}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 280 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                            <Typography variant="h4" fontWeight={800} sx={{ color: '#1d1d1f', letterSpacing: '-0.02em' }}>
                                                {fullName}
                                            </Typography>
                                            {user.isOnline && !isMe && (
                                                <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600, display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                    ● Đang hoạt động
                                                </Typography>
                                            )}
                                        </Box>
                                        {joinDate && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
                                                <AccessTimeIcon sx={{ fontSize: 16 }} />
                                                <Typography variant="body2">{joinDate}</Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        {!isMe ? (
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                <IconButton
                                                    sx={{
                                                        bgcolor: 'rgba(157, 110, 237, 0.1)',
                                                        color: PURPLE,
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        '&:hover': { bgcolor: PURPLE, color: 'white' },
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    title="Chia sẻ"
                                                >
                                                    <ShareIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => {
                                                        if (!loggedIn) {
                                                            onRequireLogin?.();
                                                            return;
                                                        }
                                                        onToggleFollow?.();
                                                    }}
                                                    disabled={followLoading}
                                                    sx={{
                                                        bgcolor: isFollowing ? PURPLE : 'rgba(157, 110, 237, 0.1)',
                                                        color: isFollowing ? 'white' : PURPLE,
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        '&:hover': { bgcolor: PURPLE, color: 'white' },
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    title={isFollowing ? 'Bỏ theo dõi' : 'Theo dõi'}
                                                >
                                                    {followLoading ? (
                                                        <CircularProgress size={18} color="inherit" />
                                                    ) : isFollowing ? (
                                                        <PersonRemoveIcon fontSize="small" />
                                                    ) : (
                                                        <PersonAddIcon fontSize="small" />
                                                    )}
                                                </IconButton>
                                                <IconButton
                                                    onClick={handleChat}
                                                    disabled={chatLoading}
                                                    sx={{
                                                        bgcolor: 'rgba(157, 110, 237, 0.1)',
                                                        color: PURPLE,
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        '&:hover': { bgcolor: PURPLE, color: 'white' },
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    title="Nhắn tin"
                                                >
                                                    {chatLoading ? <CircularProgress size={18} color="inherit" /> : <ChatIcon fontSize="small" />}
                                                </IconButton>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                <Button
                                                    variant="contained"
                                                    size="medium"
                                                    onClick={() => navigate('/my-listings')}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        borderRadius: 2,
                                                        bgcolor: PURPLE,
                                                        color: 'white',
                                                        '&:hover': { bgcolor: '#835cd4' },
                                                    }}
                                                >
                                                    Quản lý bài đăng
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="medium"
                                                    startIcon={editing ? <CloseIcon /> : <EditIcon />}
                                                    onClick={() => setEditing(!editing)}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontWeight: 600,
                                                        borderRadius: 2,
                                                        borderColor: PURPLE,
                                                        color: PURPLE,
                                                        borderWidth: 2,
                                                        '&:hover': { 
                                                            borderColor: '#4f46e5', 
                                                            bgcolor: 'rgba(99, 102, 241, 0.08)',
                                                            borderWidth: 2,
                                                        },
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    }}
                                                >
                                                    {editing ? 'Hủy' : 'Chỉnh sửa hồ sơ'}
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' },
                                    gap: 3,
                                    mt: 3,
                                    p: 3,
                                    background: 'rgba(99, 102, 241, 0.03)',
                                    borderRadius: 4,
                                    border: '1px solid rgba(99, 102, 241, 0.1)',
                                }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }} display="block">Đánh giá</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                                            <Typography variant="h5" fontWeight={800} color="grey.900">{reputationScore}</Typography>
                                            <StarIcon sx={{ fontSize: 22, color: '#f59e0b' }} />
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mt: 0.5 }}>({ratingCount})</Typography>
                                        </Box>
                                    </Box>

                                    <Box
                                        role={canOpenFollowList ? 'button' : undefined}
                                        tabIndex={canOpenFollowList ? 0 : undefined}
                                        onClick={() => canOpenFollowList && onOpenFollowList('followers')}
                                        onKeyDown={(e) => {
                                            if (!canOpenFollowList) return;
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onOpenFollowList('followers');
                                            }
                                        }}
                                        sx={{ ...statClickSx, textAlign: 'center' }}
                                    >
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }} display="block">Người theo dõi</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 0.5 }}>
                                            <PeopleIcon sx={{ fontSize: 22, color: PURPLE }} />
                                            <Typography variant="h5" fontWeight={800} color="grey.900">
                                                {user.followerCount != null
                                                    ? user.followerCount
                                                    : (user.followers ?? '—')}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box
                                        role={canOpenFollowList ? 'button' : undefined}
                                        tabIndex={canOpenFollowList ? 0 : undefined}
                                        onClick={() => canOpenFollowList && onOpenFollowList('following')}
                                        onKeyDown={(e) => {
                                            if (!canOpenFollowList) return;
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onOpenFollowList('following');
                                            }
                                        }}
                                        sx={{ ...statClickSx, textAlign: 'center' }}
                                    >
                                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }} display="block">Đang theo dõi</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 0.5 }}>
                                            <PersonSearchIcon sx={{ fontSize: 22, color: PURPLE }} />
                                            <Typography variant="h5" fontWeight={800} color="grey.900">
                                                {user.followingCount != null ? user.followingCount : '—'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {!isMe && (
                                    <Box sx={{ mt: 2.5 }} />
                                )}
                            </Box>
                        </Box>

                        {editing && (
                            <Box
                                component="form"
                                sx={{
                                    mt: 3,
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: 'grey.50',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSave();
                                }}
                            >
                                <TextField
                                    fullWidth
                                    label="Họ tên"
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                                    sx={{ mb: 2 }}
                                    size="small"
                                />
                                <TextField
                                    fullWidth
                                    label="Số điện thoại"
                                    value={editForm.phoneNumber}
                                    onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                                    sx={{ mb: 2 }}
                                    size="small"
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Giới thiệu"
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                                    sx={{ mb: 2 }}
                                    size="small"
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                                    disabled={saving}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 2,
                                        boxShadow: '0 2px 8px rgba(157, 110, 237, 0.35)',
                                    }}
                                >
                                    Lưu thay đổi
                                </Button>
                            </Box>
                        )}

                        {error && (
                            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                                {error}
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Box>
        </>
    );
}