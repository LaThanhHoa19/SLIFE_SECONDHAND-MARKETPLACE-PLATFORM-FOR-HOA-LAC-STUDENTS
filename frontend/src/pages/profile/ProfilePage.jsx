import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import GridOnIcon from '@mui/icons-material/GridOn';
import ListIcon from '@mui/icons-material/List';
import StarOutlineIcon from '@mui/icons-material/StarOutline';

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
  const [viewMode, setViewMode] = useState('grid');
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
  const reputationScore = user.reputationScore ?? user.reputation_score ?? 0;
  const ratingCount = user.ratingCount ?? user.rating_count ?? 0;
  const joinDate = formatJoinDate(user.createdAt ?? user.created_at);
  const phoneVerified = !!(user.phoneNumber ?? user.phone_number) || !isMe;

  return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'transparent', pb: 6 }}>
        <ProfileHeader
            user={user} isMe={isMe} editing={editing} setEditing={setEditing} saving={saving}
            handleSave={handleSave} editForm={editForm} setEditForm={setEditForm}
            avatarUrl={avatarUrl} displayCoverUrl={displayCoverUrl} fullName={fullName}
            joinDate={joinDate} reputationScore={reputationScore} ratingCount={ratingCount}
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
            listingCount={listings.length}
        />

        <FollowListDialog
            open={followListOpen}
            onClose={() => setFollowListOpen(false)}
            mode={followListMode}
            userId={followListUserId}
        />

        <Box sx={{ maxWidth: 935, mx: 'auto', px: { xs: 0, sm: 2 } }}>
          {/* Main Content: Tabs + Content */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'transparent',
            borderRadius: 0,
            overflow: 'hidden'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  centered
                  sx={{
                    px: 2,
                    '& .MuiTabs-indicator': { 
                      bgcolor: 'white', 
                      height: 1.5, 
                      bottom: 0,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    },
                    '& .MuiTab-root': { 
                      color: 'rgba(255, 255, 255, 0.4)', 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      fontSize: '0.75rem',
                      letterSpacing: '1px',
                      py: 2,
                      minWidth: { xs: 80, sm: 160 },
                      mx: { xs: 0.5, sm: 2 },
                      flexDirection: 'row',
                      gap: 1.5,
                      minHeight: 52,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '& .MuiSvgIcon-root': {
                        fontSize: 20,
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      },
                      '&.Mui-selected': { 
                        color: 'white !important',
                        '& .MuiSvgIcon-root': { transform: 'scale(1.2)' },
                      }
                    }
                  }}
              >
                <Tab icon={<Tooltip title="Tất cả bài đăng"><GridOnIcon /></Tooltip>} />
                <Tab icon={<Tooltip title="Bài đăng đã bán"><ShoppingBagIcon /></Tooltip>} />
                <Tab icon={<Tooltip title="Đánh giá"><StarOutlineIcon /></Tooltip>} />
              </Tabs>

              {/* Grid/List View Filter */}
              <Box sx={{ 
                position: 'absolute', 
                right: 0, 
                height: '100%', 
                display: { xs: 'none', sm: 'flex' }, 
                alignItems: 'center', 
                gap: 1, 
                pr: 2 
              }}>
                <IconButton 
                  onClick={() => setViewMode('grid')} 
                  sx={{ color: viewMode === 'grid' ? '#0095f6' : 'rgba(255,255,255,0.3)' }}
                >
                  <GridOnIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  onClick={() => setViewMode('list')} 
                  sx={{ color: viewMode === 'list' ? '#0095f6' : 'rgba(255,255,255,0.3)' }}
                >
                  <ListIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ flex: 1, p: { xs: 0.1, sm: 0.5 } }}>
              {tab === 0 && <ListingSection isMe={isMe} viewMode={viewMode} listings={showAllListings ? listings.filter(l => l.status !== 'SOLD' && l.status !== 'HIDDEN' && l.status !== 'DELETED') : listings.filter(l => l.status !== 'SOLD' && l.status !== 'HIDDEN' && l.status !== 'DELETED').slice(0, 12)} showAll={showAllListings} setShowAll={setShowAllListings} onNavigateDetail={(l) => navigate(`/listings/${l.id || l.listingId}`)} emptyMessage="Chưa có tin đăng nào." />}
              {tab === 1 && <ListingSection isMe={isMe} viewMode={viewMode} listings={listings.filter(l => l.status === 'SOLD')} isSold showAll={true} emptyMessage="Chưa có tin nào đã bán." onNavigateDetail={(l) => navigate(`/listings/${l.id || l.listingId}`)} />}
              {tab === 2 && (
                <Box sx={{ px: { xs: 1.5, sm: 3 }, py: 3 }}>
                  {!isMe && <RatingSection reputationScore={reputationScore} ratingCount={137} sx={{ mb: 3 }} />}
                  <ReviewList reviews={showAllReviews ? MOCK_REVIEWS : MOCK_REVIEWS.slice(0, 12)} showAll={showAllReviews} setShowAll={setShowAllReviews} />
                </Box>
              )}
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
