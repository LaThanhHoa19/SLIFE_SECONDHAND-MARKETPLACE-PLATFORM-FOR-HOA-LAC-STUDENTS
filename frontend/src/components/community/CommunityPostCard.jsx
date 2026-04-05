/**
 * Thẻ bài cộng đồng — layout đồng bộ ListingCard (dark feed): avatar + follow, media, thích / bình luận / chia sẻ.
 */
import { memo, useEffect, useState } from 'react';
import {
    Avatar,
    Box,
    Card,
    CircularProgress,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Stack,
    Tooltip,
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
const CARD_BG = '#201D26';

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

function CommunityPostCard({ post, onOpen, onPatchPost, cardVariant = 'default' }) {
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

    const thumb = post?.thumbUrl ? fullImageUrl(post.thumbUrl) : null;

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

    return (
        <Card
            sx={{
                width: '100%',
                maxWidth: cardVariant === 'fullWidth' ? 'none' : 640,
                mx: cardVariant === 'fullWidth' ? 0 : 'auto',
                bgcolor: CARD_BG,
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
            }}
        >
            <Box sx={{ display: 'flex', p: 2, pb: 1.5, gap: 1.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 44 }}>
                    <Box sx={{ position: 'relative', width: 44, height: 44, mb: 1.5 }}>
                        <Tooltip title="Xem hồ sơ">
                            <Avatar
                                component={RouterLink}
                                to={
                                    String(authorId) === String(user?.id)
                                        ? '/profile'
                                        : authorId
                                          ? `/profile/${authorId}`
                                          : '#'
                                }
                                src={fullImageUrl(authorAvatar)}
                                alt={authorName}
                                sx={{
                                    width: 44,
                                    height: 44,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    bgcolor: PURPLE,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <PersonIcon sx={{ fontSize: 24, color: 'rgba(255,255,255,0.85)' }} />
                            </Avatar>
                        </Tooltip>
                        {showFollowBtn && (
                            <Tooltip title={followed ? 'Bỏ theo dõi' : 'Theo dõi'}>
                                <Box
                                    component="span"
                                    onClick={handleFollowClick}
                                    sx={{
                                        position: 'absolute',
                                        bottom: -1,
                                        right: -1,
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        bgcolor: followed ? PURPLE : '#FFF',
                                        border: '1.5px solid #201D26',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: followed ? '#FFF' : '#201D26',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                        zIndex: 2,
                                    }}
                                >
                                    {followLoading ? (
                                        <CircularProgress size={12} color="inherit" />
                                    ) : followed ? (
                                        <CheckIcon sx={{ fontSize: 16, fontWeight: 900 }} />
                                    ) : (
                                        <AddIcon sx={{ fontSize: 18, fontWeight: 900 }} />
                                    )}
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                    <Box sx={{ flexGrow: 1, width: '2px', bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography
                                component={RouterLink}
                                to={
                                    String(authorId) === String(user?.id)
                                        ? '/profile'
                                        : authorId
                                          ? `/profile/${authorId}`
                                          : '#'
                                }
                                fontSize={14.5}
                                fontWeight={600}
                                color="#FFF"
                                sx={{ textDecoration: 'none', '&:hover': { opacity: 0.8 } }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {authorName}
                            </Typography>
                            <Typography fontSize={13} color="rgba(255,255,255,0.45)">
                                {formatRelativeShort(post?.createdAt) || 'Vừa đăng'}
                            </Typography>
                        </Stack>
                        {!isMe && (
                            <Tooltip title="Tùy chọn">
                                <IconButton
                                    size="small"
                                    sx={{ color: 'rgba(255,255,255,0.5)', mt: -0.5, mr: -1 }}
                                    onClick={handleMoreOpen}
                                >
                                    <MoreIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    <Box sx={{ mb: thumb ? 1.5 : 0 }}>
                        <Typography
                            fontSize={15}
                            fontWeight={600}
                            color="rgba(255,255,255,0.95)"
                            sx={{ lineHeight: 1.4, mb: 1, cursor: 'pointer', outline: 'none' }}
                            onClick={goDetail}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goDetail()}
                            role="link"
                            tabIndex={0}
                        >
                            {post?.title || 'Không có tiêu đề'}
                        </Typography>
                        <CommunityPostExpandableDescription text={post?.description} lineClamp={2} />
                    </Box>

                    {thumb && (
                        <Box
                            onClick={goDetail}
                            sx={{
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: '16px',
                                mb: 0.5,
                                border: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                            }}
                        >
                            <Box
                                component="img"
                                src={thumb}
                                alt=""
                                loading="lazy"
                                sx={{
                                    width: '100%',
                                    aspectRatio: '4/3',
                                    objectFit: 'cover',
                                    display: 'block',
                                    filter: 'brightness(0.92)',
                                }}
                            />
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5, pt: 1 }}>
                        <Tooltip title={isLiked ? 'Bỏ thích' : 'Thích'}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: -1 }}>
                                <IconButton
                                    size="small"
                                    disabled={likeSubmitting}
                                    onClick={handleLikeClick}
                                    sx={{
                                        color: isLiked ? LIKE_RED : 'rgba(255,255,255,0.6)',
                                        p: 1,
                                        '&:hover': { color: LIKE_RED, bgcolor: 'rgba(255,71,87,0.1)' },
                                    }}
                                >
                                    {isLiked ? <FavoriteFilledIcon sx={{ fontSize: 18 }} /> : <FavoriteBorder sx={{ fontSize: 18 }} />}
                                </IconButton>
                                <Typography fontSize={13} fontWeight={600} color="rgba(255,255,255,0.6)">
                                    {likeCount || 0}
                                </Typography>
                            </Box>
                        </Tooltip>
                        <Tooltip title="Bình luận">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCommentOpen(true);
                                    }}
                                    sx={{
                                        color: 'rgba(255,255,255,0.6)',
                                        p: 1,
                                        '&:hover': { color: PURPLE, bgcolor: 'rgba(157,110,237,0.1)' },
                                    }}
                                >
                                    <CommentIconOutlined sx={{ fontSize: 18 }} />
                                </IconButton>
                                <Typography fontSize={13} fontWeight={600} color="rgba(255,255,255,0.6)">
                                    {commentCount || 0}
                                </Typography>
                            </Box>
                        </Tooltip>
                        <Tooltip title="Chia sẻ">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton
                                    size="small"
                                    onClick={handleShareClick}
                                    disabled={shareSubmitting}
                                    sx={{
                                        color: 'rgba(255,255,255,0.6)',
                                        p: 1,
                                        '&:hover': { color: '#1D9BF0', bgcolor: 'rgba(29,155,240,0.1)' },
                                    }}
                                >
                                    <ShareIconOutlined sx={{ fontSize: 19 }} />
                                </IconButton>
                            </Box>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>

            <CommunityCommentModal
                open={commentOpen}
                onClose={() => setCommentOpen(false)}
                postId={id}
                post={post}
                onThreadDelta={onThreadDelta}
            />

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
        </Card>
    );
}

export default memo(CommunityPostCard);
