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

const PURPLE = '#9D6EED';
const GRADIENT = 'linear-gradient(135deg, #9D6EED 0%, #7B4FD9 100%)';

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
                                      }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            {/* Ảnh bìa Section */}
                <Box
                    sx={{
                        height: {xs: 200, sm: 260},
                        background: displayCoverUrl ? `url(${displayCoverUrl}) center/cover` : GRADIENT,
                        position: 'relative',
                        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.2)',
                    }}
                >
                    {isMe ? (
                        <Box sx={{position: 'absolute', bottom: 16, right: 16}}>
                            <input
                                type="file"
                                accept="image/*"
                                ref={coverInputRef}
                                style={{display: 'none'}}
                                onChange={handleCoverChange}
                            />
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={uploadingCover ? <CircularProgress size={16} color="inherit"/> :
                                    <PhotoCameraIcon/>}
                                onClick={() => coverInputRef.current?.click()}
                                disabled={uploadingCover}
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                    color: '#1d1d1f',
                                    '&:hover': {bgcolor: 'white'},
                                    backdropFilter: 'blur(10px)',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '8px',
                                }}
                            >
                                {uploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa'}
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{position: 'absolute', top: 16, right: 16}}>
                            <IconButton
                                onClick={handleMenuClick}
                                sx={{
                                    bgcolor: 'rgba(0,0,0,0.3)',
                                    color: 'white',
                                    backdropFilter: 'blur(10px)',
                                    '&:hover': {bgcolor: 'rgba(0,0,0,0.5)'}
                                }}
                            >
                                <MoreVertIcon/>
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleMenuClose}
                                transformOrigin={{horizontal: 'right', vertical: 'top'}}
                                anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                            >
                                <MenuItem onClick={() => {
                                    handleMenuClose();
                                    handleOpenReportDialog();
                                }} sx={{color: '#ff5252', gap: 1}}>
                                    <ReportIcon sx={{fontSize: 18}}/> Báo cáo
                                </MenuItem>
                            </Menu>
                        </Box>
                    )}
                </Box>

                {/* Thông tin hồ sơ Section */}
                <Box sx={{maxWidth: 1080, mx: 'auto', px: {xs: 1.5, sm: 2}, mt: -10, position: 'relative', zIndex: 1}}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            overflow: 'hidden',
                            bgcolor: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                    >
                        <Box sx={{px: {xs: 2, sm: 4}, pt: 4, pb: 4}}>
                            <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 3}}>
                                {/* Avatar Section */}
                                <Box sx={{position: 'relative'}}>
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
                                    {isMe && (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                ref={avatarInputRef}
                                                style={{display: 'none'}}
                                                onChange={handleAvatarChange}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => avatarInputRef.current?.click()}
                                                disabled={uploadingAvatar}
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    right: 0,
                                                    bgcolor: PURPLE,
                                                    color: 'white',
                                                    '&:hover': {bgcolor: '#835cd4'},
                                                    boxShadow: 3,
                                                }}
                                            >
                                                {uploadingAvatar ? <CircularProgress size={20} color="inherit"/> :
                                                    <PhotoCameraIcon sx={{fontSize: 18}}/>}
                                            </IconButton>
                                        </>
                                    )}
                                </Box>

                                {/* Info Section */}
                                <Box sx={{flex: 1, minWidth: 280}}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 2
                                    }}>
                                        <Box>
                                            <Typography variant="h4" fontWeight={800}
                                                        color="#1d1d1f">{fullName}</Typography>
                                            {joinDate && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    mt: 0.5,
                                                    color: 'text.secondary'
                                                }}>
                                                    <AccessTimeIcon sx={{fontSize: 16}}/>
                                                    <Typography variant="body2">{joinDate}</Typography>
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Action Buttons */}
                                        <Box sx={{display: 'flex', gap: 1.5}}>
                                            {!isMe ? (
                                                <>
                                                    <IconButton
                                                        onClick={() => !loggedIn ? onRequireLogin?.() : onToggleFollow?.()}
                                                        disabled={followLoading}
                                                        sx={{
                                                            bgcolor: isFollowing ? PURPLE : 'rgba(157, 110, 237, 0.1)',
                                                            color: isFollowing ? 'white' : PURPLE,
                                                            width: 40, height: 40, borderRadius: 2
                                                        }}
                                                    >
                                                        {isFollowing ? <PersonRemoveIcon fontSize="small"/> :
                                                            <PersonAddIcon fontSize="small"/>}
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={handleChat}
                                                        disabled={chatLoading}
                                                        sx={{
                                                            bgcolor: 'rgba(157, 110, 237, 0.1)',
                                                            color: PURPLE,
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 2
                                                        }}
                                                    >
                                                        {chatLoading ? <CircularProgress size={18} color="inherit"/> :
                                                            <ChatIcon fontSize="small"/>}
                                                    </IconButton>
                                                </>
                                            ) : (
                                                <Button
                                                    variant="outlined"
                                                    startIcon={editing ? <CloseIcon/> : <EditIcon/>}
                                                    onClick={() => setEditing(!editing)}
                                                    sx={{borderRadius: 2, borderColor: PURPLE, color: PURPLE}}
                                                >
                                                    {editing ? 'Hủy' : 'Chỉnh sửa'}
                                                </Button>
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Stats Grid */}
                                    <Box sx={{
                                        display: 'grid',
                                        gridTemplateColumns: {
                                            xs: 'repeat(2, 1fr)',
                                            sm: 'repeat(3, 1fr)',
                                            md: 'repeat(5, 1fr)'
                                        },
                                        gap: 2,
                                        mt: 3,
                                        p: 2,
                                        bgcolor: 'rgba(157, 110, 237, 0.05)',
                                        borderRadius: 3
                                    }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Đánh giá</Typography>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                                <Typography variant="h6" fontWeight={700}>{reputationScore}</Typography>
                                                <StarIcon sx={{fontSize: 18, color: '#FFC107'}}/>
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Followers</Typography>
                                            <Typography variant="h6"
                                                        fontWeight={700}>{user.followerCount ?? 0}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Following</Typography>
                                            <Typography variant="h6"
                                                        fontWeight={700}>{user.followingCount ?? 0}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Địa chỉ</Typography>
                                            <Typography variant="body2" fontWeight={600}
                                                        noWrap>{user.address || 'Hòa Lạc'}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Edit Form */}
                            {editing && (
                                <Box sx={{mt: 3, p: 2, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid #ddd'}}>
                                    <TextField fullWidth label="Họ tên" value={editForm.fullName}
                                               onChange={(e) => setEditForm(f => ({...f, fullName: e.target.value}))}
                                               sx={{mb: 2}} size="small"/>
                                    <TextField fullWidth label="Số điện thoại" value={editForm.phoneNumber}
                                               onChange={(e) => setEditForm(f => ({...f, phoneNumber: e.target.value}))}
                                               sx={{mb: 2}} size="small"/>
                                    <TextField fullWidth multiline rows={3} label="Giới thiệu" value={editForm.bio}
                                               onChange={(e) => setEditForm(f => ({...f, bio: e.target.value}))}
                                               sx={{mb: 2}} size="small"/>
                                    <Button variant="contained"
                                            startIcon={saving ? <CircularProgress size={18} color="inherit"/> :
                                                <SaveIcon/>} onClick={handleSave} disabled={saving}>Lưu thay
                                        đổi</Button>
                                </Box>
                            )}
                            {error && <Typography color="error" variant="body2" sx={{mt: 2}}>{error}</Typography>}
                        </Box>
                    </Paper>
                </Box>
        </>
    );
}

