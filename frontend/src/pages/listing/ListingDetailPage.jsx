/**
 * Trang chi tiet listing - thiet ke dong bo voi Feed (dark theme).
 * Bo cuc: Gallery ben trai | Thong tin + Hanh dong ben phai
 * Phan ben duoi: Binh luan | Tin khac cua nguoi ban | Tin tuong tu
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
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
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MyLocationIcon from '@mui/icons-material/MyLocation';

import { getListing, getListingShareInfo, getListings, toggleListingLike, saveListing, unsaveListing } from '../../api/listingApi';
import * as chatApi from '../../api/chatApi';
import { fullImageUrl } from '../../utils/constants';
import { unwrapApiData } from '../../utils/apiPayload';
import { formatPickupDisplayLine } from '../../utils/addressDisplay';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';
import { useFollowActions } from '../../hooks/useFollowActions';
import { useToast } from '../../context/ToastContext';
import MiniListingCard from '../../components/listing/MiniListingCard';
import ListingImageGallery from '../../components/listing/ListingImageGallery';
import ListingComments from '../../components/listing/ListingComments';
import ListingDescription from '../../components/listing/ListingDescription';
import ListingRightInfoBlock from '../../components/listing/ListingRightInfoBlock';
import ListingSellerOtherListings from '../../components/listing/ListingSellerOtherListings';
import ListingSimilar from '../../components/listing/ListingSimilar';
import ListingPickupMapPreview from '../../components/listing/ListingPickupMapPreview';
import ReportDialog from '../../components/report/ReportDialog';

// Hang so mau sac dong bo voi Feed
const DARK_BG = '#1C1B23';
const CARD_BG = '#201D26';
const CARD_BG2 = '#252230';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_PRI = 'rgba(255,255,255,0.95)';
const TEXT_SEC = 'rgba(255,255,255,0.55)';
const PURPLE = '#9D6EED';
const RED = '#FF4757';
const GREEN = '#2ED573';

// Helper
const getPayload = (res) => {
    return unwrapApiData(res);
};

const toCurrency = (value) =>
    value == null ? '—' : `${Number(value).toLocaleString('vi-VN')} ₫`;

const CONDITION_MAP = {
    NEW: { label: 'Mới', color: GREEN },
    USED_LIKE_NEW: { label: 'Như mới', color: '#1DD3B0' },
    USED_GOOD: { label: 'Đã dùng - tốt', color: PURPLE },
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

function normalizeShareUrl(rawUrl, fallbackId) {
    try {
        const parsed = new URL(rawUrl || '', window.location.origin);
        return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
        return `${window.location.origin}/listings/${fallbackId}`;
    }
}

// Main Page
export default function ListingDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser, isAuthenticated, updateUser: updateAuthUser } = useAuth();
    const { followLoading: sellerFollowLoading, toggleFollow } = useFollowActions({
        user: currentUser,
        updateAuthUser,
    });

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startingChat, setStartingChat] = useState(false);
    const [showPhone, setShowPhone] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likeSubmitting, setLikeSubmitting] = useState(false);
    const [saveSubmitting, setSaveSubmitting] = useState(false);
    const [shareSubmitting, setShareSubmitting] = useState(false);
    const { showToast } = useToast();
    const [sellerListings, setSellerListings] = useState([]);
    const [similarListings, setSimilarListings] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);
    const [isSavedItem, setIsSavedItem] = useState(false);
    const [sellerFollowed, setSellerFollowed] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

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
                setLikeCount(Number(data?.likeCount ?? 0));
                setIsLiked(!!data?.isLiked);
            })
            .catch((err) => setError(err?.message || 'Không tải được tin.'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        setSellerFollowed(!!listing?.isFollowed);
    }, [listing?.id, listing?.isFollowed]);

    // Load tin khac cua nguoi ban + tin tuong tu
    useEffect(() => {
        if (!listing) return;
        const sellerId = listing?.seller?.id ?? listing?.sellerSummary?.userId ?? listing?.sellerSummary?.id;
        const currentId = Number(id);

        setLoadingRelated(true);

        // Fetch seller's other listings directly if sellerId exists
        const fetchSellerListings = sellerId
            ? getListings({ sellerId, size: 10 }).then((res) => {
                const data = getPayload(res);
                const list = data?.content || data || [];
                setSellerListings(list.filter(l => (l.id ?? l.listingId) !== currentId).slice(0, 6));
            })
            : Promise.resolve();

        // Fetch general listings for "Similar" items
        const fetchSimilarListings = getListings({ size: 20 }).then((res) => {
            const data = getPayload(res);
            const allList = data?.content || data || [];

            const condition = listing?.condition ?? listing?.itemCondition;
            const price = Number(listing?.price ?? 0);
            const similar = allList
                .filter((l) => {
                    const lId = l.id ?? l.listingId;
                    if (lId === currentId) return false;
                    const lSellerId = l?.sellerSummary?.userId ?? l?.sellerSummary?.id ?? l?.seller?.id;
                    if (String(lSellerId) === String(sellerId)) return false;

                    const lCond = l?.condition ?? l?.itemCondition;
                    const lPrice = Number(l?.price ?? 0);
                    const sameCondition = condition && lCond === condition;
                    const similarPrice = price > 0 && lPrice > 0 && lPrice >= price * 0.5 && lPrice <= price * 1.5;
                    return sameCondition || similarPrice || true;
                })
                .slice(0, 4);
            setSimilarListings(similar);
        });

        Promise.all([fetchSellerListings, fetchSimilarListings])
            .catch(() => { })
            .finally(() => setLoadingRelated(false));
    }, [listing, id]);

    // Handlers
    const handleToggleLike = async () => {
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để thích tin.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        if (likeSubmitting) return;

        const prevLiked = isLiked;
        const prevCount = likeCount;
        setIsLiked(!prevLiked);
        setLikeCount(Math.max(0, prevCount + (prevLiked ? -1 : 1)));
        setLikeSubmitting(true);

        try {
            const res = await toggleListingLike(listing.id);
            const body = getPayload(res);
            const nextLiked = body?.liked ?? body?.isLiked;
            const nextCount = body?.likeCount;
            if (typeof nextLiked === 'boolean') setIsLiked(nextLiked);
            if (nextCount != null) setLikeCount(Number(nextCount));
            setListing((prev) =>
                prev
                    ? {
                        ...prev,
                        isLiked: typeof nextLiked === 'boolean' ? nextLiked : !prevLiked,
                        likeCount: nextCount != null ? Number(nextCount) : Math.max(0, prevCount + (prevLiked ? -1 : 1)),
                    }
                    : prev
            );
        } catch {
            setIsLiked(prevLiked);
            setLikeCount(prevCount);
            showToast('Không cập nhật được lượt thích. Thử lại sau.', 'error');
        } finally {
            setLikeSubmitting(false);
        }
    };

    const handleShare = async () => {
        if (!listing?.id || shareSubmitting) return;
        setShareSubmitting(true);
        let shareUrl = `${window.location.origin}/listings/${listing.id}`;
        let shareTitle = listing?.title || 'Tin đăng';
        try {
            const res = await getListingShareInfo(listing.id);
            const payload = getPayload(res);
            const data = payload?.data ?? payload;
            shareUrl = normalizeShareUrl(data?.shareUrl, listing.id);
            shareTitle = data?.title || data?.listing?.title || shareTitle;
        } catch {
            // fallback to local url
        }
        try {
            if (navigator.share) {
                await navigator.share({ title: shareTitle, url: shareUrl });
                return;
            }
            await navigator.clipboard.writeText(shareUrl);
            showToast('Đã sao chép liên kết bài đăng.', 'success');
        } catch {
            window.prompt('Sao chép liên kết bài đăng:', shareUrl);
            showToast('Trình duyệt chặn sao chép tự động. Hãy sao chép thủ công.', 'warning');
        } finally {
            window.setTimeout(() => setShareSubmitting(false), 800);
        }
    };

    const handleReport = () => {
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để báo cáo tin.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        setReportOpen(true);
    };

    const handleChat = async () => {
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để nhắn tin.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        setStartingChat(true);
        try {
            const res = await chatApi.getSession(listing.id);
            const sessionId = res?.data?.data ?? res?.data;
            if (sessionId) navigate(`/chat?sessionId=${sessionId}`);
        } catch {
            showToast('Không thể mở cuộc trò chuyện. Thử lại sau.', 'error');
        } finally {
            setStartingChat(false);
        }
    };

    const handleShowPhone = () => {
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để xem số điện thoại.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        setShowPhone(true);
    };

    const showSnack = useCallback((msg, type = 'success') => {
        showToast(msg, type);
    }, [showToast]);

    const handleSellerFollowClick = useCallback(async () => {
        if (!listing) return;
        const sid = listing?.seller?.id ?? listing?.sellerSummary?.userId ?? listing?.sellerSummary?.id;
        if (!sid) return;
        await toggleFollow({
            targetUserId: sid,
            isFollowing: sellerFollowed,
            isAuthenticated,
            onUnauthenticated: () => {
                showSnack('Bạn cần đăng nhập để theo dõi người bán.', 'warning');
                navigate('/login', { state: { from: location.pathname } });
            },
            onSuccess: (nextIsFollowing) => {
                const delta = nextIsFollowing ? 1 : -1;
                const bumpFollowers = (obj) => {
                    if (!obj || typeof obj !== 'object') return obj;
                    const cur = Number(obj.followerCount ?? obj.follower_count ?? 0);
                    return { ...obj, followerCount: Math.max(0, cur + delta) };
                };
                setSellerFollowed(nextIsFollowing);
                setListing((prev) =>
                    prev
                        ? {
                            ...prev,
                            isFollowed: nextIsFollowing,
                            seller: bumpFollowers(prev.seller),
                            sellerSummary: bumpFollowers(prev.sellerSummary),
                        }
                        : prev
                );
                showSnack(nextIsFollowing ? 'Đã theo dõi người bán.' : 'Đã bỏ theo dõi người bán.');
            },
            onError: (e) => {
                showSnack(e?.message || 'Không cập nhật được trạng thái theo dõi.', 'error');
            },
        });
    }, [listing, sellerFollowed, isAuthenticated, navigate, showSnack, toggleFollow]);

    const handleToggleSave = async () => {
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để lưu tin.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        if (!listing?.id || saveSubmitting) return;

        const wasSaved = isSavedItem;
        setIsSavedItem(!wasSaved);
        setSaveSubmitting(true);

        try {
            if (wasSaved) {
                await unsaveListing(listing.id);
            } else {
                await saveListing(listing.id);
            }
            setListing((p) => (p ? { ...p, isSaved: !wasSaved } : p));
            showToast(!wasSaved ? 'Đã lưu tin rao' : 'Đã bỏ lưu tin rao', 'success');
        } catch {
            setIsSavedItem(wasSaved);
            showToast('Không cập nhật được trạng thái lưu tin. Thử lại sau.', 'error');
        } finally {
            setSaveSubmitting(false);
        }
    };

    // Render loading / error
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

    // Dan xuat du lieu
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
            {/* Noi duoi cha-con (Breadcrumbs) */}
            <Breadcrumbs
                separator={
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', height: 14 }}>
                        <NavigateNextIcon sx={{ fontSize: 16, color: TEXT_SEC }} />
                    </Box>
                }
                sx={{
                    mb: 2.5,
                    '& .MuiBreadcrumbs-ol': { alignItems: 'center' },
                    '& .MuiBreadcrumbs-li': {
                        display: 'inline-flex',
                        alignItems: 'center',
                        lineHeight: 1,
                    },
                    '& .MuiBreadcrumbs-separator': {
                        display: 'inline-flex',
                        alignItems: 'center',
                        mx: 0.7,
                        my: 0,
                    },
                }}
            >
                <Link
                    component={RouterLink}
                    to="/"
                    sx={{
                        display: 'flex', alignItems: 'center', color: TEXT_SEC,
                        textDecoration: 'none',
                        fontSize: 13,
                        lineHeight: 1,
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
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: TEXT_SEC,
                        textDecoration: 'none',
                        fontSize: 13,
                        lineHeight: 1,
                        '&:hover': { color: TEXT_PRI }
                    }}
                >
                    {listing.category?.name || 'Tin đăng'}
                </Link>
                <Typography color={TEXT_PRI} fontSize={13} fontWeight={500} sx={{
                    maxWidth: 200,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1,
                }}>
                    {listing.title}
                </Typography>
            </Breadcrumbs>

            {/* Khoi chinh: layout luoi de cac thanh phan ngang hang nhau */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '5.5fr 4.5fr' },
                    gap: { xs: 3, md: 4 },
                    mb: 4,
                    alignItems: 'stretch'
                }}
            >
                {/* Row 1: Gallery (Left) | Info Block (Right) */}
                <Box>
                    <ListingImageGallery
                        images={images}
                        title={listing.title}
                        listingId={listing.id}
                        onShare={handleShare}
                        onReport={handleReport}
                        isSaved={isSavedItem}
                        onToggleSave={handleToggleSave}
                        saveDisabled={saveSubmitting}
                        likeCount={likeCount}
                        isLiked={isLiked}
                        onToggleLike={handleToggleLike}
                        likeDisabled={likeSubmitting}
                        hideThumbs={false}
                    />
                </Box>

                <Box>
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
                        showSellerFollow={!isOwnListing && !!sellerId}
                        sellerFollowed={sellerFollowed}
                        sellerFollowLoading={sellerFollowLoading}
                        onSellerFollowClick={handleSellerFollowClick}
                    />
                </Box>

                {/* Row 2: Description & Comments (Left) | Sidebar Stack (Right: Map -> Other Listings -> Ad) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <ListingDescription description={listing.description} />
                    
                    <Card
                        sx={{
                            bgcolor: CARD_BG, border: `1px solid ${BORDER}`,
                            borderRadius: '14px', p: 2.5,
                            height: 'fit-content'
                        }}
                    >
                        <ListingComments
                            listingId={listing.id}
                            currentUser={currentUser}
                            isListingOwner={!!isOwnListing}
                            onNotify={showSnack}
                        />
                    </Card>
                </Box>

                {/* Cot phai (Sidebar): Map -> Other Listings -> Ad Banner */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Map Preview */}
                    {pickupAddress && pickupAddress.lat != null && pickupAddress.lng != null ? (() => {
                        const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${pickupAddress.lat},${pickupAddress.lng}`)}`;
                        return (
                            <Card
                                sx={{
                                    bgcolor: CARD_BG,
                                    border: `1px solid ${BORDER}`,
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                                    height: 'fit-content'
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        px: 2.5,
                                        py: 2,
                                        borderBottom: `1px solid ${BORDER}`,
                                        background: `linear-gradient(135deg, rgba(157,110,237,0.08) 0%, rgba(32,29,38,0) 100%)`,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 36, height: 36, borderRadius: '10px',
                                                background: 'linear-gradient(135deg, #9D6EED 0%, #6B3FBF 100%)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 4px 12px rgba(157,110,237,0.35)',
                                            }}
                                        >
                                            <MyLocationIcon sx={{ fontSize: 18, color: '#fff' }} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ color: TEXT_PRI, fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                                                Vị trí điểm hẹn
                                            </Typography>
                                            {locationText && (
                                                <Typography sx={{ color: TEXT_SEC, fontSize: 12, mt: 0.3 }}>
                                                    📍 {locationText}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <Tooltip title="Mở chỉ đường">
                                        <IconButton
                                            component="a"
                                            href={gmapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="small"
                                            sx={{
                                                color: PURPLE,
                                                border: `1px solid rgba(157,110,237,0.4)`,
                                                bgcolor: 'rgba(157,110,237,0.08)',
                                                '&:hover': { bgcolor: 'rgba(157,110,237,0.18)' },
                                            }}
                                        >
                                            <OpenInNewIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                <Box sx={{ position: 'relative' }}>
                                    <ListingPickupMapPreview
                                        lat={pickupAddress.lat}
                                        lng={pickupAddress.lng}
                                        address={locationText}
                                    />
                                </Box>
                            </Card>
                        );
                    })() : null}

                    {/* Other Listings */}
                    <ListingSellerOtherListings
                        sellerListings={sellerListings}
                        loadingRelated={loadingRelated}
                        seller={seller}
                        listing={listing}
                    />

                    {/* Ad Banner */}
                    <Box
                        sx={{
                            borderRadius: '16px',
                            overflow: 'hidden',
                            width: '100%',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            transition: 'transform 0.3s',
                            '&:hover': { transform: 'scale(1.01)' },
                        }}
                    >
                        <Box
                            component="img"
                            src="/brand_advertisement_banner_v2.png"
                            alt="Brand Advertisement"
                            sx={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Tin đăng tương tự - luôn hiện, grid 4 cột */}
            <ListingSimilar

                similarListings={similarListings}
                loadingRelated={loadingRelated}
            />

            <ReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                targetType="LISTING"
                targetId={id}
                targetTitle={listing?.title}
            />
        </Box>
    );
}
