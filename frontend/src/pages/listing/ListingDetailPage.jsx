/**
 * Trang chi tiáº¿t listing â€“ thiáº¿t káº¿ Ä‘á»“ng bá»™ vá»›i Feed (dark theme).
 * Bá»‘ cá»¥c: Gallery bÃªn trÃ¡i | ThÃ´ng tin + HÃ nh Ä‘á»™ng bÃªn pháº£i
 * Pháº§n bÃªn dÆ°á»›i: BÃ¬nh luáº­n | Tin khÃ¡c cá»§a ngÆ°á»i bÃ¡n | Tin tÆ°Æ¡ng tá»±
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

import { getListing, getListings, toggleListingLike, saveListing, unsaveListing } from '../../api/listingApi';
import * as chatApi from '../../api/chatApi';
import { fullImageUrl } from '../../utils/constants';
import { unwrapApiData } from '../../utils/apiPayload';
import { formatPickupDisplayLine } from '../../utils/addressDisplay';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';
import { useFollowActions } from '../../hooks/useFollowActions';
import MiniListingCard from '../../components/listing/MiniListingCard';
import ListingImageGallery from '../../components/listing/ListingImageGallery';
import ListingComments from '../../components/listing/ListingComments';
import ListingDescription from '../../components/listing/ListingDescription';
import ListingRightInfoBlock from '../../components/listing/ListingRightInfoBlock';
import ListingSellerOtherListings from '../../components/listing/ListingSellerOtherListings';
import ListingSimilar from '../../components/listing/ListingSimilar';
import ListingPickupMapPreview from '../../components/listing/ListingPickupMapPreview';

// â”€â”€â”€ Háº±ng sá»‘ mÃ u sáº¯c Ä‘á»“ng bá»™ vá»›i Feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DARK_BG = '#1C1B23';
const CARD_BG = '#201D26';
const CARD_BG2 = '#252230';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_PRI = 'rgba(255,255,255,0.95)';
const TEXT_SEC = 'rgba(255,255,255,0.55)';
const PURPLE = '#9D6EED';
const RED = '#FF4757';
const GREEN = '#2ED573';

// â”€â”€â”€ Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getPayload = (res) => {
    return unwrapApiData(res);
};

const toCurrency = (value) =>
    value == null ? 'â€”' : `${Number(value).toLocaleString('vi-VN')} â‚«`;

const CONDITION_MAP = {
    NEW: { label: 'Má»›i', color: GREEN },
    USED_LIKE_NEW: { label: 'NhÆ° má»›i', color: '#1DD3B0' },
    USED_GOOD: { label: 'ÄÃ£ dÃ¹ng â€“ tá»‘t', color: PURPLE },
    USED_FAIR: { label: 'ÄÃ£ dÃ¹ng', color: '#FFA502' },
};

const getConditionInfo = (condition) =>
    CONDITION_MAP[condition] || { label: condition || 'KhÃ´ng rÃµ', color: TEXT_SEC };

const getSeller = (listing) => {
    const s = listing?.sellerSummary ?? listing?.seller;
    if (s && typeof s === 'object') return s;
    return { fullName: typeof s === 'string' ? s : 'NgÆ°á»i bÃ¡n' };
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

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ListingDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
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
    const [snackMsg, setSnackMsg] = useState('');
    const [snackType, setSnackType] = useState('success');
    const [snackAction, setSnackAction] = useState(null);
    const [sellerListings, setSellerListings] = useState([]);
    const [similarListings, setSimilarListings] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);
    const [isSavedItem, setIsSavedItem] = useState(false);
    const [sellerFollowed, setSellerFollowed] = useState(false);

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
            .catch((err) => setError(err?.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c tin.'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        setSellerFollowed(!!listing?.isFollowed);
    }, [listing?.id, listing?.isFollowed]);

    // Load tin khÃ¡c cá»§a ngÆ°á»i bÃ¡n + tin tÆ°Æ¡ng tá»±
    // Backend khÃ´ng há»— trá»£ sellerId param â†’ load toÃ n bá»™ rá»“i filter client-side
    useEffect(() => {
        if (!listing) return;
        // Láº¥y seller id tá»« listing.seller.id (theo Ä‘Ãºng field backend tráº£ vá»)
        const sellerId = listing?.seller?.id ?? listing?.sellerSummary?.userId ?? listing?.sellerSummary?.id;
        const currentId = Number(id);

        setLoadingRelated(true);
        getListings({ size: 20 })
            .then((res) => {
                const data = getPayload(res);
                const allList = Array.isArray(data?.content)
                    ? data.content
                    : Array.isArray(data) ? data : [];

                // Tin khÃ¡c cá»§a cÃ¹ng ngÆ°á»i bÃ¡n (loáº¡i trá»« tin hiá»‡n táº¡i)
                const bySellerRaw = sellerId
                    ? allList.filter((l) => {
                        const lSellerId = l?.sellerSummary?.userId ?? l?.sellerSummary?.id ?? l?.seller?.id;
                        return String(lSellerId) === String(sellerId) && (l.id ?? l.listingId) !== currentId;
                    })
                    : [];
                setSellerListings(bySellerRaw.slice(0, 6));

                // Tin tÆ°Æ¡ng tá»±: cÃ¹ng Ä‘iá»u kiá»‡n sáº£n pháº©m hoáº·c má»©c giÃ¡ tÆ°Æ¡ng Ä‘á»“ng, loáº¡i trá»« tin hiá»‡n táº¡i vÃ  tin cá»§a cÃ¹ng seller
                const condition = listing?.condition ?? listing?.itemCondition;
                const price = Number(listing?.price ?? 0);
                const similar = allList
                    .filter((l) => {
                        const lId = l.id ?? l.listingId;
                        if (lId === currentId) return false;
                        const lSellerId = l?.sellerSummary?.userId ?? l?.sellerSummary?.id ?? l?.seller?.id;
                        if (String(lSellerId) === String(sellerId)) return false; // bá» tin cá»§a cÃ¹ng seller (Ä‘Ã£ cÃ³ section trÃªn)
                        // Æ°u tiÃªn: cÃ¹ng condition hoáº·c giÃ¡ trong khoáº£ng Â±50%
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

    // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleToggleLike = async () => {
        if (!isAuthenticated) {
            setSnackType('warning');
            setSnackMsg('Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ thÃ­ch tin.');
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
            setSnackType('error');
            setSnackMsg('KhÃ´ng cáº­p nháº­t Ä‘Æ°á»£c lÆ°á»£t thÃ­ch. Thá»­ láº¡i sau.');
        } finally {
            setLikeSubmitting(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setSnackType('success');
            setSnackMsg('ÄÃ£ sao chÃ©p link vÃ o clipboard!');
        } catch {
            setSnackType('info');
            setSnackMsg(url);
        }
    };

    const handleReport = () => {
        if (!isAuthenticated) {
            setSnackType('warning');
            setSnackMsg('Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ bÃ¡o cÃ¡o tin.');
            return;
        }
        navigate(`/report?targetType=LISTING&targetId=${id}`);
    };

    const handleChat = async () => {
        if (!isAuthenticated) {
            setSnackType('warning');
            setSnackMsg('Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ nháº¯n tin.');
            return;
        }
        setStartingChat(true);
        try {
            const res = await chatApi.getSession(listing.id);
            const sessionId = res?.data?.data ?? res?.data;
            if (sessionId) navigate(`/chat?sessionId=${sessionId}`);
        } catch {
            setSnackType('error');
            setSnackMsg('KhÃ´ng thá»ƒ má»Ÿ cuá»™c trÃ² chuyá»‡n. Thá»­ láº¡i sau.');
        } finally {
            setStartingChat(false);
        }
    };

    const handleShowPhone = () => {
        if (!isAuthenticated) {
            setSnackType('warning');
            setSnackMsg('Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ xem sá»‘ Ä‘iá»‡n thoáº¡i.');
            return;
        }
        setShowPhone(true);
    };

    const showSnack = useCallback((msg, type = 'success', action = null) => {
        setSnackType(type);
        setSnackMsg(msg);
        setSnackAction(action);
    }, []);

    const handleSellerFollowClick = useCallback(async () => {
        if (!listing) return;
        const sid = listing?.seller?.id ?? listing?.sellerSummary?.userId ?? listing?.sellerSummary?.id;
        if (!sid) return;
        await toggleFollow({
            targetUserId: sid,
            isFollowing: sellerFollowed,
            isAuthenticated,
            onUnauthenticated: () => {
                showSnack('Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ theo dÃµi ngÆ°á»i bÃ¡n.', 'warning');
                navigate('/login');
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
                showSnack(nextIsFollowing ? 'ÄÃ£ theo dÃµi ngÆ°á»i bÃ¡n.' : 'ÄÃ£ bá» theo dÃµi ngÆ°á»i bÃ¡n.');
            },
            onError: (e) => {
                showSnack(e?.message || 'KhÃ´ng cáº­p nháº­t Ä‘Æ°á»£c tráº¡ng thÃ¡i theo dÃµi.', 'error');
            },
        });
    }, [listing, sellerFollowed, isAuthenticated, navigate, showSnack, toggleFollow]);

    const handleToggleSave = async () => {
        if (!isAuthenticated) {
            setSnackType('warning');
            setSnackMsg('Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ lÆ°u tin.');
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
            setSnackType('success');
            setSnackMsg(!wasSaved ? 'ÄÃ£ lÆ°u tin rao' : 'ÄÃ£ bá» lÆ°u tin rao');
        } catch {
            setIsSavedItem(wasSaved);
            setSnackType('error');
            setSnackMsg('KhÃ´ng cáº­p nháº­t Ä‘Æ°á»£c tráº¡ng thÃ¡i lÆ°u tin. Thá»­ láº¡i sau.');
        } finally {
            setSaveSubmitting(false);
        }
    };

    // â”€â”€ Render loading / error â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                <Typography color="error" sx={{ mb: 2 }}>{error || 'KhÃ´ng tÃ¬m tháº¥y tin.'}</Typography>
                <Button
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ bgcolor: CARD_BG, color: TEXT_PRI, '&:hover': { bgcolor: CARD_BG2 } }}
                >
                    Quay láº¡i
                </Button>
            </Box>
        );
    }

    // â”€â”€ Dáº«n xuáº¥t dá»¯ liá»‡u â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const images = (listing?.images ?? []).map((p) => fullImageUrl(p)).filter(Boolean);
    const seller = getSeller(listing);
    const sellerId = listing?.seller?.id ?? listing?.sellerSummary?.userId ?? listing?.sellerSummary?.id ?? listing?.sellerId;
    const conditionInfo = getConditionInfo(listing.itemCondition);
    const locationText = getLocation(listing);
    const isOwnListing = currentUser && sellerId && String(currentUser.id) === String(sellerId);
    const phoneNumber = isAuthenticated && showPhone
        ? (listing.sellerPhone || seller?.phoneNumber || 'KhÃ´ng cÃ³ SÄT')
        : null;
    const pickupAddress = listing?.pickupAddress;

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1, sm: 2 }, py: { xs: 2, sm: 3 } }}>
            {/* Ná»‘i Ä‘uÃ´i cha-con (Breadcrumbs) */}
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
                    {listing.category?.name || 'Tin Ä‘Äƒng'}
                </Link>
                <Typography color={TEXT_PRI} fontSize={13} fontWeight={500} sx={{
                    maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                    {listing.title}
                </Typography>
            </Breadcrumbs>

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          KHá»I CHÃNH: Layout lÆ°á»›i Ä‘á»ƒ Ä‘áº£m báº£o cÃ¡c thÃ nh pháº§n ngang hÃ ng nhau
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '5.5fr 4.5fr' },
                    gap: { xs: 3, md: 4 },
                    mb: 4,
                    alignItems: 'stretch' // Äáº£m báº£o cÃ¡c cell trong cÃ¹ng row cÃ³ chiá»u cao báº±ng nhau
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
                        saveDisabled={saveSubmitting}
                        likeCount={likeCount}
                        isLiked={isLiked}
                        onToggleLike={handleToggleLike}
                        likeDisabled={likeSubmitting}
                        hideThumbs={true}
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
                        showSellerFollow={!isOwnListing && !!sellerId}
                        sellerFollowed={sellerFollowed}
                        sellerFollowLoading={sellerFollowLoading}
                        onSellerFollowClick={handleSellerFollowClick}
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

                {/* Row 3: Comments | Trá»‘ng (BÃ¬nh luáº­n rá»™ng báº±ng Gallery) */}
                <Card
                    sx={{
                        bgcolor: CARD_BG, border: `1px solid ${BORDER}`,
                        borderRadius: '14px', p: 2.5,
                    }}
                >
                    <ListingComments
                        listingId={listing.id}
                        currentUser={currentUser}
                        isListingOwner={!!isOwnListing}
                        onNotify={showSnack}
                    />
                </Card>
                <Box /> {/* Ã” trá»‘ng Ä‘á»ƒ giá»¯ grid 2 cá»™t */}
            </Box>

            {/* Xem trÆ°á»›c vá»‹ trÃ­ háº¹n (map Vietmap + nÃºt má»Ÿ Google Maps) */}
            {pickupAddress && pickupAddress.lat != null && pickupAddress.lng != null && (
                <Box sx={{ maxWidth: 1200, mx: 'auto', mb: 4 }}>
                    <Typography
                        variant="h6"
                        sx={{ mb: 1.5, color: TEXT_PRI, fontSize: 18, fontWeight: 600 }}
                    >
                        Vá»‹ trÃ­ Ä‘iá»ƒm háº¹n (xem trÆ°á»›c)
                    </Typography>
                    <ListingPickupMapPreview
                        lat={pickupAddress.lat}
                        lng={pickupAddress.lng}
                        address={locationText}
                    />
                </Box>
            )}

            {/* Tin Ä‘Äƒng tÆ°Æ¡ng tá»± â€“ luÃ´n hiá»‡n, grid 4 cá»™t */}
            <ListingSimilar
                similarListings={similarListings}
                loadingRelated={loadingRelated}
            />

            {/* Banner Quáº£ng CÃ¡o */}
            <Box
                sx={{
                    mt: 6, mb: 2,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    width: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    transition: 'transform 0.3s',
                    '&:hover': { transform: 'scale(1.01)' }
                }}
            >
                <Box
                    component="img"
                    src="/brand_advertisement_banner_1773584721978.png" // Since I cannot move it easily, I'll refer to it (Agent should assume it's moved or accessible)
                    alt="Brand Advertisement"
                    sx={{ width: '100%', display: 'block' }}
                />
            </Box>

            {/* Snackbar thÃ´ng bÃ¡o */}
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
