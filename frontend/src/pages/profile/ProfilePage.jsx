/**
 * Trang cá nhân: xem/sửa thông tin, avatar, tin đăng của user.
 * Route: /profile/me (chính mình) hoặc /profile/:id (xem người khác).
 * API: GET /api/users/me, GET /api/users/:id, PUT /api/users/me, GET /api/listings.
 */
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import StarIcon from '@mui/icons-material/Star';
import { useAuth } from '../../hooks/useAuth';
import * as userApi from '../../api/userApi';
import { getListings } from '../../api/listingApi';
import ListingCard from '../../components/listing/ListingCard';
import Loading from '../../components/common/Loading';

function getPayload(res) {
  const body = res?.data;
  return body?.data ?? body;
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '', bio: '' });

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
    if (profileUser && isMe) loadListings();
    else if (profileUser) loadListings();
  }, [profileUser, isMe, loadListings]);

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
    try {
      await userApi.updateUser({
        fullName: editForm.fullName,
        phoneNumber: editForm.phoneNumber,
        bio: editForm.bio,
      });
      setProfileUser((prev) => ({ ...prev, ...editForm }));
      setEditing(false);
    } catch (err) {
      setError(err?.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profileUser) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
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

  const avatarUrl = user.avatarUrl ?? user.avatar_url;
  const fullName = user.fullName ?? user.full_name ?? 'Người dùng';
  const email = user.email ?? '';
  const phone = user.phoneNumber ?? user.phone_number ?? '';
  const bio = user.bio ?? '';
  const reputationScore = user.reputationScore ?? user.reputation_score ?? 5;
  const role = user.role ?? 'USER';

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 3, px: 2 }}>
      <Paper elevation={0} sx={{ overflow: 'hidden', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        {/* Cover + avatar */}
        <Box
          sx={{
            height: 140,
            bgcolor: 'primary.main',
            background: 'linear-gradient(135deg, #2d2a33 0%, #1a1820 100%)',
          }}
        />
        <Box sx={{ px: 3, pb: 3, mt: -5 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2 }}>
            <Avatar
              src={avatarUrl}
              sx={{
                width: 100,
                height: 100,
                border: 3,
                borderColor: 'background.paper',
                bgcolor: 'primary.light',
              }}
            >
              {fullName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight={600}>
                  {fullName}
                </Typography>
                {role !== 'USER' && (
                  <Chip
                    size="small"
                    label={role === 'ADMIN' ? 'Quản trị' : role}
                    color={role === 'ADMIN' ? 'error' : 'default'}
                    variant="outlined"
                  />
                )}
                {isMe && (
                  <IconButton
                    size="small"
                    onClick={() => setEditing(!editing)}
                    aria-label={editing ? 'Hủy sửa' : 'Chỉnh sửa'}
                  >
                    {editing ? <CloseIcon /> : <EditIcon />}
                  </IconButton>
                )}
              </Box>
              {!editing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <StarIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Điểm uy tín: {Number(reputationScore).toFixed(1)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {editing ? (
            <Box component="form" sx={{ mt: 3 }} onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Họ tên"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Giới thiệu"
                    value={editForm.bio}
                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
                    disabled={saving}
                  >
                    Lưu thay đổi
                  </Button>
                  <Button sx={{ ml: 1 }} onClick={() => setEditing(false)}>
                    Hủy
                  </Button>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {isMe ? email : `${email.replace(/(.{2}).*(@.*)/, '$1***$2')}`}
                  </Typography>
                </Box>
                {phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {phone}
                    </Typography>
                  </Box>
                )}
                {bio && (
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                    {bio}
                  </Typography>
                )}
              </Box>
            </>
          )}

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Tin đăng */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Tin đăng
      </Typography>
      {listingsLoading ? (
        <Loading />
      ) : listings.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Chưa có tin đăng nào.</Typography>
          {isMe && (
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate('/listings/new')}
            >
              Đăng tin
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {listings.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id ?? item.listingId}>
              <ListingCard
                listing={item}
                onClick={(l) => l?.id && navigate(`/listings/${l.id}`)}
                showPrice
                showStatus
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
