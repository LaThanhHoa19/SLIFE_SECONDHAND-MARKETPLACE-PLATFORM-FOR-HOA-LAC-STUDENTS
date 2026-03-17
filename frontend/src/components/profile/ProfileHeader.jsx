import { useState } from 'react';
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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import ForumIcon from '@mui/icons-material/Forum';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

const PAGE_BG = '#1C1B23';
const CARD_BG = '#201D26';
const BORDER = 'rgba(255, 255, 255, 0.07)';
const TEXT_PRI = 'rgba(255, 255, 255, 0.95)';
const TEXT_SEC = 'rgba(255, 255, 255, 0.55)';
const PURPLE = '#9D6EED';
const GRADIENT = 'linear-gradient(135deg, #2D2A3A 0%, #1C1B23 100%)';

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
  error
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
                px: 2,
                fontWeight: 700,
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
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
            borderRadius: 6,
            overflow: 'hidden',
            bgcolor: CARD_BG,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
            border: `1px solid ${BORDER}`,
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
                  {fullName.charAt(0).toUpperCase()}
                </Avatar>
                {user.isOnline && !isMe && (
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
                        '&:hover': { bgcolor: '#835cd4' },
                        boxShadow: 3,
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
                      <Typography variant="h4" fontWeight={800} sx={{ color: TEXT_PRI, letterSpacing: '-0.02em' }}>
                        {fullName}
                      </Typography>
                      {user.isOnline && !isMe && (
                        <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600, display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          ● Đang hoạt động
                        </Typography>
                      )}
                    </Box>
                    {joinDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: TEXT_SEC }}>
                        <AccessTimeIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">{joinDate}</Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {!isMe ? (
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <IconButton
                          sx={{
                            bgcolor: 'rgba(157, 110, 237, 0.12)',
                            color: PURPLE,
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            border: `1px solid ${BORDER}`,
                            '&:hover': { bgcolor: PURPLE, color: '#fff', borderColor: PURPLE },
                            transition: 'all 0.2s ease'
                          }}
                          title="Chia sẻ"
                        >
                          <ShareIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          sx={{
                            bgcolor: 'rgba(157, 110, 237, 0.12)',
                            color: PURPLE,
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            border: `1px solid ${BORDER}`,
                            '&:hover': { bgcolor: PURPLE, color: '#fff', borderColor: PURPLE },
                            transition: 'all 0.2s ease'
                          }}
                          title="Theo dõi"
                        >
                          <PersonAddIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={handleChat}
                          disabled={chatLoading}
                          sx={{
                            bgcolor: 'rgba(157, 110, 237, 0.12)',
                            color: PURPLE,
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            border: `1px solid ${BORDER}`,
                            '&:hover': { bgcolor: PURPLE, color: '#fff', borderColor: PURPLE },
                            transition: 'all 0.2s ease'
                          }}
                          title="Nhắn tin"
                        >
                          {chatLoading ? <CircularProgress size={18} color="inherit" /> : <ChatIcon fontSize="small" />}
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          size="medium"
                          startIcon={editing ? <CloseIcon /> : <EditIcon />}
                          onClick={() => setEditing(!editing)}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 2,
                            borderColor: PURPLE,
                            color: PURPLE,
                            px: 3,
                            '&:hover': { borderColor: '#B289FF', bgcolor: 'rgba(157, 110, 237, 0.08)' },
                          }}
                        >
                          {editing ? 'Hủy' : 'Chỉnh sửa trang cá nhân'}
                        </Button>
                        <IconButton
                          sx={{
                            bgcolor: 'rgba(157, 110, 237, 0.12)',
                            color: PURPLE,
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            border: `1px solid ${BORDER}`,
                            '&:hover': { bgcolor: PURPLE, color: '#fff', borderColor: PURPLE },
                            transition: 'all 0.2s ease'
                          }}
                          title="Chia sẻ trang của bạn"
                        >
                          <ShareIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Box>

                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 2,
                  mt: 3,
                  p: 2.5,
                  bgcolor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 3,
                  border: `1px solid ${BORDER}`,
                }}>
                  <Box>
                    <Typography variant="caption" color={TEXT_SEC} display="block" sx={{ mb: 0.5 }}>Đánh giá</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="h6" fontWeight={800} color={TEXT_PRI}>{reputationScore}</Typography>
                      <StarIcon sx={{ fontSize: 18, color: '#FFC107' }} />
                      <Typography variant="caption" color={TEXT_SEC}>({ratingCount})</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color={TEXT_SEC} display="block" sx={{ mb: 0.5 }}>Đã bán</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ShoppingBagIcon sx={{ fontSize: 18, color: PURPLE }} />
                      <Typography variant="h6" fontWeight={800} color={TEXT_PRI}>{user.soldCount || '45'}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color={TEXT_SEC} display="block" sx={{ mb: 0.5 }}>Người theo dõi</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 18, color: PURPLE }} />
                      <Typography variant="h6" fontWeight={800} color={TEXT_PRI}>{user.followers || '1.2k'}</Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" color={TEXT_SEC} display="block" sx={{ mb: 0.5 }}>Địa chỉ</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
                      <LocationOnIcon sx={{ fontSize: 18, color: PURPLE }} />
                      <Typography variant="body2" fontWeight={700} color={TEXT_PRI} noWrap>{user.address || 'Hòa Lạc'}</Typography>
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
