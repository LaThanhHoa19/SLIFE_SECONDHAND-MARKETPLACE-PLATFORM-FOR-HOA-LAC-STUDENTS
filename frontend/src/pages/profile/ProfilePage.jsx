import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import GridOnIcon from '@mui/icons-material/GridOn';
import ListIcon from '@mui/icons-material/List';
import StarIcon from '@mui/icons-material/Star';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SellIcon from '@mui/icons-material/Sell';

import { useAuth } from '../../hooks/useAuth';
import { useFollowActions } from '../../hooks/useFollowActions';
import * as userApi from '../../api/userApi';
import * as followApi from '../../api/followApi';
import { getListings } from '../../api/listingApi';
import { getCommunityPostsByAuthor } from '../../api/communityApi';
import Loading from '../../components/common/Loading';
import { fullImageUrl } from '../../utils/constants';
import { DETAIL_PAGE_MAX_WIDTH } from '../../utils/layoutConstants';
import { unwrapApiData } from '../../utils/apiPayload';
import { useToast } from '../../context/ToastContext';
import { DARK_DIALOG_PAPER_PROPS } from '../../components/common/dialogStyles';
import { firebaseAuth } from '../../lib/firebase';
import { isUserNotFoundError } from '../../utils/apiError';
import { useBlockActions } from '../../hooks/useBlockActions';
import BlockUserConfirmDialog from '../../components/social/BlockUserConfirmDialog';

// Sub-components
import ProfileHeader from '../../components/profile/ProfileHeader';
import FollowListDialog from '../../components/profile/FollowListDialog';
import ListingSection from '../../components/profile/ListingSection';
import ReviewSection from '../../components/profile/ReviewSection';
import CommunityPostCard from '../../components/community/CommunityPostCard';
import ReportDialog from '../../components/report/ReportDialog';

const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

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

/** Gộp payload user từ API — đồng bộ xác thực SĐT và trạng thái hiển thị để tránh stale UI khi BE bỏ sót field. */
function applyUserProfilePatch(prev, patch) {
  if (!patch || typeof patch !== 'object') return prev || {};
  const prevObj = prev || {};
  const next = { ...prevObj, ...patch };

  const hasExplicitPhoneInPatch =
      Object.prototype.hasOwnProperty.call(patch, 'phoneNumber') ||
      Object.prototype.hasOwnProperty.call(patch, 'phone_number');
  const patchPhone = patch.phoneNumber ?? patch.phone_number;
  const prevPhone = prevObj.phoneNumber ?? prevObj.phone_number;
  const phoneChanged =
      prev != null &&
      hasExplicitPhoneInPatch &&
      String(patchPhone ?? '') !== String(prevPhone ?? '');

  const phoneVerifiedAtInPatch =
      Object.prototype.hasOwnProperty.call(patch, 'phoneVerifiedAt') ||
      Object.prototype.hasOwnProperty.call(patch, 'phone_verified_at');
  const atFromPatch = patch.phoneVerifiedAt ?? patch.phone_verified_at;

  let at = next.phoneVerifiedAt ?? next.phone_verified_at;
  if (phoneVerifiedAtInPatch) {
    at = atFromPatch ?? null;
  } else if (phoneChanged) {
    at = null;
  }

  const hasExplicitShowPhoneInPatch =
      Object.prototype.hasOwnProperty.call(patch, 'showPhoneNumber') ||
      Object.prototype.hasOwnProperty.call(patch, 'show_phone_number');
  const showPhoneFromPatch = patch.showPhoneNumber ?? patch.show_phone_number;
  if (hasExplicitShowPhoneInPatch) {
    const visible = Boolean(showPhoneFromPatch);
    next.showPhoneNumber = visible;
    next.show_phone_number = visible;
  }

  const verified = at != null && at !== '';
  next.phoneVerified = verified;
  next.phone_verified = verified;
  next.phoneVerifiedAt = at ?? null;
  next.phone_verified_at = at ?? null;
  return next;
}

// fullImageUrl imported from utils/constants.

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, updateUser: updateAuthUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '', bio: '', showPhoneNumber: true });
  const [tab, setTab] = useState(location.state?.profileTab === 'posts' ? 0 : 1);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [, setSuccessMessage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListMode, setFollowListMode] = useState('followers');
  const [showAllListings, setShowAllListings] = useState(false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [lastOtpPhone, setLastOtpPhone] = useState('');
  const [otpCooldownUntil, setOtpCooldownUntil] = useState(0);
  const [otpCooldownNow, setOtpCooldownNow] = useState(Date.now());
  const [viewMode, setViewMode] = useState('grid');
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const { blockUserById } = useBlockActions();
  const { showToast } = useToast();
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  /** Container DOM cho invisible reCAPTCHA — không dùng display:none (script Google cần node có layout). */
  const recaptchaContainerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  const clearRecaptchaVerifier = useCallback(() => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (_) {
        /* noop */
      }
      recaptchaVerifierRef.current = null;
    }
  }, []);
  const { followLoading, toggleFollow } = useFollowActions({
    user: currentUser,
    updateAuthUser,
  });

  const isMe = !id || id === 'me' || (currentUser && (String(currentUser.id) === String(id) || String(currentUser.code) === String(id)));

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
            setProfileUser(applyUserProfilePatch(null, data));
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
        const payload = getPayload(res);
        if (payload) setProfileUser(applyUserProfilePatch(null, payload));
      } else {
        try {
          const res = await userApi.getUserById(id);
          const data = getPayload(res);
          if (data) setProfileUser(applyUserProfilePatch(null, data));
        } catch (err) {
          setError(
              isUserNotFoundError(err)
                  ? 'PROFILE_UNAVAILABLE'
                  : err?.message || 'Không tải được thông tin người dùng.',
          );
        }
      }
    } catch (err) {
      if (isUserNotFoundError(err) && !isMe) {
        setError('PROFILE_UNAVAILABLE');
      } else {
        setError(err?.message || 'Không tải được thông tin người dùng.');
      }
      if (isMe && currentUser) setProfileUser(currentUser);
    } finally {
      setLoading(false);
    }
  }, [id, isMe, currentUser]);

  const loadCommunityPosts = useCallback(async () => {
    if (!profileUser?.id) return;
    setCommunityLoading(true);
    try {
      const res = await getCommunityPostsByAuthor(profileUser.id, { page: 0, size: 30 });
      const data = getPayload(res);
      const items = Array.isArray(data?.content) ? data.content : [];
      setCommunityPosts(items);
    } catch (err) {
      console.error('Failed to load community posts:', err);
      setCommunityPosts([]);
    } finally {
      setCommunityLoading(false);
    }
  }, [profileUser?.id]);

  const loadListings = useCallback(async () => {
    if (!profileUser?.id) return;
    setListingsLoading(true);
    try {
      const normalizeList = (payload) => (Array.isArray(payload) ? payload : payload?.content ?? []);
      const dedupeById = (items) => {
        const map = new Map();
        (Array.isArray(items) ? items : []).forEach((item) => {
          const key = item?.id ?? item?.listingId ?? item?.listing_id;
          if (key != null) map.set(String(key), item);
        });
        return Array.from(map.values());
      };

      // 1) Luôn lấy danh sách theo seller
      const baseRes = await getListings({ sellerId: profileUser.id, size: 50 });
      const baseData = getPayload(baseRes);
      let list = normalizeList(baseData);

      // 2) Lấy riêng tin SOLD để đảm bảo tab Đã bán luôn có dữ liệu (cả hồ sơ của mình và người khác)
      try {
        const soldRes = await getListings({ sellerId: profileUser.id, status: 'SOLD', size: 50 });
        const soldData = getPayload(soldRes);
        const soldList = normalizeList(soldData);
        list = dedupeById([...list, ...soldList]);
      } catch (e) {
        console.error('Lỗi khi tải danh sách tin đã bán:', e);
      }

      setListings(list);
    } catch (err) {
      console.error('Failed to load listings:', err);
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }, [profileUser?.id]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => {
    if (profileUser?.id) {
      loadListings();
      loadCommunityPosts();
    }
  }, [profileUser?.id, loadListings, loadCommunityPosts]);
  useEffect(() => {
    if (profileUser) {
      const rawPhone = String(profileUser.phoneNumber ?? profileUser.phone_number ?? '').trim();
      let normalizedPhone = rawPhone;
      if (rawPhone.startsWith('+84')) {
        normalizedPhone = rawPhone.substring(3);
      } else if (rawPhone.startsWith('0')) {
        normalizedPhone = rawPhone.substring(1);
      }

      setEditForm({
        fullName: profileUser.fullName ?? profileUser.full_name ?? '',
        phoneNumber: normalizedPhone,
        bio: profileUser.bio ?? '',
        showPhoneNumber: profileUser.showPhoneNumber ?? profileUser.show_phone_number ?? true,
      });
    }
  }, [profileUser]);
  useEffect(() => () => {
    clearRecaptchaVerifier();
  }, [clearRecaptchaVerifier]);
  useEffect(() => {
    if (!otpCooldownUntil) return undefined;
    const timer = window.setInterval(() => {
      setOtpCooldownNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpCooldownUntil]);

  const sourcePhoneForOtp = (editing ? editForm.phoneNumber : (profileUser?.phoneNumber ?? profileUser?.phone_number ?? '')).trim();
  const normalizePhoneNumber = useCallback((phone) => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (phone.startsWith('+')) {
      return phone;
    }
    // Nếu là chuỗi 9 số (không có 0 đầu), nối +84
    if (clean.length === 9 && !clean.startsWith('0')) {
      return '+84' + clean;
    }
    // Nếu có 0 đầu, đổi 0 thành +84
    return clean.replace(/^0/, '+84');
  }, []);

  useEffect(() => {
    if (!lastOtpPhone) return;
    const normalizedCurrent = sourcePhoneForOtp ? normalizePhoneNumber(sourcePhoneForOtp) : '';
    if (normalizedCurrent && normalizedCurrent === lastOtpPhone) return;
    // Phone changed after OTP request: invalidate old OTP session.
    setOtpSent(false);
    setOtpCode('');
    setConfirmationResult(null);
    setOtpCooldownUntil(0);
  }, [sourcePhoneForOtp, lastOtpPhone, normalizePhoneNumber]);

  const handleSave = async () => {
    if (!isMe) return;
    setSaving(true);
    setError(null);
    try {
      const payloadToSave = {
        ...editForm,
        phoneNumber: editForm.phoneNumber ? `+84${editForm.phoneNumber}` : null,
        showPhoneNumber: Boolean(editForm.showPhoneNumber),
      };
      const res = await userApi.updateUser(payloadToSave);
      const patch = getPayload(res);
      if (patch == null || typeof patch !== 'object') {
        showToast('Đã lưu nhưng không nhận được dữ liệu người dùng từ máy chủ.', 'warning');
        return;
      }

      const mergedPatch = {
        ...patch,
        showPhoneNumber: Object.prototype.hasOwnProperty.call(patch, 'showPhoneNumber') || Object.prototype.hasOwnProperty.call(patch, 'show_phone_number')
            ? patch.showPhoneNumber ?? patch.show_phone_number
            : payloadToSave.showPhoneNumber,
      };

      setProfileUser((prev) => applyUserProfilePatch(prev, mergedPatch));
      if (updateAuthUser) updateAuthUser(applyUserProfilePatch(currentUser || {}, mergedPatch));
      setEditing(false);
      setSuccessMessage('');
      showToast('Đã lưu thay đổi.', 'success');
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Cập nhật thất bại.');
    } finally { setSaving(false); }
  };

  const handleRequestPhoneOtp = async () => {
    if (!sourcePhoneForOtp) {
      showToast('Vui lòng nhập số điện thoại trước khi xác thực.', 'warning');
      return;
    }
    const cooldownLeftMs = otpCooldownUntil - Date.now();
    if (cooldownLeftMs > 0) {
      const secondsLeft = Math.ceil(cooldownLeftMs / 1000);
      showToast(`Vui lòng đợi ${secondsLeft}s trước khi gửi lại OTP.`, 'warning');
      return;
    }
    setSendingPhoneOtp(true);
    try {
      const normalizedPhone = normalizePhoneNumber(sourcePhoneForOtp);

      if (!recaptchaContainerRef.current) {
        showToast('Không tìm thấy vùng xác thực. Vui lòng tải lại trang.', 'error');
        return;
      }

      // Create verifier once; dùng HTMLElement thay vì id (tránh race với MUI).
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, recaptchaContainerRef.current, {
          size: 'invisible',
        });
        await recaptchaVerifierRef.current.render();
      }

      const result = await signInWithPhoneNumber(firebaseAuth, normalizedPhone, recaptchaVerifierRef.current);
      console.info('[PhoneVerify] send OTP success', {
        phone: normalizedPhone,
        origin: window.location.origin,
        host: window.location.host,
        firebaseProjectId: firebaseAuth?.app?.options?.projectId,
      });
      setConfirmationResult(result);
      setOtpSent(true);
      setLastOtpPhone(normalizedPhone);
      setOtpCooldownUntil(Date.now() + OTP_RESEND_COOLDOWN_MS);
      showToast('Đã gửi mã OTP. Vui lòng kiểm tra điện thoại.', 'success');
    } catch (err) {
      clearRecaptchaVerifier();
      const code = err?.code || '';
      console.error('[PhoneVerify] send OTP failed', {
        code,
        message: err?.message,
        name: err?.name,
        origin: window.location.origin,
        host: window.location.host,
        phoneInput: sourcePhoneForOtp,
        normalizedPhone: normalizePhoneNumber(sourcePhoneForOtp),
        firebaseProjectId: firebaseAuth?.app?.options?.projectId,
        recaptchaExists: !!recaptchaVerifierRef.current,
      });
      if (code === 'auth/invalid-app-credential') {
        showToast('Không thể gửi OTP lúc này. Vui lòng thử lại sau ít phút.', 'error');
      } else if (code === 'auth/invalid-phone-number') {
        showToast('Số điện thoại chưa đúng định dạng. Vui lòng kiểm tra lại.', 'warning');
      } else if (code === 'auth/too-many-requests') {
        showToast('Bạn thao tác quá nhanh. Vui lòng thử lại sau.', 'warning');
      } else {
        showToast('Gửi OTP thất bại. Vui lòng thử lại.', 'error');
      }
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async (overrideCode) => {
    if (!confirmationResult) {
      showToast('Bạn cần gửi OTP trước.', 'warning');
      return false;
    }
    const codeToVerify = overrideCode || otpCode;
    if (!codeToVerify || codeToVerify.trim().length !== 6) {
      showToast('OTP phải gồm 6 chữ số.', 'warning');
      return false;
    }
    setVerifyingPhoneOtp(true);
    try {
      const credential = await confirmationResult.confirm(codeToVerify.trim());
      const idToken = await credential.user.getIdToken();
      const verifyRes = await userApi.verifyPhoneWithFirebase({ idToken });
      const fromVerify = getPayload(verifyRes);
      console.info('[PhoneVerify] confirm OTP success', {
        origin: window.location.origin,
        host: window.location.host,
        firebaseProjectId: firebaseAuth?.app?.options?.projectId,
      });
      // Nguồn đúng: GET /api/users/me sau khi BE đã flush phone_verified_at.
      try {
        const meRes = await userApi.getUser();
        const fresh = getPayload(meRes);
        if (fresh) {
          setProfileUser(applyUserProfilePatch(null, fresh));
          if (updateAuthUser) updateAuthUser(applyUserProfilePatch(currentUser || {}, fresh));
        } else if (fromVerify) {
          setProfileUser((prev) => applyUserProfilePatch(prev, fromVerify));
          if (updateAuthUser) updateAuthUser(applyUserProfilePatch(currentUser || {}, fromVerify));
        }
      } catch (refreshErr) {
        console.warn('[PhoneVerify] refresh profile after verify failed', refreshErr);
        if (fromVerify) {
          setProfileUser((prev) => applyUserProfilePatch(prev, fromVerify));
          if (updateAuthUser) updateAuthUser(applyUserProfilePatch(currentUser || {}, fromVerify));
        }
      }
      setOtpCode('');
      setOtpSent(false);
      setConfirmationResult(null);
      setLastOtpPhone('');
      setOtpCooldownUntil(0);
      clearRecaptchaVerifier();
      showToast('Xác thực số điện thoại thành công.', 'success');
      return true;
    } catch (err) {
      const code = err?.code || '';
      console.error('[PhoneVerify] confirm OTP failed', {
        code,
        message: err?.message,
        name: err?.name,
      });
      if (code === 'auth/invalid-verification-code') {
        showToast('Mã OTP không đúng. Vui lòng kiểm tra và nhập lại.', 'warning');
      } else if (code === 'auth/code-expired' || code === 'auth/session-expired') {
        showToast('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.', 'warning');
      } else if (code === 'auth/too-many-requests') {
        showToast('Bạn thử quá nhiều lần. Vui lòng chờ một chút rồi thử lại.', 'warning');
      } else {
        showToast('Xác thực OTP thất bại. Vui lòng thử lại.', 'error');
      }
      return false;
    } finally {
      setVerifyingPhoneOtp(false);
    }
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

  const handleChat = () => {
    const firstListing = listings[0];
    if (!firstListing?.id) return;
    navigate(`/chat?listingId=${firstListing.id}`);
  };

  const handleOpenReportUserDialog = useCallback(() => {
    if (!currentUser) {
      showToast('Bạn cần đăng nhập để báo cáo người dùng.', 'warning');
      navigate('/login');
      return;
    }
    setReportDialogOpen(true);
  }, [currentUser, navigate, showToast]);

  if (loading && !profileUser) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;

  if (!profileUser) {
    const needLogin = !id || id === 'me';
    const profileUnavailable = error === 'PROFILE_UNAVAILABLE';
    return (
        <Box
            p={3}
            textAlign="center"
            sx={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.88)', maxWidth: 440, lineHeight: 1.65 }}>
            {needLogin
                ? 'Vui lòng đăng nhập để xem trang cá nhân của bạn.'
                : profileUnavailable
                    ? 'Không thể hiển thị trang này. Có thể người dùng không tồn tại hoặc một trong hai bên đã chặn — hai phía sẽ không thấy hồ sơ của nhau.'
                    : error || 'Không tìm thấy người dùng.'}
          </Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate(needLogin ? '/login' : '/feed')}>
            {needLogin ? 'Đăng nhập' : 'Về bảng tin'}
          </Button>
          {!needLogin && profileUnavailable && currentUser && (
              <Button sx={{ mt: 1 }} variant="text" onClick={() => navigate('/settings/blocked')}>
                Danh sách đã chặn
              </Button>
          )}
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
  const otpCooldownLeftSeconds = Math.max(0, Math.ceil((otpCooldownUntil - otpCooldownNow) / 1000));
  const otpCooldownActive = otpCooldownLeftSeconds > 0;

  return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'transparent', pb: 6 }}>
        {isMe && (
            <Box
                ref={recaptchaContainerRef}
                aria-hidden
                sx={{
                  position: 'fixed',
                  left: 0,
                  bottom: 0,
                  width: 1,
                  height: 1,
                  overflow: 'hidden',
                  opacity: 0,
                  pointerEvents: 'none',
                  zIndex: -1,
                }}
            />
        )}
        <ProfileHeader
            user={user} isMe={isMe} editing={editing} setEditing={setEditing} saving={saving}
            handleSave={handleSave} editForm={editForm} setEditForm={setEditForm}
            avatarUrl={avatarUrl} displayCoverUrl={displayCoverUrl} fullName={fullName}
            joinDate={joinDate} reputationScore={reputationScore} ratingCount={ratingCount}
            handleOpenReportDialog={handleOpenReportUserDialog}
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
            sendingPhoneOtp={sendingPhoneOtp}
            verifyingPhoneOtp={verifyingPhoneOtp}
            otpSent={otpSent}
            otpCode={otpCode}
            setOtpCode={setOtpCode}
            onRequestPhoneOtp={handleRequestPhoneOtp}
            onVerifyPhoneOtp={handleVerifyPhoneOtp}
            otpCooldownActive={otpCooldownActive}
            otpCooldownLeftSeconds={otpCooldownLeftSeconds}
            canBlock={!!currentUser && !isMe}
            onOpenBlockDialog={() => setBlockDialogOpen(true)}
        />

        <FollowListDialog
            open={followListOpen}
            onClose={() => setFollowListOpen(false)}
            mode={followListMode}
            userId={followListUserId}
        />

        <Box sx={{ maxWidth: 1000, width: { xs: '100%', sm: '86%' }, mx: 'auto', px: { xs: 0, sm: 2 } }}>
          {/* Main Content: Tabs + Content */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'transparent',
            borderRadius: 0,
            overflow: 'hidden',
            px: { xs: 1.5, sm: 0 },
            mb: 2,
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
                <Tab icon={<Tooltip title="Bài viết"><ChatBubbleOutlineIcon /></Tooltip>} />
                <Tab icon={<Tooltip title="Tất cả bài đăng"><GridOnIcon /></Tooltip>} />
                <Tab icon={<Tooltip title="Đã bán"><SellIcon /></Tooltip>} />
                <Tab icon={<Tooltip title="Đánh giá"><StarIcon /></Tooltip>} />
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
              {tab === 0 && (
                  <Box sx={{ display: 'grid', gap: 1.2 }}>
                    {communityLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={26} /></Box>
                    ) : communityPosts.length === 0 ? (
                        <Typography sx={{ color: 'rgba(255,255,255,0.72)', textAlign: 'center', py: 4 }}>Chưa có bài viết cộng đồng nào.</Typography>
                    ) : (
                        communityPosts.map((p) => (
                            <CommunityPostCard
                                key={p.id}
                                post={p}
                                onDeletePost={(postId) => setCommunityPosts((prev) => prev.filter((x) => Number(x.id) !== Number(postId)))}
                                onPatchPost={(postId, patch) => setCommunityPosts((prev) => prev.map((x) => (Number(x.id) === Number(postId) ? { ...x, ...patch } : x)))}
                            />
                        ))
                    )}
                  </Box>
              )}
              {tab === 1 && <ListingSection isMe={isMe} viewMode={viewMode} listings={showAllListings ? listings.filter(l => l.status !== 'SOLD' && l.status !== 'HIDDEN' && l.status !== 'MOD_HIDDEN' && l.status !== 'DELETED') : listings.filter(l => l.status !== 'SOLD' && l.status !== 'HIDDEN' && l.status !== 'MOD_HIDDEN' && l.status !== 'DELETED').slice(0, 12)} showAll={showAllListings} setShowAll={setShowAllListings} onNavigateDetail={(l) => navigate(`/listings/${l.code || l.id || l.listingId}`)} emptyMessage="Chưa có tin đăng nào." />}
              {tab === 2 && <ListingSection isMe={isMe} viewMode={viewMode} listings={listings.filter((l) => String(l?.status || l?.itemStatus || '').toUpperCase() === 'SOLD')} isSold showAll={true} emptyMessage="Chưa có tin nào đã bán." onNavigateDetail={(l) => navigate(`/listings/${l.code || l.id || l.listingId}`)} />}
              {tab === 3 && (
                  <ReviewSection userId={profileUser?.id} />
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

        {!isMe && profileUser?.id && (
            <BlockUserConfirmDialog
                open={blockDialogOpen}
                onClose={() => setBlockDialogOpen(false)}
                displayName={fullName}
                onConfirm={() => blockUserById(profileUser.id).then(() => navigate('/feed'))}
            />
        )}
      </Box>
  );
}
