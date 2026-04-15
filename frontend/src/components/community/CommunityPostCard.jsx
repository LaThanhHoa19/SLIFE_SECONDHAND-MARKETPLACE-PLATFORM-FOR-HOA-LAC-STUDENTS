/**
 * Thẻ bài cộng đồng — phong cách feed gọn kiểu thread, giữ logic tương tác hiện tại.
 */
import { memo, useEffect, useRef, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Check as CheckIcon,
    Person as PersonIcon,
    FavoriteBorder,
    Favorite as FavoriteFilledIcon,
    BookmarkBorder as BookmarkBorderIcon,
    Bookmark as BookmarkFilledIcon,
    ModeCommentOutlined as CommentIconOutlined,
    ShareOutlined as ShareIconOutlined,
    AddPhotoAlternateOutlined as AddPhotoAlternateOutlinedIcon,
    MoreHoriz as MoreIcon,
    Close as CloseIcon,
    Flag as ReportIcon,
    EditOutlined as EditIcon,
    DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { fullImageUrl } from '../../utils/constants';
import { unwrapApiData } from '../../utils/apiPayload';
import { useAuth } from '../../hooks/useAuth';
import { getCachedFollowState, useFollowActions } from '../../hooks/useFollowActions';
import { useToast } from '../../context/ToastContext';
import { toggleCommunityPostLike, toggleCommunityPostSave, updateCommunityPost, deleteCommunityPost, getCommunityPost, uploadCommunityPostImages, deleteCommunityPostImage } from '../../api/communityApi';
import CommunityCommentModal from './CommunityCommentModal';
import CommunityPostExpandableDescription from './CommunityPostExpandableDescription';
import ReportDialog from '../report/ReportDialog';
import ConfirmDialog from '../common/ConfirmDialog';

const LIKE_RED = '#FF4757';
const PURPLE = '#9D6EED';

function parseToggleLikePayload(res) {
    let raw = unwrapApiData(res);
    if (raw && typeof raw === 'object' && raw.data != null && typeof raw.data === 'object') {
        const inner = raw.data;
        if ('liked' in inner || 'likeCount' in inner || 'like_count' in inner || 'isLiked' in inner) {
            raw = inner;
        }
    }
    if (!raw || typeof raw !== 'object') return { nextLiked: undefined, nextCount: undefined };
    const nextLiked = raw.liked ?? raw.isLiked ?? raw.is_liked;
    const nextCount = raw.likeCount ?? raw.like_count;
    return {
        nextLiked: typeof nextLiked === 'boolean' ? nextLiked : undefined,
        nextCount: nextCount != null && nextCount !== '' ? Number(nextCount) : undefined,
    };
}

const formatRelativeShort = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
};

function CommunityPostCard({ post, onPatchPost, onDeletePost }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, token, isAuthenticated, updateUser: updateAuthUser } = useAuth();
    const { followLoading, toggleFollow } = useFollowActions({ user, updateAuthUser });
    const { showToast } = useToast();

    const id = post?.id;
    const authorId = post?.authorId;
    const authorName = post?.authorName || 'Thành viên';
    const authorAvatar = post?.authorAvatarUrl;
    const isMe = isAuthenticated && user && authorId && String(user.id) === String(authorId);

    const [followed, setFollowed] = useState(false);

    useEffect(() => {
        if (!authorId) {
            setFollowed(false);
            return;
        }
        const cached = getCachedFollowState(authorId);
        if (typeof cached === 'boolean') {
            setFollowed(cached);
            return;
        }
        setFollowed(false);
    }, [authorId]);
    const [commentOpen, setCommentOpen] = useState(false);
    const [likeCount, setLikeCount] = useState(() => Number(post?.likeCount ?? 0));
    const [isLiked, setIsLiked] = useState(() => !!(post?.isLiked ?? false));
    const [likeSubmitting, setLikeSubmitting] = useState(false);
    const [commentCount, setCommentCount] = useState(() => Number(post?.commentCount ?? 0));
    const [isSaved, setIsSaved] = useState(() => !!(post?.isSaved ?? false));
    const [saveSubmitting, setSaveSubmitting] = useState(false);
    const [shareSubmitting, setShareSubmitting] = useState(false);
    const [moreAnchorEl, setMoreAnchorEl] = useState(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editDescription, setEditDescription] = useState(post?.description || '');
    const [editError, setEditError] = useState('');
    const [editCurrentImages, setEditCurrentImages] = useState([]);
    const [editRemovedImageIds, setEditRemovedImageIds] = useState([]);
    const [editNewImages, setEditNewImages] = useState([]);
    const editImageInputRef = useRef(null);
    const [likePop, setLikePop] = useState(false);
    const [commentPop, setCommentPop] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const prevLikeFromPost = useRef(undefined);
    const prevCommentFromPost = useRef(undefined);
    const mediaStripRef = useRef(null);
    const mediaDragRef = useRef({ isDown: false, startX: 0, startLeft: 0, moved: false, activeIndex: null });

    const mediaUrls = Array.isArray(post?.imageUrls) && post.imageUrls.length > 0
        ? post.imageUrls.map((u) => fullImageUrl(u)).filter(Boolean)
        : (post?.thumbUrl ? [fullImageUrl(post.thumbUrl)] : []);

    useEffect(() => {
        prevLikeFromPost.current = undefined;
        prevCommentFromPost.current = undefined;
    }, [post?.id]);

    useEffect(() => {
        const v = Number(post?.likeCount ?? 0);
        if (prevLikeFromPost.current !== undefined && v > prevLikeFromPost.current) {
            setLikePop(true);
            const t = window.setTimeout(() => setLikePop(false), 420);
            prevLikeFromPost.current = v;
            return () => clearTimeout(t);
        }
        prevLikeFromPost.current = v;
        return undefined;
    }, [post?.likeCount]);

    useEffect(() => {
        const v = Number(post?.commentCount ?? 0);
        if (prevCommentFromPost.current !== undefined && v > prevCommentFromPost.current) {
            setCommentPop(true);
            const t = window.setTimeout(() => setCommentPop(false), 420);
            prevCommentFromPost.current = v;
            return () => clearTimeout(t);
        }
        prevCommentFromPost.current = v;
        return undefined;
    }, [post?.commentCount]);

    useEffect(() => {
        setLikeCount(Number(post?.likeCount ?? 0));
        setIsLiked(!!(post?.isLiked ?? false));
        setCommentCount(Number(post?.commentCount ?? 0));
        setIsSaved(!!(post?.isSaved ?? false));
    }, [post?.id, post?.likeCount, post?.isLiked, post?.commentCount, post?.isSaved]);

    useEffect(() => {
        setEditDescription(post?.description || '');
    }, [post?.id, post?.description]);

    const showFollowBtn = authorId && !isMe;


    const handleFollowClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!authorId || isMe) return;
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để theo dõi.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        await toggleFollow({
            targetUserId: authorId,
            isFollowing: followed,
            isAuthenticated,
            onSuccess: (next) => setFollowed(next),
            onError: () => {},
        });
    };

    const handleLikeClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!id) return;
        if (!token) {
            showToast('Bạn cần đăng nhập để tiếp tục.', 'warning');
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
            const res = await toggleCommunityPostLike(id);
            const { nextLiked, nextCount } = parseToggleLikePayload(res);
            const finalLiked = typeof nextLiked === 'boolean' ? nextLiked : !prevLiked;
            const finalCount =
                nextCount != null && !Number.isNaN(nextCount)
                    ? nextCount
                    : Math.max(0, prevCount + (prevLiked ? -1 : 1));
            setIsLiked(finalLiked);
            setLikeCount(finalCount);
            onPatchPost?.(id, { likeCount: finalCount, isLiked: finalLiked });
        } catch {
            setIsLiked(prevLiked);
            setLikeCount(prevCount);
        } finally {
            setLikeSubmitting(false);
        }
    };

    const handleSaveClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!id || saveSubmitting) return;
        if (!token) {
            showToast('Bạn cần đăng nhập để lưu bài viết.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        const prev = isSaved;
        setIsSaved(!prev);
        setSaveSubmitting(true);
        try {
            const res = await toggleCommunityPostSave(id);
            const raw = unwrapApiData(res);
            const nextSaved = raw?.saved ?? raw?.isSaved;
            const finalSaved = typeof nextSaved === 'boolean' ? nextSaved : !prev;
            setIsSaved(finalSaved);
            onPatchPost?.(id, { isSaved: finalSaved });
            showToast(finalSaved ? 'Đã lưu bài viết.' : 'Đã bỏ lưu bài viết.', 'success');
        } catch {
            setIsSaved(prev);
            showToast('Không thể lưu bài viết. Vui lòng thử lại.', 'error');
        } finally {
            setSaveSubmitting(false);
        }
    };

    const handleShareClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!id || shareSubmitting) return;
        setShareSubmitting(true);
        const shareUrl = `${window.location.origin}/community/posts/${id}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Bài cộng đồng', url: shareUrl });
                return;
            }
            await navigator.clipboard.writeText(shareUrl);
            showToast('Đã sao chép liên kết bài viết.', 'success');
        } catch {
            window.prompt('Sao chép liên kết:', shareUrl);
            showToast('Trình duyệt chặn sao chép tự động.', 'warning');
        } finally {
            window.setTimeout(() => setShareSubmitting(false), 800);
        }
    };

    const handleMoreOpen = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setMoreAnchorEl(e.currentTarget);
    };

    const handleReportClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setMoreAnchorEl(null);
        if (!isAuthenticated) {
            showToast('Bạn cần đăng nhập để báo cáo.', 'warning');
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        setReportOpen(true);
    };

    const handleEditOpen = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        setMoreAnchorEl(null);
        setEditDescription(post?.description || '');
        setEditError('');
        setEditCurrentImages((post?.imageUrls || []).map((url, idx) => ({ id: null, imageUrl: url, _k: `legacy-${idx}` })));
        setEditRemovedImageIds([]);
        setEditNewImages([]);
        setEditOpen(true);
        try {
            const detailRes = await getCommunityPost(id);
            const detail = unwrapApiData(detailRes);
            const items = Array.isArray(detail?.imageItems)
                ? detail.imageItems.map((it, idx) => ({ id: it?.id ?? null, imageUrl: it?.url || it?.imageUrl || '', _k: `srv-${it?.id ?? idx}` })).filter((it) => !!it.imageUrl)
                : [];
            if (items.length > 0) setEditCurrentImages(items);
        } catch {
            // giữ fallback từ card
        }
    };

    const handleEditSubmit = async () => {
        if (!id || editSubmitting) return;
        const description = (editDescription || '').trim();
        const remainedCount = editCurrentImages.length - editRemovedImageIds.length;
        if (!description && remainedCount + editNewImages.length <= 0) {
            setEditError('Bài viết cần có nội dung hoặc ít nhất 1 ảnh.');
            return;
        }
        setEditSubmitting(true);
        try {
            await updateCommunityPost(id, { description });

            const removeIds = editRemovedImageIds.filter((x) => x != null);
            for (const imageId of removeIds) {
                // eslint-disable-next-line no-await-in-loop
                await deleteCommunityPostImage(id, imageId);
            }

            if (editNewImages.length > 0) {
                await uploadCommunityPostImages(id, editNewImages);
            }

            const freshRes = await getCommunityPost(id);
            const fresh = unwrapApiData(freshRes) || {};
            const nextImageUrls = Array.isArray(fresh?.images)
                ? fresh.images
                : Array.isArray(fresh?.imageItems)
                    ? fresh.imageItems.map((it) => it?.url || it?.imageUrl).filter(Boolean)
                    : post?.imageUrls || [];

            onPatchPost?.(id, {
                description,
                imageUrls: nextImageUrls,
                thumbUrl: nextImageUrls?.[0] || null,
            });
            showToast('Đã cập nhật bài viết.', 'success');
            setEditOpen(false);
        } catch {
            showToast('Không thể cập nhật bài viết.', 'error');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setMoreAnchorEl(null);
        setDeleteConfirmOpen(true);
    };

    const handlePickEditImages = (e) => {
        const files = Array.from(e.target?.files || []);
        if (files.length === 0) return;
        setEditError('');
        setEditNewImages((prev) => [...prev, ...files].slice(0, 10));
        e.target.value = '';
    };

    const handleRemoveCurrentImage = (img) => {
        if (!img) return;
        if (img.id != null) {
            setEditRemovedImageIds((prev) => (prev.includes(img.id) ? prev : [...prev, img.id]));
        } else {
            setEditCurrentImages((prev) => prev.filter((x) => x._k !== img._k));
        }
    };

    const handleRemoveNewImageAt = (idx) => {
        setEditNewImages((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleDeletePostConfirm = async () => {
        if (!id || deleteSubmitting) return;
        setDeleteSubmitting(true);
        try {
            await deleteCommunityPost(id);
            showToast('Đã xóa bài viết.', 'success');
            setDeleteConfirmOpen(false);
            onDeletePost?.(id);
        } catch {
            showToast('Không thể xóa bài viết.', 'error');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const onThreadDelta = (delta) => {
        setCommentCount((prev) => {
            const next = Math.max(0, prev + delta);
            onPatchPost?.(id, { commentCount: next });
            return next;
        });
    };

    const onMediaPointerDown = (e) => {
        const el = mediaStripRef.current;
        if (!el) return;
        const targetEl = e.target?.closest?.('[data-idx]');
        const index = targetEl ? Number(targetEl.getAttribute('data-idx')) : null;
        mediaDragRef.current = {
            isDown: true,
            startX: e.clientX,
            startLeft: el.scrollLeft,
            moved: false,
            activeIndex: Number.isInteger(index) ? index : null,
        };
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };

    const onMediaPointerMove = (e) => {
        const el = mediaStripRef.current;
        const st = mediaDragRef.current;
        if (!el || !st.isDown) return;
        const dx = e.clientX - st.startX;
        if (Math.abs(dx) > 12) {
            st.moved = true;
        }
        if (st.moved) {
            e.preventDefault();
            el.scrollLeft = st.startLeft - dx;
        }
    };

    const endMediaDrag = (e) => {
        const st = mediaDragRef.current;
        if (st.isDown && !st.moved && Number.isInteger(st.activeIndex)) {
            setViewerIndex(st.activeIndex);
            setViewerOpen(true);
        }
        st.isDown = false;
        st.moved = false;
        st.activeIndex = null;
        if (e?.currentTarget?.releasePointerCapture && e?.pointerId != null) {
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                // ignore
            }
        }
    };

    const goPrevViewerImage = () => {
        setViewerIndex((prev) => (mediaUrls.length ? (prev - 1 + mediaUrls.length) % mediaUrls.length : 0));
    };

    const goNextViewerImage = () => {
        setViewerIndex((prev) => (mediaUrls.length ? (prev + 1) % mediaUrls.length : 0));
    };

    return (
        <Box
            sx={{
                px: { xs: 1.25, sm: 1.6 },
                py: 1.6,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'background-color .2s ease, box-shadow .2s ease',
                '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.018)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(255,255,255,0.03)',
                },
            }}
        >
            <Box sx={{ display: 'flex', gap: 1.25 }}>
                <Box sx={{ width: 40, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            component={RouterLink}
                            to={String(authorId) === String(user?.id) ? '/profile' : authorId ? `/profile/${authorId}` : '#'}
                            state={{ profileTab: 'posts' }}
                            src={fullImageUrl(authorAvatar)}
                            alt={authorName}
                            sx={{
                                width: 36,
                                height: 36,
                                cursor: 'pointer',
                                textDecoration: 'none',
                                bgcolor: PURPLE,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PersonIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.85)' }} />
                        </Avatar>
                        {showFollowBtn && (
                            <Box
                                component="span"
                                onClick={handleFollowClick}
                                sx={{
                                    position: 'absolute',
                                    right: -4,
                                    bottom: -2,
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    bgcolor: followed ? PURPLE : '#fff',
                                    border: '1px solid #0f1430',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: followed ? '#fff' : '#111',
                                }}
                            >
                                {followLoading ? <CircularProgress size={10} color="inherit" /> : followed ? <CheckIcon sx={{ fontSize: 11 }} /> : <AddIcon sx={{ fontSize: 12 }} />}
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ flexGrow: 1, width: 2, mt: 0.6, bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3 }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.2 }}>
                        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                            <Typography
                                component={RouterLink}
                                to={String(authorId) === String(user?.id) ? '/profile' : authorId ? `/profile/${authorId}` : '#'}
                                state={{ profileTab: 'posts' }}
                                sx={{ textDecoration: 'none', color: '#fff', fontSize: 14, fontWeight: 700 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {authorName}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                {formatRelativeShort(post?.createdAt) || 'Vừa đăng'}
                            </Typography>
                        </Stack>
                        <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.45)' }} onClick={handleMoreOpen}>
                            <MoreIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Box sx={{ mb: mediaUrls.length > 0 ? 1 : 0.7 }}>
                        <CommunityPostExpandableDescription text={post?.description} lineClamp={4} />
                    </Box>

                    {mediaUrls.length > 0 ? (
                        <Box
                            ref={mediaStripRef}
                            onPointerDown={onMediaPointerDown}
                            onPointerMove={onMediaPointerMove}
                            onPointerUp={endMediaDrag}
                            onPointerCancel={endMediaDrag}
                            onPointerLeave={endMediaDrag}
                            sx={{
                                mt: 0.4,
                                borderRadius: 2,
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                border: '1px solid rgba(255,255,255,0.08)',
                                cursor: 'grab',
                                bgcolor: 'rgba(255,255,255,0.02)',
                                userSelect: 'none',
                                touchAction: 'pan-y',
                                WebkitOverflowScrolling: 'touch',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' },
                                '&:active': { cursor: 'grabbing' },
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 1.2, minWidth: '100%', px: 1, py: 0.75 }}>
                                {mediaUrls.map((url, idx) => (
                                    <Box
                                        key={`${id || 'post'}-img-${idx}`}
                                        data-idx={idx}
                                        sx={{
                                            flex: '0 0 100%',
                                            width: '100%',
                                            maxHeight: { xs: 220, sm: 280 },
                                            borderRadius: 1.25,
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            bgcolor: 'rgba(255,255,255,0.02)',
                                            cursor: 'zoom-in',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            component="img"
                                            src={url}
                                            alt=""
                                            loading="lazy"
                                            draggable={false}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ) : null}

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ pt: 0.8 }}>
                        <IconButton
                            size="small"
                            disabled={likeSubmitting}
                            onClick={handleLikeClick}
                            sx={{
                                color: isLiked ? LIKE_RED : 'rgba(255,255,255,0.72)',
                                p: 0.65,
                                borderRadius: 2,
                                transition: 'all .2s ease',
                                '&:hover': { bgcolor: 'rgba(255,71,87,0.12)', transform: 'translateY(-1px)' },
                                '&:active': { transform: 'scale(0.94)' },
                            }}
                        >
                            {isLiked ? <FavoriteFilledIcon sx={{ fontSize: 18 }} /> : <FavoriteBorder sx={{ fontSize: 18 }} />}
                        </IconButton>
                        <Typography sx={{ fontSize: 12.5, color: likePop ? LIKE_RED : 'rgba(255,255,255,0.62)' }}>{likeCount || 0}</Typography>

                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCommentOpen(true);
                            }}
                            sx={{
                                color: 'rgba(255,255,255,0.72)',
                                p: 0.65,
                                borderRadius: 2,
                                transition: 'all .2s ease',
                                '&:hover': { bgcolor: 'rgba(157,110,237,0.12)', transform: 'translateY(-1px)' },
                                '&:active': { transform: 'scale(0.94)' },
                            }}
                        >
                            <CommentIconOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Typography sx={{ fontSize: 12.5, color: commentPop ? PURPLE : 'rgba(255,255,255,0.62)' }}>{commentCount || 0}</Typography>

                        <IconButton
                            size="small"
                            onClick={handleSaveClick}
                            disabled={saveSubmitting}
                            sx={{
                                color: isSaved ? '#FFD166' : 'rgba(255,255,255,0.72)',
                                p: 0.65,
                                borderRadius: 2,
                                transition: 'all .2s ease',
                                '&:hover': { bgcolor: 'rgba(255,209,102,0.12)', transform: 'translateY(-1px)' },
                                '&:active': { transform: 'scale(0.94)' },
                            }}
                        >
                            {isSaved ? <BookmarkFilledIcon sx={{ fontSize: 18 }} /> : <BookmarkBorderIcon sx={{ fontSize: 18 }} />}
                        </IconButton>

                        <IconButton
                            size="small"
                            onClick={handleShareClick}
                            disabled={shareSubmitting}
                            sx={{
                                color: 'rgba(255,255,255,0.72)',
                                p: 0.65,
                                borderRadius: 2,
                                transition: 'all .2s ease',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', transform: 'translateY(-1px)' },
                                '&:active': { transform: 'scale(0.94)' },
                            }}
                        >
                            <ShareIconOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Stack>
                </Box>
            </Box>

            <CommunityCommentModal
                open={commentOpen}
                onClose={() => setCommentOpen(false)}
                postId={id}
                post={post}
                onThreadDelta={onThreadDelta}
            />

            <Dialog
                open={viewerOpen}
                onClose={() => setViewerOpen(false)}
                fullScreen
                PaperProps={{ sx: { bgcolor: '#000' } }}
            >
                <Box sx={{ position: 'relative', width: '100vw', height: '100vh', bgcolor: '#000' }}>
                    <IconButton
                        onClick={() => setViewerOpen(false)}
                        sx={{
                            position: 'absolute',
                            top: 14,
                            left: 14,
                            zIndex: 5,
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: '#fff',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                        }}
                        aria-label="Đóng xem ảnh"
                    >
                        <CloseIcon />
                    </IconButton>

                    {mediaUrls.length > 1 ? (
                        <>
                            <IconButton
                                onClick={goPrevViewerImage}
                                sx={{
                                    position: 'absolute',
                                    left: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 5,
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    color: '#fff',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                                }}
                                aria-label="Ảnh trước"
                            >
                                <Typography sx={{ fontSize: 22, lineHeight: 1 }}>{'‹'}</Typography>
                            </IconButton>
                            <IconButton
                                onClick={goNextViewerImage}
                                sx={{
                                    position: 'absolute',
                                    right: 14,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 5,
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    color: '#fff',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                                }}
                                aria-label="Ảnh sau"
                            >
                                <Typography sx={{ fontSize: 22, lineHeight: 1 }}>{'›'}</Typography>
                            </IconButton>
                        </>
                    ) : null}

                    <Box
                        component="img"
                        src={mediaUrls[viewerIndex] || ''}
                        alt=""
                        sx={{
                            width: 'auto',
                            maxWidth: { xs: '82vw', md: '72vw' },
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                            mx: 'auto',
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        }}
                    />
                </Box>
            </Dialog>

            <>
                <Menu
                    anchorEl={moreAnchorEl}
                    open={Boolean(moreAnchorEl)}
                    onClose={() => setMoreAnchorEl(null)}
                    onClick={(e) => e.stopPropagation()}
                    PaperProps={{
                        sx: {
                            bgcolor: '#25232C',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#fff',
                            minWidth: 180,
                            boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                        },
                    }}
                >
                    {isMe ? (
                        [
                            <MenuItem key="edit" onClick={handleEditOpen}>
                                <ListItemIcon sx={{ color: '#9D6EED', minWidth: '32px !important' }}>
                                    <EditIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Chỉnh sửa" primaryTypographyProps={{ fontSize: 14 }} />
                            </MenuItem>,
                            <MenuItem key="delete" onClick={handleDeleteClick} disabled={deleteSubmitting}>
                                <ListItemIcon sx={{ color: '#FF6B6B', minWidth: '32px !important' }}>
                                    <DeleteIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary="Xóa bài viết" primaryTypographyProps={{ fontSize: 14 }} />
                            </MenuItem>,
                        ]
                    ) : (
                        <MenuItem onClick={handleReportClick}>
                            <ListItemIcon sx={{ color: '#FF4757', minWidth: '32px !important' }}>
                                <ReportIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Báo cáo" primaryTypographyProps={{ fontSize: 14 }} />
                        </MenuItem>
                    )}
                </Menu>

                <Dialog
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    fullWidth
                    maxWidth="md"
                    PaperProps={{
                        sx: {
                            bgcolor: '#10121a',
                            color: '#fff',
                            borderRadius: 3,
                            border: '1px solid rgba(255,255,255,0.08)',
                            width: { xs: '96vw', sm: '92vw', md: '860px' },
                            maxWidth: '860px',
                            maxHeight: '92vh',
                        },
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 800, py: 1.25, px: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 }}>
                            <IconButton
                                onClick={() => setEditOpen(false)}
                                size="small"
                                sx={{ color: '#fff', zIndex: 2, pointerEvents: 'auto' }}
                                aria-label="Đóng"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>Chỉnh sửa bài viết</Typography>
                            <Box sx={{ width: 32 }} />
                        </Box>
                    </DialogTitle>

                    <DialogContent
                        sx={{
                            pt: 4,
                            pb: 1,
                            px: 2,
                            overflowY: 'auto',
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(172,146,255,0.55) rgba(255,255,255,0.08)',
                            '&::-webkit-scrollbar': { width: 10 },
                            '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.06)', borderRadius: 999 },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'linear-gradient(180deg, rgba(180,153,255,0.85), rgba(126,94,230,0.9))',
                                borderRadius: 999,
                                border: '2px solid rgba(255,255,255,0.06)',
                            },
                        }}
                    >
                        <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={{ mt: 1.5 }}>
                            <Avatar
                                src={fullImageUrl(user?.avatarUrl || user?.avatar || user?.profilePicture || user?.imageUrl || '')}
                                alt={user?.fullName || user?.username || 'Bạn'}
                                sx={{ width: 38, height: 38, mt: 0.2 }}
                            >
                                {(user?.fullName || user?.username || 'B').slice(0, 1).toUpperCase()}
                            </Avatar>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" spacing={0.8}>
                                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                                        {user?.username || user?.fullName || 'Bạn'}
                                    </Typography>
                                </Stack>

                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={4}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Có gì mới?"
                                    variant="standard"
                                    inputProps={{ maxLength: 1000 }}
                                    sx={{
                                        mt: 1,
                                        '& .MuiInputBase-root': { color: '#fff' },
                                        '& .MuiInputBase-input': { color: '#fff', fontSize: 16, lineHeight: 1.45 },
                                        '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.48)', opacity: 1 },
                                        '& .MuiInput-underline:before, & .MuiInput-underline:after': { display: 'none' },
                                    }}
                                />

                                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
                                    <IconButton
                                        size="small"
                                        sx={{ color: 'rgba(255,255,255,0.72)' }}
                                        onClick={() => editImageInputRef.current?.click()}
                                        aria-label="Thêm ảnh"
                                    >
                                        <AddPhotoAlternateOutlinedIcon fontSize="small" />
                                    </IconButton>
                                    <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.52)' }}>Thêm ảnh</Typography>
                                </Stack>

                                <input
                                    ref={editImageInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={handlePickEditImages}
                                />

                                {(editCurrentImages.length > 0 || editNewImages.length > 0) ? (
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5 }}>
                                        {editCurrentImages
                                            .filter((img) => !(img?.id != null && editRemovedImageIds.includes(img.id)))
                                            .map((img, idx) => (
                                                <Box key={img._k || `cur-${idx}`} sx={{ position: 'relative', width: 120, minWidth: 120, borderRadius: 1.2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                                                    <Box component="img" src={fullImageUrl(img.imageUrl)} alt="" sx={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                                                    <IconButton size="small" onClick={() => handleRemoveCurrentImage(img)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                                                        <CloseIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Box>
                                            ))}

                                        {editNewImages.map((file, idx) => (
                                            <Box key={`${file.name}-${idx}`} sx={{ position: 'relative', width: 120, minWidth: 120, borderRadius: 1.2, overflow: 'hidden', border: '1px solid rgba(157,110,237,0.45)' }}>
                                                <Box component="img" src={URL.createObjectURL(file)} alt="" sx={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                                                <IconButton size="small" onClick={() => handleRemoveNewImageAt(idx)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                                                    <CloseIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : null}

                                {editError ? (
                                    <Typography sx={{ color: '#f87171', fontSize: 13, mt: 1 }}>
                                        {editError}
                                    </Typography>
                                ) : null}
                            </Box>
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ px: 2, py: 1.25, borderTop: '1px solid rgba(255,255,255,0.08)', justifyContent: 'flex-end' }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                            <Button
                                variant="contained"
                                onClick={handleEditSubmit}
                                disabled={editSubmitting || (!editDescription.trim() && ((editCurrentImages.length - editRemovedImageIds.length) + editNewImages.length <= 0))}
                                sx={{
                                    fontWeight: 700,
                                    borderRadius: 2,
                                    px: 2.25,
                                    minWidth: 132,
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    color: '#fff',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', boxShadow: 'none' },
                                    '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' },
                                }}
                            >
                                {editSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
                            </Button>
                        </Stack>
                    </DialogActions>
                </Dialog>

                <ConfirmDialog
                    open={deleteConfirmOpen}
                    onClose={() => setDeleteConfirmOpen(false)}
                    onConfirm={handleDeletePostConfirm}
                    loading={deleteSubmitting}
                    variant="danger"
                    title="Xóa bài viết?"
                    content="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài viết này?"
                    confirmLabel="Xóa"
                    cancelLabel="Hủy"
                />

                <ReportDialog
                    open={reportOpen}
                    onClose={() => setReportOpen(false)}
                    targetType="COMMUNITY_POST"
                    targetId={id}
                    targetTitle={post?.description || 'Bài viết cộng đồng'}
                />
            </>
        </Box>
    );
}

export default memo(CommunityPostCard);
