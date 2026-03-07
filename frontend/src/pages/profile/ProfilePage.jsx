/**
 * Trang cá nhân theo wireframe SLIFE: ảnh bìa, avatar, 2 cột (Giới thiệu + Thông tin công khai | Tab Bài đăng/Đánh giá/Lịch sử).
 * Route: /profile/me hoặc /profile/:id.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ChatIcon from '@mui/icons-material/Chat';
import ReportIcon from '@mui/icons-material/Report';
import { useAuth } from '../../hooks/useAuth';
import * as userApi from '../../api/userApi';
import { getListings } from '../../api/listingApi';
import ProfileListingCard from '../../components/profile/ProfileListingCard';
import Loading from '../../components/common/Loading';
import { API_BASE_URL } from '../../utils/constants';

function getPayload(res) {
  const body = res?.data;
  return body?.data ?? body;
}

function formatJoinDate(createdAt) {
  if (!createdAt) return null;
  const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  return `Tham gia từ ${String(m).padStart(2, '0')}/${y}`;
}

/** Trả về URL đầy đủ cho avatar/cover (backend trả về path dạng /uploads/...). */
function fullImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = API_BASE_URL.replace(/\/$/, '');
  return url.startsWith('/') ? base + url : base + '/' + url;
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser: updateAuthUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '', bio: '' });
  const [tab, setTab] = useState(0);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const isMe = id === 'me' || (currentUser && String(currentUser.id) === String(id));

  const loadUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      if (id === 'me') {
        try {
          const res = await userApi.getUser();
          const data = getPayload(res);
          setProfileUser(data ?? currentUser);
        } catch {
          setProfileUser(currentUser);
        }
      } else {
        const res = await userApi.getUserById(id);
        const data = getPayload(res);
        if (!data && res?.data) setProfileUser(res.data);
        else setProfileUser(data ?? null);
      }
    } catch (err) {
      setError(err?.message || 'Không tải được thông tin người dùng.');
      if (isMe && currentUser) setProfileUser(currentUser);
    } finally {
      setLoading(false);
    }
  }, [id, isMe, currentUser]);

  const loadListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const res = await getListings();
      const data = getPayload(res);
      const list = Array.isArray(data) ? data : data?.content ?? [];
      const name = profileUser?.fullName ?? profileUser?.full_name;
      const filtered = name
        ? list.filter((item) => {
            const seller = item.sellerSummary ?? item.seller?.fullName ?? item.seller?.full_name;
            return seller === name;
          })
        : list;
      setListings(filtered);
    } catch {
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }, [profileUser?.fullName, profileUser?.full_name]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (profileUser) loadListings();
  }, [profileUser, loadListings]);

  useEffect(() => {
    if (profileUser) {
      setEditForm({
        fullName: profileUser.fullName ?? profileUser.full_name ?? '',
        phoneNumber: profileUser.phoneNumber ?? profileUser.phone_number ?? '',
        bio: profileUser.bio ?? '',
      });
    }
  }, [profileUser]);

  const handleSave = async () => {
    if (!isMe) return;
    setSaving(true);
    setError(null);
    try {
      const res = await userApi.updateUser({
        fullName: editForm.fullName,
        phoneNumber: editForm.phoneNumber,
        bio: editForm.bio,
      });
      const payload = getPayload(res);
      const updated = payload ?? editForm;
      setProfileUser((prev) => ({ ...prev, ...updated }));
      if (updateAuthUser) updateAuthUser(updated);
      setEditing(false);
      setSuccessMessage('Đã lưu thay đổi.');
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isMe) return;
    setCoverPreviewUrl(URL.createObjectURL(file));
    setUploadingCover(true);
    setError(null);
    try {
      const res = await userApi.uploadCover(file);
      const payload = getPayload(res);
      if (payload) {
        setProfileUser((prev) => ({ ...prev, ...payload }));
        setCoverPreviewUrl(null);
        setSuccessMessage('Đã cập nhật ảnh bìa.');
      }
    } catch (err) {
      setCoverPreviewUrl(null);
      setError(err?.message || err?.response?.data?.message || 'Tải ảnh bìa thất bại.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isMe) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const res = await userApi.uploadAvatar(file);
      const payload = getPayload(res);
      if (payload) {
        setProfileUser((prev) => ({ ...prev, ...payload }));
        if (updateAuthUser) updateAuthUser(payload);
        setSuccessMessage('Đã cập nhật avatar.');
      }
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Tải avatar thất bại.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  if (loading && !profileUser) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !profileUser) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">{error}</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      </Box>
    );
  }

  const user = isMe ? (profileUser ?? currentUser) : profileUser;
  if (!user) {
    return (
      <Box p={3} textAlign="center">
        <Typography>
          {isMe ? 'Bạn cần đăng nhập để xem trang cá nhân.' : 'Không tìm thấy người dùng.'}
        </Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(isMe ? '/login' : '/')}>
          {isMe ? 'Đăng nhập' : 'Về trang chủ'}
        </Button>
      </Box>
    );
  }

  const avatarUrl = fullImageUrl(user.avatarUrl ?? user.avatar_url);
  const coverFromDb = user.coverImageUrl ?? user.cover_image_url;
  const displayCoverUrl = coverPreviewUrl || fullImageUrl(coverFromDb);
  const fullName = user.fullName ?? user.full_name ?? 'Người dùng';
  const bio = user.bio || 'Người bán uy tín, chuyên đồ điện tử và gia dụng.';
  const reputationScore = user.reputationScore ?? user.reputation_score ?? 4.8;
  const joinDate = formatJoinDate(user.createdAt ?? user.created_at);
  const ratingCount = 126;
  const successDeals = 54;
  const reportCount = 0;
  const emailVerified = true;
  const phoneVerified = !!(user.phoneNumber ?? user.phone_number);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8f7fc 0%, #f0edf8 100%)',
        pb: 4,
      }}
    >
      {/* Ảnh bìa + nút đổi ảnh bìa (chỉ khi là chính mình) */}
      <Box
        sx={{
          height: { xs: 180, sm: 220 },
          background: displayCoverUrl
            ? `url(${displayCoverUrl}) center/cover`
            : 'linear-gradient(135deg, #3d3752 0%, #2d2a33 40%, #1a1820 100%)',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        {isMe && (
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
                bottom: 16,
                right: 16,
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                bgcolor: 'rgba(255,255,255,0.95)',
                color: 'grey.800',
                border: '1px solid rgba(0,0,0,0.12)',
                '&:hover': { bgcolor: '#fff' },
              }}
            >
              {uploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa'}
            </Button>
          </>
        )}
      </Box>

      <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 1.5, sm: 2 }, mt: -9, position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid',
            borderColor: 'rgba(0,0,0,0.06)',
          }}
        >
          {/* Avatar + tên, ngày tham gia, rating, Chat/Báo cáo */}
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 3, pb: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 112,
                    height: 112,
                    border: 4,
                    borderColor: 'background.paper',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                  }}
                >
                  {fullName.charAt(0).toUpperCase()}
                </Avatar>
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
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': { bgcolor: 'primary.dark' },
                        boxShadow: 2,
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
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h5" fontWeight={700} sx={{ color: 'grey.900', letterSpacing: '-0.02em' }}>
                    {fullName}
                  </Typography>
                  {isMe && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={editing ? <CloseIcon /> : <EditIcon />}
                      onClick={() => setEditing(!editing)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.dark',
                          color: 'primary.dark',
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      {editing ? 'Hủy' : 'Chỉnh sửa'}
                    </Button>
                  )}
                </Box>
                {joinDate && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {joinDate}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                    <Typography variant="body2" fontWeight={600}>
                      {Number(reputationScore).toFixed(1)} ({ratingCount} đánh giá)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {successDeals} giao dịch thành công
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Email & SĐT được ẩn (Public)
                </Typography>
                {!isMe && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ChatIcon />}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Chat
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ReportIcon />}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Báo cáo
                    </Button>
                  </Box>
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

          <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
          {/* 2 cột: Trái = Giới thiệu + Thông tin công khai | Phải = Tabs + nội dung */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '320px 1fr' },
              minHeight: 320,
            }}
          >
            {/* Cột trái */}
            <Box
              sx={{
                p: 3,
                borderRight: { md: 1 },
                borderBottom: { xs: 1, md: 0 },
                borderColor: 'divider',
                bgcolor: { md: 'grey.50' },
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: 'grey.800' }}>
                Giới thiệu
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {editing ? editForm.bio : bio}
              </Typography>

              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1.5, color: 'grey.800' }}>
                Thông tin công khai
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon fontSize="small" color="success" />
                  <Typography variant="body2">Email đã xác minh</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {phoneVerified ? (
                    <>
                      <CheckCircleIcon fontSize="small" color="success" />
                      <Typography variant="body2">SĐT đã xác minh</Typography>
                    </>
                  ) : (
                    <>
                      <WarningAmberIcon fontSize="small" color="warning" />
                      <Typography variant="body2">SĐT chưa xác minh</Typography>
                    </>
                  )}
                </Box>
                {reportCount > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon fontSize="small" color="warning" />
                    <Typography variant="body2">{reportCount} lần bị báo cáo</Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Cột phải: Tabs */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  px: 2,
                  minHeight: 52,
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                  '& .Mui-selected': { color: 'primary.main' },
                  '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
                }}
              >
                <Tab label="Bài đăng" />
                <Tab label="Đánh giá" />
                <Tab label="Lịch sử" />
              </Tabs>
              <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                {tab === 0 && (
                  <>
                    {isMe && (
                      <Box sx={{ mb: 2 }}>
                        <Button
                          startIcon={<AddIcon />}
                          variant="contained"
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(157, 110, 237, 0.35)',
                            '&:hover': { boxShadow: '0 4px 12px rgba(157, 110, 237, 0.45)' },
                          }}
                          onClick={() => navigate('/listings/new')}
                        >
                          Đăng tin
                        </Button>
                      </Box>
                    )}
                    {listingsLoading ? (
                      <Loading />
                    ) : listings.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography color="text.secondary">Chưa có tin đăng nào.</Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                          gap: 2,
                        }}
                      >
                        {listings.map((item) => (
                          <ProfileListingCard
                            key={item.id ?? item.listingId}
                            listing={item}
                            onClick={(l) => l?.id && navigate(`/listings/${l.id}`)}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                )}
                {tab === 1 && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Phần đánh giá đang được phát triển.</Typography>
                  </Box>
                )}
                {tab === 2 && (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Lịch sử giao dịch đang được phát triển.</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: {
            bgcolor: 'success.main',
            color: 'white',
            borderRadius: 2,
          },
        }}
      />
    </Box>
  );
}
