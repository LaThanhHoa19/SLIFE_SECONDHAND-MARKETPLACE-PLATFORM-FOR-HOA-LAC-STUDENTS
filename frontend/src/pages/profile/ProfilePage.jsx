import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
  Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { useAuth } from '../../hooks/useAuth';
import { useFollowActions } from '../../hooks/useFollowActions';
import * as userApi from '../../api/userApi';
import * as followApi from '../../api/followApi';
import * as chatApi from '../../api/chatApi';
import { getListings } from '../../api/listingApi';
import Loading from '../../components/common/Loading';
import { fullImageUrl } from '../../utils/constants';
import { DETAIL_PAGE_MAX_WIDTH } from '../../utils/layoutConstants';
import { unwrapApiData } from '../../utils/apiPayload';
import { useToast } from '../../context/ToastContext';
import { DARK_DIALOG_PAPER_PROPS } from '../../components/common/dialogStyles';

// Sub-components
import ProfileHeader from '../../components/profile/ProfileHeader';
import FollowListDialog from '../../components/profile/FollowListDialog';
import RatingSection from '../../components/profile/RatingSection';
import ReviewList from '../../components/profile/ReviewList';
import ListingSection from '../../components/profile/ListingSection';
import ReportDialog from '../../components/report/ReportDialog';

// Mock Data
import { MOCK_REVIEWS } from './mockData';

function getPayload(res) {
  return unwrapApiData(res);
}

function formatJoinDate(createdAt) {
  if (!createdAt) return null;
  const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  if (isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  return `Tham gia từ ${String(m).padStart(2, '0')}/${y}`;
}

// fullImageUrl imported from utils/constants.

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
  const [, setSuccessMessage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListMode, setFollowListMode] = useState('followers');
  const [showAllListings, setShowAllListings] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { showToast } = useToast();
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const { followLoading, toggleFollow } = useFollowActions({
    user: currentUser,
    updateAuthUser,
  });

  const isMe = !id || id === 'me' || (currentUser && String(currentUser.id) === String(id));

  const loadUser = useCallback(async () => {
    // Nếu là trang "me" mà không có user -> không làm gì (hoặc AppRouter sẽ đá ra login)
    if (!id && !currentUser) return;
    setLoading(true);
    setError(null);
    try {
      if (!id || id === 'me') {
        try {
          const res = await userApi.getUser();
          const data = getPayload(res);
          if (data) {
            setProfileUser(data);
          }
        } catch (err) {
          console.error("Failed to load current user:", err);
          if (currentUser) {
            setProfileUser(currentUser);
          } else {
            setError('Bạn cần đăng nhập để xem thông tin này.');
          }
        }
      } else if (/^\d+$/.test(String(id))) {
        const res = await userApi.getUserById(id);
        setProfileUser(getPayload(res));
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
    if (!profileUser?.id) return;
    setListingsLoading(true);
    try {
      const res = await getListings({ sellerId: profileUser.id, size: 50 });
      const data = getPayload(res);
      const list = Array.isArray(data) ? data : data?.content ?? [];
      setListings(list);
    } catch (err) {
      console.error("Failed to load listings:", err);
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }, [profileUser?.id, profileUser?.fullName, profileUser?.full_name]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => { if (profileUser?.id) loadListings(); }, [profileUser?.id, loadListings]);
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
      setSuccessMessage('');
      showToast('Đã lưu thay đổi.', 'success');
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
        setSuccessMessage('');
        showToast(`Đã cập nhật ${isCover ? 'ảnh bìa' : 'avatar'}.`, 'success');
      }
    } catch (err) {
      setError(err?.message || 'Tải ảnh thất bại.');
    } finally {
      if (isCover) { setUploadingCover(false); setCoverPreviewUrl(null); }
      else setUploadingAvatar(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!profileUser?.id || isMe) return;
    setError(null);
    await toggleFollow({
      targetUserId: profileUser.id,
      isFollowing: profileUser.isFollowedByViewer === true,
      isAuthenticated: !!currentUser,
      onUnauthenticated: () => navigate('/login'),
      onSuccess: (nextIsFollowing) => {
        setProfileUser((p) => ({
          ...p,
          isFollowedByViewer: nextIsFollowing,
          followerCount: nextIsFollowing
              ? (p.followerCount ?? 0) + 1
              : Math.max(0, (p.followerCount ?? 0) - 1),
        }));
      },
      onError: (err) => {
        setError(err?.message || 'Không thể cập nhật trạng thái theo dõi.');
      },
    });
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

  if (loading && !profileUser) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  
  if (!profileUser) {
    const needLogin = !id || id === 'me';
    return (
      <Box p={3} textAlign="center">
        <Typography>
          {needLogin ? 'Vui lòng đăng nhập để xem trang cá nhân của bạn.' : 'Không tìm thấy người dùng.'}
        </Typography>
        <Button 
          sx={{ mt: 2 }} 
          variant="contained" 
          onClick={() => navigate(needLogin ? '/login' : '/')}
        >
          {needLogin ? 'Đăng nhập' : 'Về trang chủ'}
        </Button>
      </Box>
    );
  }

  const user = isMe ? (profileUser ?? currentUser) : profileUser;
  const rawProfileId = user?.id;
  const followListUserId =
      rawProfileId != null && /^\d+$/.test(String(rawProfileId)) ? Number(rawProfileId) : null;

  const handleOpenFollowList = (mode) => {
    if (followListUserId == null) return;
    setFollowListMode(mode);
    setFollowListOpen(true);
  };

  const avatarUrl = fullImageUrl(user.avatarUrl ?? user.avatar_url) || user.avatarUrl;
  const displayCoverUrl = coverPreviewUrl || (fullImageUrl(user.coverImageUrl ?? user.cover_image_url) || user.coverImageUrl);
  const fullName = user.fullName ?? user.full_name ?? 'Người dùng';
  const bio = user.bio || 'Người bán uy tín, chuyên đồ điện tử và gia dụng.';
  const reputationScore = user.reputationScore ?? user.reputation_score ?? 4.8;
  const joinDate = formatJoinDate(user.createdAt ?? user.created_at);
  const phoneVerified = !!(user.phoneNumber ?? user.phone_number) || !isMe;

  return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'transparent', pb: 6 }}>
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
            isFollowing={!!user.isFollowedByViewer}
            followLoading={followLoading}
            onToggleFollow={handleToggleFollow}
            loggedIn={!!currentUser}
            onRequireLogin={() => navigate('/login')}
            followListUserId={followListUserId}
            onOpenFollowList={handleOpenFollowList}
        />

        <FollowListDialog
            open={followListOpen}
            onClose={() => setFollowListOpen(false)}
            mode={followListMode}
            userId={followListUserId}
        />

        <Box sx={{ maxWidth: DETAIL_PAGE_MAX_WIDTH, mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '350px 1fr' }, gap: 3, mt: 3 }}>
            {/* Sidebar: Giới thiệu + Xác minh */}
            <Box sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              height: 'fit-content'
            }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, color: 'white', letterSpacing: '0.5px' }}>Giới thiệu</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 4, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.7 }}>{editing ? editForm.bio : bio}</Typography>

              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, color: 'white', letterSpacing: '0.5px' }}>Xác minh thông tin</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {phoneVerified
                      ? <CheckCircleIcon fontSize="small" sx={{ color: '#4ade80' }} />
                      : <WarningAmberIcon fontSize="small" sx={{ color: '#fbbf24' }} />}
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{phoneVerified ? 'Số điện thoại đã xác minh' : 'Số điện thoại chưa xác minh'}</Typography>
                </Box>
              </Box>
              {!isMe && <RatingSection reputationScore={reputationScore} ratingCount={137} />}
            </Box>

            {/* Main Content: Tabs + Content */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden'
            }}>
              <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  sx={{
                    px: 2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    '& .MuiTabs-indicator': { bgcolor: '#6366f1', height: 3 },
                    '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.5)', fontWeight: 700, textTransform: 'none', py: 2 },
                    '& .Mui-selected': { color: '#6366f1 !important' }
                  }}
              >
                {!isMe && <Tab label="Đang bán" />}
                {!isMe && <Tab label="Đã bán" />}
                <Tab label="Đánh giá" />
              </Tabs>
              <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
                {!isMe && tab === 0 && <ListingSection isMe={false} listings={showAllListings ? listings.filter(l => l.status !== 'SOLD' && l.status !== 'HIDDEN' && l.status !== 'DELETED') : listings.filter(l => l.status !== 'SOLD' && l.status !== 'HIDDEN' && l.status !== 'DELETED').slice(0, 5)} showAll={showAllListings} setShowAll={setShowAllListings} onNavigateDetail={(l) => navigate(`/listings/${l.id || l.listingId}`)} emptyMessage="Chưa có tin đăng nào." />}
                {!isMe && tab === 1 && <ListingSection isMe={false} listings={listings.filter(l => l.status === 'SOLD')} isSold showAll={true} emptyMessage="Chưa có tin nào đã bán." onNavigateDetail={(l) => navigate(`/listings/${l.id || l.listingId}`)} />}
                {((!isMe && tab === 2) || (isMe && tab === 0)) && <ReviewList reviews={showAllReviews ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, 5)} showAll={showAllReviews} setShowAll={setShowAllReviews} />}
              </Box>
            </Box>
          </Box>
        </Box>

        <ReportDialog
            open={reportDialogOpen}
            onClose={() => setReportDialogOpen(false)}
            targetType="USER"
            targetId={profileUser?.id}
            targetTitle={profileUser?.fullName || profileUser?.full_name}
        />
      </Box>
  );
}
