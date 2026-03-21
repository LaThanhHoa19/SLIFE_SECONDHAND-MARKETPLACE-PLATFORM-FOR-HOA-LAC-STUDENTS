/**
 * Trang chi tiết listing – thiết kế đồng bộ với Feed (dark theme).
 * Bố cục: Gallery bên trái | Thông tin + Hành động bên phải
 * Phần bên dưới: Bình luận | Tin khác của người bán | Tin tương tự
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Breadcrumbs,
  Link,
  Grid,
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
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

import { getListing, getListings } from '../../api/listingApi';
import * as chatApi from '../../api/chatApi';
import { getUserById } from '../../api/userApi';
import { fullImageUrl } from '../../utils/constants';
import { formatPickupDisplayLine } from '../../utils/addressDisplay';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';
import * as offerApi from '../../api/offerApi';

import MiniListingCard from '../../components/listing/MiniListingCard';
import ListingImageGallery from '../../components/listing/ListingImageGallery';
import ListingComments from '../../components/listing/ListingComments';
import ListingDescription from '../../components/listing/ListingDescription';
import ListingRightInfoBlock from '../../components/listing/ListingRightInfoBlock';
import ListingSellerOtherListings from '../../components/listing/ListingSellerOtherListings';
import ListingSimilar from '../../components/listing/ListingSimilar';
import ListingPickupMapPreview from '../../components/listing/ListingPickupMapPreview';

// ─── Hằng số màu sắc đồng bộ với Feed ───────────────────────────────────────
const DARK_BG = '#1C1B23';
const CARD_BG = '#201D26';
const CARD_BG2 = '#252230';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_PRI = 'rgba(255,255,255,0.95)';
const TEXT_SEC = 'rgba(255,255,255,0.55)';
const PURPLE = '#9D6EED';
const RED = '#FF4757';
const GREEN = '#2ED573';

// ─── Helper ──────────────────────────────────────────────────────────────────
const getPayload = (res) => {
  const body = res?.data;
  return body?.data ?? body;
};

const toCurrency = (value) =>
  value == null ? '—' : `${Number(value).toLocaleString('vi-VN')} ₫`;

const CONDITION_MAP = {
  NEW: { label: 'Mới', color: GREEN },
  USED_LIKE_NEW: { label: 'Như mới', color: '#1DD3B0' },
  USED_GOOD: { label: 'Đã dùng – tốt', color: PURPLE },
  USED_FAIR: { label: 'Đã dùng', color: '#FFA502' },
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
  if (pa && typeof pa === 'object') {
    return formatPickupDisplayLine(pa.locationName ?? pa.location_name, pa.addressText ?? pa.address_text);
  }
  return '';
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [liked, setLiked] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackType, setSnackType] = useState('success');
  const [snackAction, setSnackAction] = useState(null);
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
      .catch(() => { })
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

  const showSnack = (msg, type = 'success', action = null) => {
    setSnackType(type);
    setSnackMsg(msg);
    setSnackAction(action);
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
  const sellerId = listing?.seller?.id ?? listing?.sellerSummary?.userId ?? listing?.sellerSummary?.id ?? listing?.sellerId;
  const conditionInfo = getConditionInfo(listing.itemCondition);
  const locationText = getLocation(listing);
  const isOwnListing = currentUser && sellerId && String(currentUser.id) === String(sellerId);
  const phoneNumber = isAuthenticated && showPhone
    ? (listing.sellerPhone || seller?.phoneNumber || 'Không có SĐT')
    : null;
  const pickupAddress = listing?.pickupAddress;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1, sm: 2 }, py: { xs: 2, sm: 3 } }}>
      {/* Nối đuôi cha-con (Breadcrumbs) */}
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 16, color: TEXT_SEC }} />}
        sx={{ mb: 2.5 }}
      >
        <Link
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex', alignItems: 'center', color: TEXT_SEC,
            textDecoration: 'none', fontSize: 13,
            '&:hover': { color: TEXT_PRI }
          }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
          SLIFE
        </Link>
        <Link
          component={RouterLink}
          to="/feed"
          sx={{
            color: TEXT_SEC, textDecoration: 'none', fontSize: 13,
            '&:hover': { color: TEXT_PRI }
          }}
        >
          {listing.category?.name || 'Tin đăng'}
        </Link>
        <Typography color={TEXT_PRI} fontSize={13} fontWeight={500} sx={{
          maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {listing.title}
        </Typography>
      </Breadcrumbs>

      {/* ═══════════════════════════════════════════════════════════════
          KHỐI CHÍNH: Layout lưới để đảm bảo các thành phần ngang hàng nhau
      ══════════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '5.5fr 4.5fr' },
          gap: { xs: 3, md: 4 },
          mb: 4,
          alignItems: 'stretch' // Đảm bảo các cell trong cùng row có chiều cao bằng nhau
        }}
      >
        {/* Row 1: Gallery (Split Large Image & Thumbs) | Info Block */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <ListingImageGallery
            images={images}
            title={listing.title}
            listingId={listing.id}
            onShare={handleShare}
            onReport={handleReport}
            isSaved={isSavedItem}
            onToggleSave={handleToggleSave}
            hideThumbs={true} // Hide internal thumbs
          />
          {/* Thumbnails below large image */}
          {images.length > 1 && (
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
                  sx={{
                    flexShrink: 0, width: 64, height: 64, borderRadius: '8px', overflow: 'hidden',
                    border: `2px solid ${BORDER}`, cursor: 'pointer',
                    '&:hover': { borderColor: PURPLE }
                  }}
                >
                  <Box component="img" src={img} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ height: '100%' }}>
          <ListingRightInfoBlock
            listing={listing}
            locationText={locationText}
            phoneNumber={phoneNumber}
            startingChat={startingChat}
            handleShowPhone={handleShowPhone}
            handleChat={handleChat}
            seller={seller}
            sellerId={sellerId}
            isOwnListing={isOwnListing}
            onNotify={showSnack}
          />
        </Box>

        {/* Row 2: Description | Other Listings (Song song nhau) */}
        <ListingDescription description={listing.description} />
        <ListingSellerOtherListings
          sellerListings={sellerListings}
          loadingRelated={loadingRelated}
          seller={seller}
          listing={listing}
        />

        {/* Row 3: Comments | Trống (Bình luận rộng bằng Gallery) */}
        <Card
          sx={{
            bgcolor: CARD_BG, border: `1px solid ${BORDER}`,
            borderRadius: '14px', p: 2.5,
          }}
        >
          <ListingComments listingId={listing.id} currentUser={currentUser} />
        </Card>
        <Box /> {/* Ô trống để giữ grid 2 cột */}
      </Box>

      {/* Xem trước vị trí hẹn (map Vietmap + nút mở Google Maps) */}
      {pickupAddress && pickupAddress.lat != null && pickupAddress.lng != null && (
        <Box sx={{ maxWidth: 1200, mx: 'auto', mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ mb: 1.5, color: TEXT_PRI, fontSize: 18, fontWeight: 600 }}
          >
            Vị trí điểm hẹn (xem trước)
          </Typography>
          <ListingPickupMapPreview
            lat={pickupAddress.lat}
            lng={pickupAddress.lng}
            address={locationText}
          />
        </Box>
      )}

      {/* Tin đăng tương tự – luôn hiện, grid 4 cột */}
      <ListingSimilar
        similarListings={similarListings}
        loadingRelated={loadingRelated}
      />

      <Box
        sx={{
          mt: 8, mb: 2,
          borderRadius: '20px',
          overflow: 'hidden',
          width: '100%',
          maxHeight: '30vh', // Chiều cao không quá 30% màn hình
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          border: `1px solid ${BORDER}`,
          '&:hover': { 
            transform: 'translateY(-4px) scale(1.002)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            borderColor: 'rgba(157, 110, 237, 0.3)'
          }
        }}
      >
        <Box
          component="img"
          src="/brand_advertisement_banner_v3.png"
          alt="Brand Advertisement"
          sx={{ 
            width: '100%', 
            height: '100%', 
            maxHeight: '30vh',
            display: 'block',
            objectFit: 'cover' // Tránh vỡ/méo ảnh
          }}
        />
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
          sx={{
            borderRadius: '12px',
            bgcolor: snackType === 'warning' ? '#FF9F43' : undefined,
            color: '#fff',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            '& .MuiAlert-action': {
              alignItems: 'center',
              paddingTop: 0,
              paddingBottom: 0,
              marginLeft: 1
            }
          }}
          action={snackAction}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
