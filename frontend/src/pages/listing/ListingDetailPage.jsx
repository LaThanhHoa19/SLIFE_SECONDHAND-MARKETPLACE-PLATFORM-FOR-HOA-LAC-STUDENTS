/**
 * Trang chi tiết listing – thiết kế đồng bộ với Feed (dark theme).
 * Bố cục: Gallery bên trái | Thông tin + Hành động bên phải
 * Phần bên dưới: Bình luận | Tin khác của người bán | Tin tương tự
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Card,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  Alert,
  TextField,
  Tooltip,
  Typography,
  Button,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import FlagIcon from '@mui/icons-material/Flag';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SendIcon from '@mui/icons-material/Send';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import StorefrontIcon from '@mui/icons-material/Storefront';

import { getListing, getListings } from '../../api/listingApi';
import * as chatApi from '../../api/chatApi';
import { getUserById } from '../../api/userApi';
import { fullImageUrl } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';

// ─── Hằng số màu sắc đồng bộ với Feed ───────────────────────────────────────
const DARK_BG   = '#1C1B23';
const CARD_BG   = '#201D26';
const CARD_BG2  = '#252230';
const BORDER    = 'rgba(255,255,255,0.07)';
const TEXT_PRI  = 'rgba(255,255,255,0.95)';
const TEXT_SEC  = 'rgba(255,255,255,0.55)';
const PURPLE    = '#9D6EED';
const RED       = '#FF4757';
const GREEN     = '#2ED573';

// ─── Helper ──────────────────────────────────────────────────────────────────
const getPayload = (res) => {
  const body = res?.data;
  return body?.data ?? body;
};

const toCurrency = (value) =>
  value == null ? '—' : `${Number(value).toLocaleString('vi-VN')} ₫`;

const CONDITION_MAP = {
  NEW:           { label: 'Mới',         color: GREEN },
  USED_LIKE_NEW: { label: 'Như mới',     color: '#1DD3B0' },
  USED_GOOD:     { label: 'Đã dùng – tốt', color: PURPLE },
  USED_FAIR:     { label: 'Đã dùng',     color: '#FFA502' },
};

const getConditionInfo = (condition) =>
  CONDITION_MAP[condition] || { label: condition || 'Không rõ', color: TEXT_SEC };

const getSeller = (listing) => {
  const s = listing?.sellerSummary ?? listing?.seller;
  if (s && typeof s === 'object') return s;
  return { fullName: typeof s === 'string' ? s : 'Người bán' };
};

const getLocation = (listing) => {
  const loc = listing?.location;
  if (typeof loc === 'string' && loc.trim()) return loc;
  const pa = listing?.pickupAddress;
  if (typeof pa === 'string' && pa.trim()) return pa;
  if (pa && typeof pa === 'object') return pa.locationName || pa.addressText || '';
  return '';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Card nhỏ dùng trong phần "Tin tương tự" và "Tin khác của người bán" */
function MiniListingCard({ listing }) {
  const navigate = useNavigate();
  const id = listing?.id ?? listing?.listingId;
  const images = Array.isArray(listing?.images) ? listing.images : [];
  const thumbSrc = images[0] ? fullImageUrl(images[0]) : null;

  return (
    <Card
      onClick={() => id && navigate(`/listings/${id}`)}
      sx={{
        bgcolor: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '12px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'transform 0.18s, box-shadow 0.18s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        },
      }}
    >
      <Box sx={{ position: 'relative', paddingTop: '75%', bgcolor: '#2A2535' }}>
        {thumbSrc ? (
          <Box
            component="img"
            src={thumbSrc}
            alt={listing?.title}
            sx={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <StorefrontIcon sx={{ fontSize: 32, color: TEXT_SEC, opacity: 0.5 }} />
          </Box>
        )}
        <IconButton
          size="small"
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: 'absolute', top: 6, right: 6,
            bgcolor: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.7)',
            width: 28, height: 28,
            '&:hover': { bgcolor: 'rgba(255,71,87,0.8)', color: '#fff' },
          }}
        >
          <FavoriteBorderIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>

      <Box sx={{ p: 1.2 }}>
        <Typography
          fontSize={13}
          fontWeight={500}
          color={TEXT_PRI}
          sx={{
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            lineHeight: 1.35, mb: 0.5,
          }}
        >
          {listing?.title || 'Không có tiêu đề'}
        </Typography>
        <Typography fontSize={13} fontWeight={700} color={RED}>
          {listing?.isGiveaway ? 'Cho tặng' : toCurrency(listing?.price)}
        </Typography>
      </Box>
    </Card>
  );
}

/** Gallery ảnh: ảnh chính lớn + thumbnail dưới */
function ImageGallery({ images, title, listingId, onShare, onReport, isSaved, onToggleSave }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const count = images.length;
  const src = count > 0 ? images[activeIdx] : null;

  const prev = () => setActiveIdx((i) => (i - 1 + count) % count);
  const next = () => setActiveIdx((i) => (i + 1) % count);

  return (
    <Box>
      {/* Ảnh chính */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '80%', // Cao hơn một chút
          borderRadius: '16px',
          overflow: 'hidden',
          bgcolor: '#2A2535',
        }}
      >
        {src ? (
          <Box
            component="img"
            src={src}
            alt={`${title} ${activeIdx + 1}`}
            sx={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'opacity 0.2s',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <StorefrontIcon sx={{ fontSize: 56, color: TEXT_SEC, opacity: 0.4 }} />
          </Box>
        )}

        {/* Nút Share + Save + Report góc trên */}
        <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1 }}>
          <Tooltip title={isSaved ? "Bỏ lưu tin" : "Lưu tin"}>
            <IconButton
              size="small"
              onClick={onToggleSave}
              sx={{
                bgcolor: 'rgba(0,0,0,0.55)', color: isSaved ? RED : '#fff',
                width: 36, height: 36, backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)', transform: 'scale(1.05)' },
              }}
            >
              {isSaved ? <FavoriteIcon sx={{ fontSize: 18 }} /> : <FavoriteBorderIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Chia sẻ link">
            <IconButton
              size="small"
              onClick={onShare}
              sx={{
                bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                width: 36, height: 36, backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: PURPLE, transform: 'scale(1.05)' },
              }}
            >
              <ShareIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Báo cáo tin">
            <IconButton
              size="small"
              onClick={onReport}
              sx={{
                bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                width: 36, height: 36, backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: RED, transform: 'scale(1.05)' },
              }}
            >
              <FlagIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Nút chuyển ảnh – chỉ hiện khi có nhiều hơn 1 ảnh */}
        {count > 1 && (
          <>
            <IconButton
              onClick={prev}
              sx={{
                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', width: 32, height: 32,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={next}
              sx={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', width: 32, height: 32,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
              }}
            >
              <ChevronRightIcon />
            </IconButton>
            {/* Số ảnh indicator */}
            <Box
              sx={{
                position: 'absolute', bottom: 10, right: 12,
                bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '20px',
                px: 1.2, py: 0.3,
              }}
            >
              <Typography fontSize={11} color="rgba(255,255,255,0.9)">
                {activeIdx + 1}/{count}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Thumbnails */}
      {count > 1 && (
        <Box
          sx={{
            display: 'flex', gap: 1, mt: 1.5,
            overflowX: 'auto', pb: 0.5,
            '::-webkit-scrollbar': { height: 4 },
            '::-webkit-scrollbar-thumb': { bgcolor: BORDER, borderRadius: 4 },
          }}
        >
          {images.map((img, i) => (
            <Box
              key={i}
              onClick={() => setActiveIdx(i)}
              sx={{
                flexShrink: 0,
                width: 64, height: 64,
                borderRadius: '8px',
                overflow: 'hidden',
                border: `2px solid ${i === activeIdx ? PURPLE : BORDER}`,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: PURPLE },
              }}
            >
              <Box
                component="img"
                src={img}
                alt={`thumb-${i}`}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/** Khối bình luận đơn giản */
function CommentsSection({ listingId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');

  // Placeholder – thực tế sẽ gọi commentApi khi backend sẵn sàng
  const handleSubmit = () => {
    if (!text.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        content: text,
        userId: currentUser?.id,
        userFullName: currentUser?.fullName || 'Bạn',
        userAvatar: currentUser?.avatarUrl,
        createdAt: new Date().toISOString(),
      },
    ]);
    setText('');
  };

  return (
    <Box sx={{ mt: 1 }}>
      {/* Tiêu đề */}
      <Typography fontSize={15} fontWeight={700} color={TEXT_PRI} sx={{ mb: 2 }}>
        Bình luận
      </Typography>

      {/* Danh sách bình luận */}
      {comments.length === 0 ? (
        <Typography fontSize={13} color={TEXT_SEC} sx={{ mb: 2 }}>
          Chưa có bình luận nào. Hãy là người đầu tiên!
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
          {comments.map((c) => (
            <Box key={c.id} sx={{ display: 'flex', gap: 1.2 }}>
              <Avatar
                src={fullImageUrl(c.userAvatar)}
                sx={{ width: 32, height: 32, mt: 0.3 }}
              />
              <Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography fontSize={13} fontWeight={600} color={TEXT_PRI}>
                    {c.userFullName}
                  </Typography>
                  <Typography fontSize={11} color={TEXT_SEC}>
                    {formatDate(c.createdAt)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: CARD_BG2, borderRadius: '10px', px: 1.5, py: 0.8, mt: 0.4,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <Typography fontSize={13} color={TEXT_PRI}>
                    {c.content}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Input bình luận */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Avatar
          src={fullImageUrl(currentUser?.avatarUrl)}
          sx={{ width: 34, height: 34 }}
        />
        <TextField
          fullWidth
          size="small"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder="Viết bình luận..."
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleSubmit}
                  disabled={!text.trim()}
                  sx={{ color: text.trim() ? PURPLE : TEXT_SEC }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: CARD_BG2,
              borderRadius: '24px',
              color: TEXT_PRI,
              '& fieldset': { borderColor: BORDER },
              '&:hover fieldset': { borderColor: PURPLE },
              '&.Mui-focused fieldset': { borderColor: PURPLE },
            },
            '& input::placeholder': { color: TEXT_SEC, opacity: 1 },
          }}
        />
      </Box>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [listing, setListing]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const [showPhone, setShowPhone]     = useState(false);
  const [liked, setLiked]             = useState(false);
  const [offerPrice, setOfferPrice]   = useState('');
  const [snackMsg, setSnackMsg]       = useState('');
  const [snackType, setSnackType]     = useState('success');
  const [sellerListings, setSellerListings] = useState([]);
  const [similarListings, setSimilarListings] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [isSavedItem, setIsSavedItem] = useState(false);

  // Load listing
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    getListing(id)
      .then((res) => {
        const data = getPayload(res);
        setListing(data);
        setIsSavedItem(data?.isSaved ?? false);
      })
      .catch((err) => setError(err?.message || 'Không tải được tin.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Load tin khác của người bán + tin tương tự
  // Backend không hỗ trợ sellerId param → load toàn bộ rồi filter client-side
  useEffect(() => {
    if (!listing) return;
    // Lấy seller id từ listing.seller.id (theo đúng field backend trả về)
    const sellerId = listing?.seller?.id ?? listing?.sellerSummary?.userId ?? listing?.sellerSummary?.id;
    const currentId = Number(id);

    setLoadingRelated(true);
    getListings({ size: 20 })
      .then((res) => {
        const data = getPayload(res);
        const allList = Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data) ? data : [];

        // Tin khác của cùng người bán (loại trừ tin hiện tại)
        const bySellerRaw = sellerId
          ? allList.filter((l) => {
              const lSellerId = l?.sellerSummary?.userId ?? l?.sellerSummary?.id ?? l?.seller?.id;
              return String(lSellerId) === String(sellerId) && (l.id ?? l.listingId) !== currentId;
            })
          : [];
        setSellerListings(bySellerRaw.slice(0, 6));

        // Tin tương tự: cùng điều kiện sản phẩm hoặc mức giá tương đồng, loại trừ tin hiện tại và tin của cùng seller
        const condition = listing?.condition ?? listing?.itemCondition;
        const price = Number(listing?.price ?? 0);
        const similar = allList
          .filter((l) => {
            const lId = l.id ?? l.listingId;
            if (lId === currentId) return false;
            const lSellerId = l?.sellerSummary?.userId ?? l?.sellerSummary?.id ?? l?.seller?.id;
            if (String(lSellerId) === String(sellerId)) return false; // bỏ tin của cùng seller (đã có section trên)
            // ưu tiên: cùng condition hoặc giá trong khoảng ±50%
            const lCond = l?.condition ?? l?.itemCondition;
            const lPrice = Number(l?.price ?? 0);
            const sameCondition = condition && lCond === condition;
            const similarPrice = price > 0 && lPrice > 0 && lPrice >= price * 0.5 && lPrice <= price * 1.5;
            return sameCondition || similarPrice || true; // fallback: show all other listings
          })
          .slice(0, 4);
        setSimilarListings(similar);
      })
      .catch(() => {})
      .finally(() => setLoadingRelated(false));
  }, [listing, id]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setSnackType('success');
      setSnackMsg('Đã sao chép link vào clipboard!');
    } catch {
      setSnackType('info');
      setSnackMsg(url);
    }
  };

  const handleReport = () => {
    if (!isAuthenticated) {
      setSnackType('warning');
      setSnackMsg('Bạn cần đăng nhập để báo cáo tin.');
      return;
    }
    navigate(`/report?targetType=LISTING&targetId=${id}`);
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      setSnackType('warning');
      setSnackMsg('Bạn cần đăng nhập để nhắn tin.');
      return;
    }
    setStartingChat(true);
    try {
      const res = await chatApi.getSession(listing.id);
      const sessionId = res?.data?.data ?? res?.data;
      if (sessionId) navigate(`/chat?sessionId=${sessionId}`);
    } catch {
      setSnackType('error');
      setSnackMsg('Không thể mở cuộc trò chuyện. Thử lại sau.');
    } finally {
      setStartingChat(false);
    }
  };

  const handleShowPhone = () => {
    if (!isAuthenticated) {
      setSnackType('warning');
      setSnackMsg('Bạn cần đăng nhập để xem số điện thoại.');
      return;
    }
    setShowPhone(true);
  };

  const handleOffer = async () => {
    if (!isAuthenticated) {
      setSnackType('warning');
      setSnackMsg('Bạn cần đăng nhập để trả giá.');
      return;
    }
    const amount = Number(offerPrice.replace(/[^\d]/g, ''));
    if (!amount || amount <= 0) {
      setSnackType('error');
      setSnackMsg('Vui lòng nhập giá hợp lệ.');
      return;
    }
    try {
      const res = await chatApi.getSession(listing.id);
      const sessionId = res?.data?.data ?? res?.data;
      if (sessionId) {
        await chatApi.makeOffer(sessionId, amount);
        setSnackType('success');
        setSnackMsg('Đã gửi giá trả thành công!');
        setOfferPrice('');
        navigate(`/chat?sessionId=${sessionId}`);
      }
    } catch {
      setSnackType('error');
      setSnackMsg('Không thể trả giá lúc này.');
    }
  };

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      setSnackType('warning');
      setSnackMsg('Bạn cần đăng nhập để lưu tin.');
      return;
    }
    // Gửi API update thực tế tại đây (gọi save API từ backend)
    // Tạm thời update UX ngay lập tức
    setIsSavedItem(!isSavedItem);
    setSnackType('success');
    setSnackMsg(!isSavedItem ? 'Đã lưu tin rao' : 'Đã bỏ lưu tin rao');
  };

  // ── Render loading / error ────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ px: 2, py: 3, maxWidth: 1100, mx: 'auto' }}>
        <Skeleton variant="rectangular" width={100} height={32} sx={{ bgcolor: '#2A2535', mb: 3, borderRadius: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Skeleton variant="rectangular" sx={{ bgcolor: '#2A2535', borderRadius: 2, height: 380 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} variant="rectangular" height={n === 1 ? 32 : n === 2 ? 44 : 24}
                sx={{ bgcolor: '#2A2535', borderRadius: 2, width: n === 3 ? '70%' : '100%' }} />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  if (error || !listing) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" sx={{ mb: 2 }}>{error || 'Không tìm thấy tin.'}</Typography>
        <Button
          startIcon={<ArrowBackIosNewIcon />}
          onClick={() => navigate(-1)}
          sx={{ bgcolor: CARD_BG, color: TEXT_PRI, '&:hover': { bgcolor: CARD_BG2 } }}
        >
          Quay lại
        </Button>
      </Box>
    );
  }

  // ── Dẫn xuất dữ liệu ─────────────────────────────────────────────────────
  const images = (listing?.images ?? []).map((p) => fullImageUrl(p)).filter(Boolean);
  const seller = getSeller(listing);
  const sellerId = listing.sellerId;
  const conditionInfo = getConditionInfo(listing.itemCondition);
  const locationText = getLocation(listing);
  const isOwnListing = currentUser && sellerId && String(currentUser.id) === String(sellerId);
  const phoneNumber = isAuthenticated && showPhone
    ? (listing.sellerPhone || seller?.phoneNumber || 'Không có SĐT')
    : null;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1, sm: 2 }, py: { xs: 2, sm: 3 } }}>
      {/* Nút quay lại */}
      <Button
        startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 16 }} />}
        onClick={() => navigate(-1)}
        size="small"
        sx={{
          mb: 2, color: TEXT_SEC, bgcolor: 'transparent',
          px: 1.5, py: 0.6, borderRadius: '8px', minWidth: 0,
          '&:hover': { bgcolor: CARD_BG, color: TEXT_PRI },
        }}
      >
        Quay lại
      </Button>

      {/* ═══════════════════════════════════════════════════════════════
          KHỐI CHÍNH: Gallery (trái) | Thông tin (phải)
      ══════════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          display: 'grid',
          // Tỉ lệ khoảng 55% trái - 45% phải để cân đối không gian tốt hơn
          gridTemplateColumns: { xs: '1fr', md: '5.5fr 4.5fr' },
          gap: { xs: 3, md: 4 },
          mb: 4,
        }}
      >
        {/* ── Gallery ────────────────────────────────────────── */}
        <ImageGallery
          images={images}
          title={listing.title}
          listingId={listing.id}
          onShare={handleShare}
          onReport={handleReport}
          isSaved={isSavedItem}
          onToggleSave={handleToggleSave}
        />

        {/* ── Thông tin + hành động ───────────────────────────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Đầu: Tên, Mô tả, Giá */}
          <Box>
            <Typography
              fontSize={{ xs: 20, sm: 24 }}
              fontWeight={700}
              color={TEXT_PRI}
              sx={{ lineHeight: 1.3, mb: 1.5 }}
            >
              {listing.title}
            </Typography>

            {listing.description && (
              <Typography
                fontSize={15}
                color={TEXT_SEC}
                sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap', mb: 2 }}
              >
                {listing.description}
              </Typography>
            )}

            <Typography
              fontSize={{ xs: 24, sm: 30 }}
              fontWeight={800}
              color={listing.isGiveaway ? GREEN : RED}
              sx={{ mb: 2.5 }}
            >
              {listing.isGiveaway ? 'Cho tặng miễn phí' : toCurrency(listing.price)}
            </Typography>

            {/* Meta thông tin: Location, Time, Condition */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                {locationText && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 18, color: PURPLE }} />
                    <Typography fontSize={14} color={TEXT_PRI}>{locationText}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <AccessTimeOutlinedIcon sx={{ fontSize: 18, color: PURPLE }} />
                  <Typography fontSize={14} color={TEXT_PRI}>
                    {formatDate(listing.createdAt) || 'Vừa đăng'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LocalOfferOutlinedIcon sx={{ fontSize: 18, color: PURPLE }} />
                  <Chip
                    label={conditionInfo.label}
                    size="small"
                    sx={{
                      bgcolor: `${conditionInfo.color}22`,
                      color: conditionInfo.color,
                      border: `1px solid ${conditionInfo.color}44`,
                      fontSize: 12, fontWeight: 600, height: 24, paddingX: 1
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Nút hành động chính: Điện thoại, Nhắn tin */}
          {!isOwnListing && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleShowPhone}
                sx={{
                  py: 2.5, borderRadius: '14px', border: `1px solid ${BORDER}`, bgcolor: CARD_BG,
                  color: TEXT_PRI, display: 'flex', flexDirection: 'column', gap: 1,
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: CARD_BG2, borderColor: PURPLE, color: PURPLE }
                }}
              >
                <PhoneAndroidIcon sx={{ fontSize: 36, color: phoneNumber ? GREEN : 'inherit' }} />
                {phoneNumber ? (
                   <Typography fontSize={16} fontWeight={700} color={GREEN}>{phoneNumber}</Typography>
                ) : null}
              </Button>
              <Button
                variant="outlined"
                onClick={handleChat}
                disabled={startingChat}
                sx={{
                  py: 2.5, borderRadius: '14px', border: `1px solid ${BORDER}`, bgcolor: CARD_BG,
                  color: TEXT_PRI, display: 'flex', flexDirection: 'column', gap: 1,
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: CARD_BG2, borderColor: PURPLE, color: PURPLE }
                }}
              >
                <ChatBubbleOutlineIcon sx={{ fontSize: 36 }} />
              </Button>
            </Box>
          )}

          <Divider sx={{ borderColor: BORDER }} />

          {/* Thông tin người bán - Layout mới */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={fullImageUrl(seller?.avatarUrl)}
                alt={seller?.fullName}
                sx={{ width: 52, height: 52, cursor: 'pointer', border: `2px solid ${PURPLE}` }}
                onClick={() => sellerId && navigate(`/profile/${sellerId}`)}
              />
              <Box>
                <Typography
                  fontSize={15}
                  fontWeight={700}
                  color={TEXT_PRI}
                  sx={{ cursor: 'pointer', '&:hover': { color: PURPLE }, mb: 0.5 }}
                  onClick={() => sellerId && navigate(`/profile/${sellerId}`)}
                >
                  {seller?.fullName || 'Người bán'}
                </Typography>
                <Chip
                  label="Xem trang"
                  onClick={() => sellerId && navigate(`/profile/${sellerId}`)}
                  sx={{
                    height: 22, fontSize: 11, fontWeight: 600,
                    bgcolor: `${PURPLE}22`, color: PURPLE,
                    '&:hover': { bgcolor: `${PURPLE}44` }, cursor: 'pointer'
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* Đã bán */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography fontSize={16} fontWeight={800} color={TEXT_PRI}>
                  {seller?.totalSold ?? 10}
                </Typography>
                <Typography fontSize={12} color={TEXT_SEC} sx={{ mt: -0.2 }}>Đã bán</Typography>
              </Box>
              {/* Đánh giá */}
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
                  <Typography fontSize={16} fontWeight={800} color={TEXT_PRI}>
                    {Number(seller?.reputationScore ?? 5).toFixed(1)}
                  </Typography>
                  <StarIcon sx={{ fontSize: 14, color: '#FFC107', mt: -0.2 }} />
                </Box>
                <Typography fontSize={12} color={TEXT_SEC} sx={{ mt: -0.2 }}>
                  {seller?.reviewCount ?? 34} đánh giá
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Khối trả giá */}
          {!isOwnListing && !listing.isGiveaway && (
            <Box
              sx={{
                bgcolor: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: '12px',
                p: 2, mt: 1
              }}
            >
              <Typography fontSize={13} fontWeight={600} color={TEXT_SEC} sx={{ mb: 1.2 }}>
                Deal giá
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOffer()}
                  placeholder="Nhập giá bạn mong muốn ₫"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography fontSize={13} color={TEXT_SEC}>₫</Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: CARD_BG2, borderRadius: '8px', color: TEXT_PRI,
                      '& fieldset': { borderColor: BORDER },
                      '&:hover fieldset': { borderColor: PURPLE },
                      '&.Mui-focused fieldset': { borderColor: PURPLE },
                    },
                    '& input::placeholder': { color: TEXT_SEC, opacity: 1 },
                  }}
                />
                <Button
                  onClick={handleOffer}
                  sx={{
                    bgcolor: `${PURPLE}22`, color: PURPLE, border: `1px solid ${PURPLE}44`,
                    px: 2, borderRadius: '8px', whiteSpace: 'nowrap', fontWeight: 600,
                    '&:hover': { bgcolor: `${PURPLE}33` },
                  }}
                >
                  Trả giá
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════
          PHẦN DƯỚI: Bình luận | Tin khác & Tin tương tự
      ══════════════════════════════════════════════════════════════ */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, gap: 3 }}>
        {/* Cột trái: Bình luận */}
        <Card
          sx={{
            bgcolor: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: '14px', p: 2.5,
          }}
        >
          <CommentsSection listingId={listing.id} currentUser={currentUser} />
        </Card>

        {/* Cột phải: Tin rao khác của shop – luôn hiện, dạng scroll ngang */}
        <Box>
          <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography fontSize={14} fontWeight={700} color={TEXT_PRI}>
              Tin rao khác của {seller?.fullName || 'người bán'}
            </Typography>
            {(seller?.id ?? listing?.seller?.id) && (
              <Typography
                fontSize={12}
                color={PURPLE}
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => navigate(`/profile/${seller?.id ?? listing?.seller?.id}`)}
              >
                Xem tất cả
              </Typography>
            )}
          </Box>
          {loadingRelated ? (
            <Box sx={{ display: 'flex', gap: 1.2, overflowX: 'auto' }}>
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} variant="rectangular" width={120} height={150}
                  sx={{ bgcolor: '#2A2535', borderRadius: '10px', flexShrink: 0 }} />
              ))}
            </Box>
          ) : sellerListings.length === 0 ? (
            <Box
              sx={{
                bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '10px',
                p: 2, textAlign: 'center',
              }}
            >
              <Typography fontSize={12} color={TEXT_SEC}>Chưa có tin đăng nào khác.</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex', gap: 1.2,
                overflowX: 'auto', pb: 0.5,
                '::-webkit-scrollbar': { height: 4 },
                '::-webkit-scrollbar-thumb': { bgcolor: BORDER, borderRadius: 4 },
              }}
            >
              {sellerListings.map((l) => (
                <Box key={l.id ?? l.listingId} sx={{ flexShrink: 0, width: 130 }}>
                  <MiniListingCard listing={l} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Tin đăng tương tự – luôn hiện, grid 4 cột */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography fontSize={15} fontWeight={700} color={TEXT_PRI}>
            Tin đăng tương tự
          </Typography>
          <Typography
            fontSize={13}
            color={PURPLE}
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => navigate('/feed')}
          >
            Xem thêm
          </Typography>
        </Box>
        {loadingRelated ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}>
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} variant="rectangular" height={200}
                sx={{ bgcolor: '#2A2535', borderRadius: '12px' }} />
            ))}
          </Box>
        ) : similarListings.length === 0 ? (
          <Box
            sx={{
              bgcolor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: '12px',
              p: 3, textAlign: 'center',
            }}
          >
            <Typography fontSize={13} color={TEXT_SEC}>Chưa có tin tương tự.</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 1.5,
            }}
          >
            {similarListings.map((l) => (
              <MiniListingCard key={l.id ?? l.listingId} listing={l} />
            ))}
          </Box>
        )}
      </Box>

      {/* Snackbar thông báo */}
      <Snackbar
        open={!!snackMsg}
        autoHideDuration={3000}
        onClose={() => setSnackMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackMsg('')}
          severity={snackType}
          variant="filled"
          sx={{ borderRadius: '10px' }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
