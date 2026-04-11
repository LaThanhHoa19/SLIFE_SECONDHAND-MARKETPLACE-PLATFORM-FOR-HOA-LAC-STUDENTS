/**
 * Thẻ bài cộng đồng — phong cách feed gọn kiểu thread, giữ logic tương tác hiện tại.
 */
import { memo, useEffect, useRef, useState } from 'react';
import {
    Avatar,
    Box,
    CircularProgress,
    Dialog,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Stack,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    Check as CheckIcon,
    Person as PersonIcon,
    FavoriteBorder,
    Favorite as FavoriteFilledIcon,
    ModeCommentOutlined as CommentIconOutlined,
    ShareOutlined as ShareIconOutlined,
    MoreHoriz as MoreIcon,
    Close as CloseIcon,
    Flag as ReportIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { fullImageUrl } from '../../utils/constants';
import { unwrapApiData } from '../../utils/apiPayload';
import { useAuth } from '../../hooks/useAuth';
import { useFollowActions } from '../../hooks/useFollowActions';
import { useToast } from '../../context/ToastContext';
import { toggleCommunityPostLike } from '../../api/communityApi';
import CommunityCommentModal from './CommunityCommentModal';
import CommunityPostExpandableDescription from './CommunityPostExpandableDescription';
import ReportDialog from '../report/ReportDialog';

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

function CommunityPostCard({ post, onOpen, onPatchPost }) {
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
    const [commentOpen, setCommentOpen] = useState(false);
    const [likeCount, setLikeCount] = useState(() => Number(post?.likeCount ?? 0));
    const [isLiked, setIsLiked] = useState(() => !!(post?.isLiked ?? false));
    const [likeSubmitting, setLikeSubmitting] = useState(false);
    const [commentCount, setCommentCount] = useState(() => Number(post?.commentCount ?? 0));
    const [shareSubmitting, setShareSubmitting] = useState(false);
    const [moreAnchorEl, setMoreAnchorEl] = useState(null);
    const [reportOpen, setReportOpen] = useState(false);
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
    }, [post?.id, post?.likeCount, post?.isLiked, post?.commentCount]);

    const showFollowBtn = authorId && !isMe;

    const goDetail = () => {
        if (typeof onOpen === 'function' && id != null) onOpen(id);
        else if (id != null) navigate(`/community/posts/${id}`);
    };

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

    const handleShareClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!id || shareSubmitting) return;
        setShareSubmitting(true);
        const shareUrl = `${window.location.origin}/community/posts/${id}`;
        const shareTitle = post?.title || 'Bài cộng đồng';
        try {
            if (navigator.share) {
                await navigator.share({ title: shareTitle, url: shareUrl });
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
                px: { xs: 1.25, sm: 1.5 },
                py: 1.45,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <Box sx={{ display: 'flex', gap: 1.25 }}>
                <Box sx={{ width: 40, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            component={RouterLink}
                            to={String(authorId) === String(user?.id) ? '/profile' : authorId ? `/profile/${authorId}` : '#'}
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
                                sx={{ textDecoration: 'none', color: '#fff', fontSize: 14, fontWeight: 700 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {authorName}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                {formatRelativeShort(post?.createdAt) || 'Vừa đăng'}
                            </Typography>
                        </Stack>
                        {!isMe ? (
                            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.45)' }} onClick={handleMoreOpen}>
                                <MoreIcon fontSize="small" />
                            </IconButton>
                        ) : null}
                    </Box>

                    <Box sx={{ mb: mediaUrls.length > 0 ? 1 : 0.7 }}>
                        {post?.title ? (
                            <Typography
                                onClick={goDetail}
                                sx={{
                                    color: 'rgba(255,255,255,0.96)',
                                    fontSize: 14,
                                    fontWeight: 650,
                                    lineHeight: 1.35,
                                    mb: post?.description ? 0.35 : 0,
                                    cursor: 'pointer',
                                }}
                            >
                                {post.title}
                            </Typography>
                        ) : null}
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
                                            flex: { xs: '0 0 88%', sm: '0 0 82%' },
                                            width: { xs: '88%', sm: '82%' },
                                            maxHeight: { xs: 190, sm: 230 },
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
                                                objectFit: 'contain',
                                                display: 'block',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    ) : null}

                    <Stack direction="row" alignItems="center" spacing={0.9} sx={{ pt: 0.7 }}>
                        <IconButton
                            size="small"
                            disabled={likeSubmitting}
                            onClick={handleLikeClick}
                            sx={{ color: isLiked ? LIKE_RED : 'rgba(255,255,255,0.72)', p: 0.6 }}
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
                            sx={{ color: 'rgba(255,255,255,0.72)', p: 0.6 }}
                        >
                            <CommentIconOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Typography sx={{ fontSize: 12.5, color: commentPop ? PURPLE : 'rgba(255,255,255,0.62)' }}>{commentCount || 0}</Typography>

                        <IconButton
                            size="small"
                            onClick={handleShareClick}
                            disabled={shareSubmitting}
                            sx={{ color: 'rgba(255,255,255,0.72)', p: 0.6 }}
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

            {!isMe && (
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
                                minWidth: 160,
                                boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                            },
                        }}
                    >
                        <MenuItem onClick={handleReportClick}>
                            <ListItemIcon sx={{ color: '#FF4757', minWidth: '32px !important' }}>
                                <ReportIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Báo cáo" primaryTypographyProps={{ fontSize: 14 }} />
                        </MenuItem>
                    </Menu>
                    <ReportDialog
                        open={reportOpen}
                        onClose={() => setReportOpen(false)}
                        targetType="COMMUNITY_POST"
                        targetId={id}
                        targetTitle={post?.title}
                    />
                </>
            )}
        </Box>
    );
}

export default memo(CommunityPostCard);
