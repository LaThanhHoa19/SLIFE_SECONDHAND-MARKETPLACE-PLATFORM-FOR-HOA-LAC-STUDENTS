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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
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
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';

import { getListing, getListingShareInfo, getListings, toggleListingLike, saveListing, unsaveListing } from '../../api/listingApi';
import { fullImageUrl } from '../../utils/constants';
import { unwrapApiData } from '../../utils/apiPayload';
import { formatPickupDisplayLine } from '../../utils/addressDisplay';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';
import { useFollowActions } from '../../hooks/useFollowActions';
import { useToast } from '../../context/ToastContext';
import MiniListingCard from '../../components/listing/MiniListingCard';
import ListingCard from '../../components/listing/ListingCard';
import ListingImageGallery from '../../components/listing/ListingImageGallery';
import ListingComments from '../../components/listing/ListingComments';
import ListingDescription from '../../components/listing/ListingDescription';
import ListingRightInfoBlock from '../../components/listing/ListingRightInfoBlock';
import ListingSellerOtherListings from '../../components/listing/ListingSellerOtherListings';
import ListingSimilar from '../../components/listing/ListingSimilar';
import ListingPickupMapPreview from '../../components/listing/ListingPickupMapPreview';
import ReportDialog from '../../components/report/ReportDialog';
import { DARK_DIALOG_PAPER_PROPS } from '../../components/common/dialogStyles';
import { isFollowBlockedError, isListingNotFoundError } from '../../utils/apiError';
import { useBlockActions } from '../../hooks/useBlockActions';
import BlockUserConfirmDialog from '../../components/social/BlockUserConfirmDialog';
import CatalogItemUnavailableScreen from '../../components/common/CatalogItemUnavailableScreen';
import { shouldShowCatalogUnavailableForNotifLink } from '../../utils/catalogAvailability';

import {
    getConditionInfo,
    getPurposeInfo,
    getStatusInfo,
    BRAND_COLORS,
    LISTING_ICONS,
    formatRelativeShort
} from '../../utils/listingFormatUtils';

const getPayload = unwrapApiData;

// Hằng số màu sắc đồng bộ với Feed
const TEXT_PRI = BRAND_COLORS.TEXT_PRI;
const TEXT_SEC = BRAND_COLORS.TEXT_SEC;
const PURPLE = BRAND_COLORS.PURPLE;
const RED = BRAND_COLORS.RED;
const GREEN = BRAND_COLORS.GREEN;
const DARK_BG = '#141225';
const CARD_BG = '#201D26';
const CARD_BG2 = '#252230';
const BORDER = 'rgba(255,255,255,0.07)';

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

function legacyCopyText(text) {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        return copied;
    } catch {
        return false;
    }
}

// Main Page
export default function ListingDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fromNotification = Boolean(location.state?.fromNotification);
    const { user: currentUser, isAuthenticated, updateUser: updateAuthUser } = useAuth();
    const { followLoading: sellerFollowLoading, toggleFollow } = useFollowActions({
        user: currentUser,
        updateAuthUser,
    });

    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
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
    const [saveSubmittingSimilarId, setSaveSubmittingSimilarId] = useState(null);
    const [sellerFollowed, setSellerFollowed] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [blockSellerOpen, setBlockSellerOpen] = useState(false);
    const [loginDialogOpen, setLoginDialogOpen] = useState(false);
    const [loginDialogConfig, setLoginDialogConfig] = useState({ title: '', content: '' });
    const { blockUserById } = useBlockActions();

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
            .catch((err) => {
                if (isListingNotFoundError(err)) {
                    setError('LISTING_UNAVAILABLE');
                } else {
                    setError(err?.message || 'Không tải được tin.');
                }
            })
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        setSellerFollowed(!!listing?.isFollowed);
    }, [listing?.id, listing?.isFollowed]);

    // Load tin khac cua nguoi ban + tin tuong tu
    useEffect(() => {
        if (!listing) return;
        const sellerId =
            listing?.seller?.id ??
            listing?.seller?.userId ??
            listing?.sellerSummary?.userId ??
            listing?.sellerSummary?.id;
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
        // Loc theo Danh muc lon (parentId) neu co, neu khong dung danh muc hien tai
        const mainCatId = listing?.category?.parentId || listing?.category?.id || listing?.categoryId;

        const fetchSimilarListings = getListings({
            category: mainCatId,
            size: 20
        }).then((res) => {
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

                    // Logic lọc chặt chẽ: cùng danh mục, cùng tình trạng hoặc giá tương đương
                    const itemCatId = l?.category?.id || l?.categoryId;
                    const isSameCategory = String(itemCatId) === String(mainCatId) || String(l?.category?.parentId) === String(mainCatId);
                    const sameCondition = condition && lCond === condition;
                    const similarPrice = price > 0 && lPrice > 0 && lPrice >= price * 0.5 && lPrice <= price * 1.5;

                    // Tuyệt đối loại bỏ '|| true' để không bị lọc "linh tinh"
                    return isSameCategory || sameCondition || similarPrice;
                })
                .slice(0, 4);
            setSimilarListings(similar);
        });

        Promise.all([fetchSellerListings, fetchSimilarListings])
            .catch(() => { })
            .finally(() => setLoadingRelated(false));
    }, [listing, id]);

    // Auth requirement helper
    const requireAuth = useCallback((title, content) => {
        if (!isAuthenticated) {
            setLoginDialogConfig({ title, content });
            setLoginDialogOpen(true);
            return false;
        }
        return true;
    }, [isAuthenticated]);

    // Handlers
    const handleToggleLike = async () => {
        if (!requireAuth('Thích tin đăng', 'Bạn cần đăng nhập để thích tin đăng này.')) return;
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
        } catch (e) {
            setIsLiked(prevLiked);
            setLikeCount(prevCount);
            if (isFollowBlockedError(e)) {
                showToast('Không thể thích tin do đang chặn hoặc bị chặn với người bán.', 'warning');
            } else {
                showToast('Không cập nhật được lượt thích. Thử lại sau.', 'error');
            }
        } finally {
            setLikeSubmitting(false);
        }
    };

    const handleShare = async () => {
        const shareId = listing?.code || listing?.id;
        if (!shareId || shareSubmitting) return;
        setShareSubmitting(true);
        let shareUrl = `${window.location.origin}/listings/${shareId}`;
        let shareTitle = listing?.title || 'Tin đăng';
        try {
            const res = await getListingShareInfo(listing.id);
            const payload = getPayload(res);
            const data = payload?.data ?? payload;
            shareUrl = normalizeShareUrl(data?.shareUrl, shareId);
            shareTitle = data?.title || data?.listing?.title || shareTitle;
        } catch {
            // fallback to local url
        }
        try {
            if (navigator.share) {
                await navigator.share({ title: shareTitle, url: shareUrl });
                return;
            }

            let copied = false;
            if (navigator.clipboard?.writeText) {
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    copied = true;
                } catch {
                    copied = false;
                }
            }

            if (!copied) {
                copied = legacyCopyText(shareUrl);
            }

            if (copied) {
                showToast('Đã sao chép liên kết bài đăng.', 'success');
            } else {
                showToast('Không thể sao chép tự động. Vui lòng sao chép liên kết trên thanh địa chỉ.', 'warning');
            }
        } finally {
            window.setTimeout(() => setShareSubmitting(false), 800);
        }
    };

    const handleReport = () => {
        if (!requireAuth('Báo cáo tin đăng', 'Bạn cần đăng nhập để báo cáo tin đăng vi phạm.')) return;
        const resolvedListingId = Number(listing?.id ?? id);
        if (!Number.isFinite(resolvedListingId) || resolvedListingId <= 0) {
            console.warn('[ListingDetailPage] invalid listing id for report', {
                routeId: id,
                listingId: listing?.id,
                resolvedListingId,
            });
            showToast('Không thể báo cáo vì ID tin đăng không hợp lệ.', 'error');
            return;
        }
        console.info('[ListingDetailPage] open report dialog', {
            routeId: id,
            listingId: listing?.id,
            resolvedListingId,
            title: listing?.title,
        });
        setReportOpen(true);
    };

    const handleChat = () => {
        if (!requireAuth('Nhắn tin cho người bán', 'Bạn cần đăng nhập để gửi tin nhắn cho người bán.')) return;
        navigate(`/chat?listingId=${listing.id}`);
    };

    const handleShowPhone = () => {
        if (!requireAuth('Xem số điện thoại', 'Bạn cần đăng nhập để xem số điện thoại người bán.')) return;
        setShowPhone(true);
    };

    const showSnack = useCallback((msg, type = 'success') => {
        showToast(msg, type);
    }, [showToast]);

    const handleSellerFollowClick = useCallback(async () => {
        if (!listing) return;
        const sid =
            listing?.seller?.id ??
            listing?.seller?.userId ??
            listing?.sellerSummary?.userId ??
            listing?.sellerSummary?.id;
        if (!sid) return;
        await toggleFollow({
            targetUserId: sid,
            isFollowing: sellerFollowed,
            isAuthenticated,
            onUnauthenticated: () => {
                requireAuth('Theo dõi người bán', 'Bạn cần đăng nhập để theo dõi người bán này.');
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
        if (!requireAuth('Lưu tin đăng', 'Bạn cần đăng nhập để lưu tin đăng này vào danh sách yêu thích.')) return;
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
        } catch (e) {
            setIsSavedItem(wasSaved);
            if (isFollowBlockedError(e)) {
                showToast('Không thể lưu tin do đang chặn hoặc bị chặn với người bán.', 'warning');
            } else {
                showToast('Không cập nhật được trạng thái lưu tin. Thử lại sau.', 'error');
            }
        } finally {
            setSaveSubmitting(false);
        }
    };

    const handleToggleSaveSimilar = async (targetListing) => {
        const targetId = targetListing?.id ?? targetListing?.listingId;
        if (!targetId || saveSubmittingSimilarId) return;
        if (!requireAuth('Lưu tin đăng', 'Bạn cần đăng nhập để lưu tin đăng này.')) return;
        const wasSaved = !!(targetListing?.isSaved ?? targetListing?.saved);
        setSaveSubmittingSimilarId(targetId);
        setSimilarListings((prev) =>
            prev.map((item) =>
                String(item?.id ?? item?.listingId) === String(targetId)
                    ? { ...item, isSaved: !wasSaved }
                    : item
            )
        );
        try {
            if (wasSaved) {
                await unsaveListing(targetId);
            } else {
                await saveListing(targetId);
            }
            showToast(!wasSaved ? 'Đã lưu tin rao' : 'Đã bỏ lưu tin rao', 'success');
        } catch {
            setSimilarListings((prev) =>
                prev.map((item) =>
                    String(item?.id ?? item?.listingId) === String(targetId)
                        ? { ...item, isSaved: wasSaved }
                        : item
                )
            );
            showToast('Không cập nhật được trạng thái lưu tin. Thử lại sau.', 'error');
        } finally {
            setSaveSubmittingSimilarId(null);
        }
    };

    // Render loading / error
    if (loading) {
        return (
            <Box sx={{ px: 2, py: 3 }}>
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
    if (
        fromNotification &&
        (Boolean(error) || (listing && shouldShowCatalogUnavailableForNotifLink(listing, currentUser, true)))
    ) {
        return <CatalogItemUnavailableScreen />;
    }
    if (error || !listing) {
        const listingUnavailable = error === 'LISTING_UNAVAILABLE';
        return (
            <Box sx={{ p: 4, textAlign: 'center', maxWidth: 480, mx: 'auto' }}>
                <Typography sx={{ mb: 2, color: listingUnavailable ? TEXT_SEC : 'error.main', lineHeight: 1.65 }}>
                    {listingUnavailable
                        ? 'Không thể mở tin này. Có thể tin đã gỡ hoặc bạn và người bán đang chặn nhau — hai bên sẽ không thấy tin của nhau.'
                        : error || 'Không tìm thấy tin.'}
                </Typography>
                <Button
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ bgcolor: CARD_BG, color: TEXT_PRI, '&:hover': { bgcolor: CARD_BG2 } }}
                >
                    Quay lại
                </Button>
                {listingUnavailable && isAuthenticated && (
                    <Button sx={{ display: 'block', mx: 'auto', mt: 1 }} onClick={() => navigate('/settings/blocked')}>
                        Danh sách đã chặn
                    </Button>
                )}
            </Box>
        );
    }

    // Dan xuat du lieu
    const images = (listing?.images ?? []).map((p) => fullImageUrl(p)).filter(Boolean);
    const seller = getSeller(listing);
    const sellerId =
        listing?.seller?.id ??
        listing?.seller?.userId ??
        listing?.sellerSummary?.userId ??
        listing?.sellerSummary?.id ??
        listing?.sellerId;
    const conditionInfo = getConditionInfo(listing.itemCondition);
    const locationText = getLocation(listing);
    const isOwnListing = currentUser && sellerId && String(currentUser.id) === String(sellerId);
    // Lấy số điện thoại theo thứ tự ưu tiên: top-level field -> seller object -> sellerSummary object
    // Kiểm tra cả camelCase và snake_case để tránh lỗi serialization
    const sellerAllowsPhone =
        listing?.seller?.showPhoneNumber ??
        listing?.sellerSummary?.showPhoneNumber ??
        listing?.sellerSummary?.show_phone_number ??
        listing?.sellerPhone != null ??
        true;
    const rawPhone = sellerAllowsPhone
        ? (listing?.sellerPhone
            || seller?.phoneNumber || seller?.phone_number
            || listing?.sellerSummary?.phoneNumber || listing?.sellerSummary?.phone_number)
        : null;

    const phoneNumber = isAuthenticated && showPhone
        ? (rawPhone || (sellerAllowsPhone ? 'Thông tin liên hệ trống' : 'Người bán đã ẩn số điện thoại'))
        : null;
    const pickupAddress = listing?.pickupAddress;
    const s = String(listing?.status || listing?.itemStatus || '').toUpperCase();
    const isSoldOrHidden = s === 'SOLD' || s === 'HIDDEN' || s === 'MOD_HIDDEN';

    // If SOLD or HIDDEN/MOD_HIDDEN, show as a Card (Feed style) instead of detail page
    if (isSoldOrHidden) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, py: 6, textAlign: 'center' }}>
                <Box sx={{ mb: 4, display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(46, 213, 115, 0.1)', px: 3, py: 1.2, borderRadius: '30px', border: `1px solid ${GREEN}` }}>
                    <VerifiedIcon sx={{ color: GREEN, fontSize: 20 }} />
                    <Typography color={GREEN} fontWeight={700} fontSize={15}>
                        {s === 'SOLD'
                            ? 'Sản phẩm này đã được bán thành công'
                            : s === 'MOD_HIDDEN'
                                ? 'Bài đăng này đã bị ẩn do vi phạm'
                                : 'Bài đăng này đã bị ẩn'}
                    </Typography>
                </Box>

                <Box sx={{ mb: 4, transform: 'scale(1.05)', transition: 'transform 0.3s' }}>
                    <ListingCard listing={listing} />
                </Box>

                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIosNewIcon />}
                    onClick={() => navigate('/feed')}
                    sx={{
                        borderRadius: '12px', border: `1px solid ${BORDER}`,
                        bgcolor: CARD_BG, color: TEXT_PRI, px: 4, py: 1.5,
                        '&:hover': { bgcolor: CARD_BG2, borderColor: PURPLE }
                    }}
                >
                    Khám phá tin khác
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ px: { xs: 1, sm: 2 }, py: { xs: 2, sm: 3 } }}>
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
                    maxWidth: { xs: 150, sm: 300 },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1,
                }}>
                    {listing.title}
                </Typography>
            </Breadcrumbs>

            <Card
                sx={{
                    bgcolor: CARD_BG,
                    border: `1px solid ${BORDER}`,
                    borderRadius: '16px',
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    mb: 1.5,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}
            >
                <Grid container spacing={{ xs: 2, md: 5 }}>
                    <Grid item xs={12} md={6}>
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
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <ListingRightInfoBlock
                            listing={listing}
                            locationText={locationText}
                            phoneNumber={phoneNumber}
                            handleShowPhone={handleShowPhone}
                            handleChat={handleChat}
                            isPhoneRevealed={showPhone}
                            seller={seller}
                            sellerId={sellerId}
                            isOwnListing={isOwnListing}
                            onNotify={showSnack}
                            showSellerFollow={!isOwnListing && !!sellerId}
                            sellerFollowed={sellerFollowed}
                            sellerFollowLoading={sellerFollowLoading}
                            onSellerFollowClick={handleSellerFollowClick}
                            showSellerBlock={isAuthenticated && !isOwnListing && !!sellerId}
                            onSellerBlockClick={() => setBlockSellerOpen(true)}
                        />
                    </Grid>
                </Grid>
            </Card>

            {/* Content Row 2: Description & Comments (Left) | Sidebar Stack (Right) */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
                    gap: { xs: 1.5, md: 2 },
                    alignItems: 'start'
                }}
            >
                {/* Left Column: Description & Comments */}
                <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 7' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <ListingDescription description={listing.description} />

                    <Card
                        sx={{
                            bgcolor: CARD_BG,
                            border: `1px solid ${BORDER}`,
                            borderRadius: '14px',
                            p: 1.25
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

                {/* Right Column: Sidebar (Map, Other Listings) */}
                <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 5' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                                        px: 2.25,
                                        py: 1.75,
                                        borderBottom: `1px solid ${BORDER}`,
                                        background: `linear-gradient(135deg, rgba(157,110,237,0.04) 0%, rgba(32,29,38,0) 100%)`,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 34, height: 34, borderRadius: '10px',
                                                background: 'linear-gradient(135deg, rgba(157,110,237,0.78) 0%, rgba(107,63,191,0.78) 100%)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 3px 10px rgba(157,110,237,0.24)',
                                            }}
                                        >
                                            <MyLocationIcon sx={{ fontSize: 18, color: '#fff' }} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ color: TEXT_PRI, fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                                                Vị trí điểm hẹn
                                            </Typography>
                                            {locationText && (
                                                <Typography sx={{ color: 'rgba(255,255,255,0.68)', fontSize: 13, mt: 0.35, lineHeight: 1.3 }}>
                                                    {LISTING_ICONS.LOCATION} {locationText}
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

                    {/* Other Listings from Seller */}
                    <ListingSellerOtherListings
                        sellerListings={sellerListings}
                        loadingRelated={loadingRelated}
                        seller={seller}
                        listing={listing}
                    />
                </Box>
            </Box>

            {/* Similar Listings */}
            <ListingSimilar
                similarListings={similarListings}
                loadingRelated={loadingRelated}
                onToggleSave={handleToggleSaveSimilar}
                saveSubmittingId={saveSubmittingSimilarId}
            />

            <ReportDialog
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                targetType="LISTING"
                targetId={Number(listing?.id ?? id)}
                targetTitle={listing?.title}
            />

            {/* Login Prompt Dialog - Premium UI */}
            <Dialog
                open={loginDialogOpen}
                onClose={() => setLoginDialogOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(32, 29, 38, 0.95)',
                        backgroundImage: 'none',
                        border: '1px solid rgba(157, 110, 237, 0.15)',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(12px)',
                        p: 1.5,
                        overflow: 'visible'
                    }
                }}
                BackdropProps={{
                    sx: { backdropFilter: 'blur(4px)', bgcolor: 'rgba(0,0,0,0.5)' }
                }}
                maxWidth="xs"
                fullWidth
            >
                <Box sx={{ position: 'relative', pt: 3, pb: 1, px: 2, textAlign: 'center' }}>
                    {/* Top Icon with Glow */}
                    <Box
                        sx={{
                            width: 80, height: 80, borderRadius: '28px',
                            mx: 'auto', mb: 3, mt: -7,
                            background: 'linear-gradient(135deg, #9D6EED 0%, #6B3FBF 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 15px 35px rgba(157, 110, 237, 0.45)',
                            border: '4px solid #201D26'
                        }}
                    >
                        <LockPersonOutlinedIcon sx={{ fontSize: 40, color: '#fff' }} />
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', mb: 1.5, letterSpacing: '-0.02em' }}>
                        {loginDialogConfig.title || 'Dành riêng cho thành viên'}
                    </Typography>

                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6, mb: 4 }}>
                        {loginDialogConfig.content || 'Hãy đăng nhập ngay để trải nghiệm đầy đủ các tính năng tuyệt vời của SLIFE.'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            fullWidth
                            onClick={() => setLoginDialogOpen(false)}
                            sx={{
                                py: 1.5,
                                color: 'rgba(255,255,255,0.5)',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: 15,
                                borderRadius: '14px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    color: '#fff',
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    borderColor: 'rgba(157, 110, 237, 0.4)'
                                }
                            }}
                        >
                            Để sau
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => {
                                setLoginDialogOpen(false);
                                navigate('/login', { state: { from: location.pathname } });
                            }}
                            sx={{
                                py: 1.5,
                                borderRadius: '14px',
                                bgcolor: PURPLE,
                                color: '#fff',
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: 15,
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                '&:hover': {
                                    bgcolor: '#835cd4',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 20px rgba(157, 110, 237, 0.4)',
                                },
                            }}
                        >
                            Đăng nhập ngay
                        </Button>
                    </Box>
                </Box>
            </Dialog>

            <BlockUserConfirmDialog
                open={blockSellerOpen}
                onClose={() => setBlockSellerOpen(false)}
                displayName={seller?.fullName || 'Người bán'}
                onConfirm={() =>
                    sellerId
                        ? blockUserById(sellerId).then(() => navigate('/feed'))
                        : Promise.resolve()
                }
            />
        </Box>
    );
}
