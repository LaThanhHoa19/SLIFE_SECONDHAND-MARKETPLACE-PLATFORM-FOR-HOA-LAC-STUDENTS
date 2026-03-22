import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
  Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { useAuth } from '../../hooks/useAuth';
import * as userApi from '../../api/userApi';
import * as chatApi from '../../api/chatApi';
import { getListings } from '../../api/listingApi';
import { createReport } from '../../api/reportApi';
import Loading from '../../components/common/Loading';
import { API_BASE_URL } from '../../utils/constants';

// Sub-components
import ProfileHeader from '../../components/profile/ProfileHeader';
import RatingSection from '../../components/profile/RatingSection';
import ReviewList from '../../components/profile/ReviewList';
import ListingSection from '../../components/profile/ListingSection';

// Mock Data
import { MOCK_REVIEWS } from './mockData';

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
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportEvidence, setReportEvidence] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [showAllListings, setShowAllListings] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
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
        try {
          const res = await userApi.getUserById(id);
          const data = getPayload(res);
          setProfileUser(data);
        } catch(err) {
          setError('Không tải được thông tin người dùng.');
        }
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
      const targetId = profileUser?.id;
      const filtered = targetId
          ? list.filter((item) => {
            const sellerId = item.sellerId ?? item.seller?.id ?? item.seller?.userId ?? item.seller?.user_id;
            // fall back to name filter if ID is not available in the listing's seller object
            if (sellerId != null && targetId != null) return String(sellerId) === String(targetId);
            const sellerName = item.sellerName ?? item.sellerSummary?.fullName ?? item.sellerSummary ?? item.seller?.fullName ?? item.seller?.full_name;
            const name = profileUser?.fullName ?? profileUser?.full_name;
            return name && sellerName === name;
          })
          : list;
      setListings(filtered);
    } catch {
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }, [profileUser]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => { if (profileUser) loadListings(); }, [profileUser, loadListings]);
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
      const res = await userApi.updateUser(editForm);
      const updated = getPayload(res) ?? editForm;
      setProfileUser((prev) => ({ ...prev, ...updated }));
      if (updateAuthUser) updateAuthUser(updated);
      setEditing(false);
      setSuccessMessage('Đã lưu thay đổi.');
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Cập nhật thất bại.');
    } finally { setSaving(false); }
  };

  const handleFileChange = async (file, type) => {
    if (!file || !isMe) return;
    const isCover = type === 'cover';
    if (isCover) {
      setCoverPreviewUrl(URL.createObjectURL(file));
      setUploadingCover(true);
    } else setUploadingAvatar(true);
    setError(null);
    try {
      const res = isCover ? await userApi.uploadCover(file) : await userApi.uploadAvatar(file);
      const payload = getPayload(res);
      if (payload) {
        setProfileUser((prev) => ({ ...prev, ...payload }));
        if (!isCover && updateAuthUser) updateAuthUser(payload);
        setSuccessMessage(`Đã cập nhật ${isCover ? 'ảnh bìa' : 'avatar'}.`);
      }
    } catch (err) {
      setError(err?.message || 'Tải ảnh thất bại.');
    } finally {
      if (isCover) { setUploadingCover(false); setCoverPreviewUrl(null); }
      else setUploadingAvatar(false);
    }
  };

  const handleChat = async () => {
    const firstListing = listings[0];
    if (!firstListing?.id) return;
    setChatLoading(true);
    try {
      const res = await chatApi.getSession(firstListing.id);
      const sessionId = res?.data?.data ?? res?.data;
      if (sessionId) navigate(`/chat?sessionId=${sessionId}`);
    } catch (e) { console.error(e); }
    finally { setChatLoading(false); }
  };

  const handleSubmitReport = async () => {
    if (!profileUser?.id || !reportReason.trim()) return;
    setReportSubmitting(true);
    try {
      await createReport({ targetType: 'USER', targetId: profileUser.id, reason: reportReason.trim(), evidenceImage: reportEvidence.trim() || undefined });
      setReportDialogOpen(false);
      setSuccessMessage('Đã gửi báo cáo người dùng này.');
    } catch (err) { setError(err?.message || 'Gửi báo cáo thất bại.'); }
    finally { setReportSubmitting(false); }
  };

  if (loading && !profileUser) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (!profileUser) return <Box p={3} textAlign="center"><Typography>{isMe ? 'Bạn cần đăng nhập.' : 'Không tìm thấy người dùng.'}</Typography><Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(isMe ? '/login' : '/')}>{isMe ? 'Đăng nhập' : 'Về trang chủ'}</Button></Box>;

  const user = isMe ? (profileUser ?? currentUser) : profileUser;
  const avatarUrl = fullImageUrl(user.avatarUrl ?? user.avatar_url) || user.avatarUrl;
  const displayCoverUrl = coverPreviewUrl || (fullImageUrl(user.coverImageUrl ?? user.cover_image_url) || user.coverImageUrl);
  const fullName = user.fullName ?? user.full_name ?? 'Người dùng';
  const bio = user.bio || 'Người bán uy tín, chuyên đồ điện tử và gia dụng.';
  const reputationScore = user.reputationScore ?? user.reputation_score ?? 4.8;
  const joinDate = formatJoinDate(user.createdAt ?? user.created_at);
  const phoneVerified = !!(user.phoneNumber ?? user.phone_number) || !isMe;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f7', pb: 6 }}>
      <ProfileHeader
        user={user} isMe={isMe} editing={editing} setEditing={setEditing} saving={saving}
        handleSave={handleSave} editForm={editForm} setEditForm={setEditForm}
        avatarUrl={avatarUrl} displayCoverUrl={displayCoverUrl} fullName={fullName}
        joinDate={joinDate} reputationScore={reputationScore} ratingCount={137}
        chatLoading={chatLoading} handleOpenReportDialog={() => setReportDialogOpen(true)}
        handleCoverChange={(e) => handleFileChange(e.target.files[0], 'cover')}
        handleAvatarChange={(e) => handleFileChange(e.target.files[0], 'avatar')}
        coverInputRef={coverInputRef} avatarInputRef={avatarInputRef}
        uploadingCover={uploadingCover} uploadingAvatar={uploadingAvatar}
        handleChat={handleChat} error={error}
      />

      <Box sx={{ maxWidth: 1080, mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '350px 1fr' }, mt: 2 }}>
          <Box sx={{ p: 4, bgcolor: 'rgba(0,0,0,0.01)', borderRight: { md: '1px solid rgba(0,0,0,0.06)' } }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Giới thiệu</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 4 }}>{editing ? editForm.bio : bio}</Typography>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>Xác minh thông tin</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><CheckCircleIcon fontSize="small" color="success" /><Typography variant="body2">Email đã xác minh</Typography></Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {phoneVerified ? <CheckCircleIcon fontSize="small" color="success" /> : <WarningAmberIcon fontSize="small" color="warning" />}
                <Typography variant="body2">{phoneVerified ? 'SĐT đã xác minh' : 'SĐT chưa xác minh'}</Typography>
              </Box>
            </Box>
            {!isMe && <RatingSection reputationScore={reputationScore} ratingCount={137} />}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Tab label="Đang bán" /><Tab label="Đã bán" /><Tab label="Đánh giá" />
            </Tabs>
            <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
              {tab === 0 && <ListingSection isMe={isMe} listings={showAllListings ? listings.filter(l => l.status !== 'SOLD' && l.status !== 'HIDDEN' && l.status !== 'DELETED') : listings.filter(l => l.status !== 'SOLD' && l.status !== 'HIDDEN' && l.status !== 'DELETED').slice(0, 5)} showAll={showAllListings} setShowAll={setShowAllListings} onNavigateNew={() => navigate('/listings/new')} onNavigateDetail={(l) => navigate(`/listings/${l.id || l.listingId}`)} emptyMessage="Chưa có tin đăng nào." />}
              {tab === 1 && <ListingSection isMe={isMe} listings={listings.filter(l => l.status === 'SOLD')} isSold showAll={true} emptyMessage="Chưa có tin nào đã bán." onNavigateDetail={(l) => navigate(`/listings/${l.id || l.listingId}`)} />}
              {tab === 2 && <ReviewList reviews={showAllReviews ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, 5)} showAll={showAllReviews} setShowAll={setShowAllReviews} />}
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar open={!!successMessage} autoHideDuration={4000} onClose={() => setSuccessMessage('')} message={successMessage} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
      <Dialog open={reportDialogOpen} onClose={() => !reportSubmitting && setReportDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Báo cáo người dùng</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>Mô tả lý do bạn báo cáo người dùng này.</Typography>
          <TextField label="Lý do báo cáo" value={reportReason} onChange={(e) => setReportReason(e.target.value)} fullWidth multiline minRows={3} sx={{ mb: 2 }} autoFocus />
          <TextField label="Link bằng chứng (tùy chọn)" value={reportEvidence} onChange={(e) => setReportEvidence(e.target.value)} fullWidth placeholder="Ví dụ: link ảnh, đoạn chat..." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmitReport} disabled={reportSubmitting || !reportReason.trim()}>{reportSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
