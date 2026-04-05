/**
 * Chi tiết bài cộng đồng — layout đồng bộ feed listing (dark card + thích / chia sẻ + bình luận).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ModeCommentOutlined from '@mui/icons-material/ModeCommentOutlined';
import ShareOutlined from '@mui/icons-material/ShareOutlined';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FlagIcon from '@mui/icons-material/Flag';
import { getCommunityPost, toggleCommunityPostLike } from '../../api/communityApi';
import { unwrapApiData } from '../../utils/apiPayload';
import { fullImageUrl } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useFollowActions } from '../../hooks/useFollowActions';
import { useToast } from '../../context/ToastContext';
import CommunityPostComments from '../../components/community/CommunityPostComments';
import CommunityPostExpandableDescription from '../../components/community/CommunityPostExpandableDescription';
import ReportDialog from '../../components/report/ReportDialog';

const DARK_BG = '#141225';
const CARD_BG = '#201D26';
const PURPLE = '#9D6EED';
const LIKE_RED = '#FF4757';

function parseToggleLikePayload(res) {
    let raw = unwrapApiData(res);
    if (raw && typeof raw === 'object' && raw.data != null && typeof raw.data === 'object') {
        const inner = raw.data;
        if ('liked' in inner || 'likeCount' in inner) raw = inner;
    }
    if (!raw || typeof raw !== 'object') return { nextLiked: undefined, nextCount: undefined };
    const nextLiked = raw.liked ?? raw.isLiked;
    const nextCount = raw.likeCount ?? raw.like_count;
    return {
        nextLiked: typeof nextLiked === 'boolean' ? nextLiked : undefined,
        nextCount: nextCount != null ? Number(nextCount) : undefined,
    };
}

export default function CommunityPostDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const commentsRef = useRef(null);
    const { user, token, isAuthenticated, updateUser: updateAuthUser } = useAuth();
    const { followLoading, toggleFollow } = useFollowActions({ user, updateAuthUser });
    const { showToast } = useToast();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [likeCount, setLikeCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likeSubmitting, setLikeSubmitting] = useState(false);
    const [commentCount, setCommentCount] = useState(0);
    const [followed, setFollowed] = useState(false);
    const [shareSubmitting, setShareSubmitting] = useState(false);
    const [moreAnchor, setMoreAnchor] = useState(null);
    const [reportOpen, setReportOpen] = useState(false);

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const res = await getCommunityPost(id);
            const data = unwrapApiData(res);
            setPost(data);
            setLikeCount(Number(data?.likeCount ?? 0));
            setIsLiked(!!data?.isLiked);
            setCommentCount(Number(data?.commentCount ?? 0));
        } catch (e) {
            setPost(null);
            setError(
                e?.response?.data?.message ||
                    e?.response?.data?.error ||
                    'Không tải được bài viết (có thể đã gỡ hoặc ẩn).',
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const author = post?.authorSummary || {};
    const authorId = author.userId;
    const authorName = (author.fullName || '').trim() || 'Thành viên';
    const isMe = isAuthenticated && user && authorId && String(user.id) === String(authorId);
    const showFollowBtn = authorId && !isMe;
    const images = Array.isArray(post?.images) ? post.images.map(fullImageUrl).filter(Boolean) : [];
    const handleLike = async () => {
        if (!id || !token) {
            showToast('Bạn cần đăng nhập để thích bài viết.', 'warning');
            navigate('/login', { state: { from: `/community/posts/${id}` } });
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
            setPost((p) => (p ? { ...p, likeCount: finalCount, isLiked: finalLiked } : p));
        } catch {
            setIsLiked(prevLiked);
            setLikeCount(prevCount);
        } finally {
            setLikeSubmitting(false);
        }
    };

    const handleShare = async () => {
        if (!id || shareSubmitting) return;
        setShareSubmitting(true);
        const url = `${window.location.origin}/community/posts/${id}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: post?.title, url });
            } else {
                await navigator.clipboard.writeText(url);
                showToast('Đã sao chép liên kết.', 'success');
            }
        } catch {
            window.prompt('Sao chép liên kết:', url);
        } finally {
            window.setTimeout(() => setShareSubmitting(false), 600);
        }
    };

    const scrollToComments = () => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const onThreadDelta = (delta) => {
        setCommentCount((c) => Math.max(0, c + delta));
        setPost((p) => (p ? { ...p, commentCount: Math.max(0, (p.commentCount || 0) + delta) } : p));
    };

    const onNotify = (msg, variant = 'success') => {
        if (variant === 'error') showToast(msg, 'error');
        else showToast(msg, 'success');
    };

    return (
        <Box sx={{ minHeight: '100%', width: '100%', bgcolor: DARK_BG, py: { xs: 1.5, md: 2 }, px: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ maxWidth: 640, mx: 'auto' }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <IconButton
                        aria-label="Quay lại"
                        onClick={() => navigate('/community')}
                        size="small"
                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography fontSize={14} fontWeight={600} color="rgba(255,255,255,0.5)">
                        Cộng đồng
                    </Typography>
                </Stack>

                {loading ? (
                    <Stack alignItems="center" py={6}>
                        <CircularProgress size={36} sx={{ color: PURPLE }} />
                    </Stack>
                ) : error ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="#f87171" sx={{ mb: 2 }}>
                            {typeof error === 'string' ? error : 'Có lỗi xảy ra.'}
                        </Typography>
                        <Button variant="contained" onClick={load} sx={{ bgcolor: PURPLE }}>
                            Thử lại
                        </Button>
                    </Box>
                ) : post ? (
                    <>
                        <Box
                            sx={{
                                bgcolor: CARD_BG,
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                p: 2,
                                mb: 2,
                            }}
                        >
                            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
                                <Box sx={{ position: 'relative', width: 48, height: 48 }}>
                                    <Avatar
                                        component={RouterLink}
                                        to={isMe ? '/profile' : authorId ? `/profile/${authorId}` : '#'}
                                        src={fullImageUrl(author.avatarUrl)}
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            bgcolor: PURPLE,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        <PersonIcon />
                                    </Avatar>
                                    {showFollowBtn && (
                                        <Box
                                            component="span"
                                            onClick={async () => {
                                                if (!isAuthenticated) {
                                                    showToast('Bạn cần đăng nhập để theo dõi.', 'warning');
                                                    navigate('/login', { state: { from: `/community/posts/${id}` } });
                                                    return;
                                                }
                                                await toggleFollow({
                                                    targetUserId: authorId,
                                                    isFollowing: followed,
                                                    isAuthenticated,
                                                    onSuccess: setFollowed,
                                                    onError: () => {},
                                                });
                                            }}
                                            sx={{
                                                position: 'absolute',
                                                bottom: -2,
                                                right: -2,
                                                width: 22,
                                                height: 22,
                                                borderRadius: '50%',
                                                bgcolor: followed ? PURPLE : '#fff',
                                                border: '1.5px solid #201D26',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: followed ? '#fff' : '#201D26',
                                            }}
                                        >
                                            {followLoading ? (
                                                <CircularProgress size={11} color="inherit" />
                                            ) : followed ? (
                                                <CheckIcon sx={{ fontSize: 14 }} />
                                            ) : (
                                                <AddIcon sx={{ fontSize: 15 }} />
                                            )}
                                        </Box>
                                    )}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography
                                                component={RouterLink}
                                                to={isMe ? '/profile' : authorId ? `/profile/${authorId}` : '#'}
                                                fontWeight={700}
                                                color="#fff"
                                                sx={{ textDecoration: 'none', fontSize: 15 }}
                                            >
                                                {authorName}
                                            </Typography>
                                            {post.createdAt ? (
                                                <Typography fontSize={12} color="rgba(255,255,255,0.45)" display="block">
                                                    {new Date(post.createdAt).toLocaleString('vi-VN')}
                                                </Typography>
                                            ) : null}
                                        </Box>
                                        {!isMe && (
                                            <>
                                                <IconButton size="small" onClick={(e) => setMoreAnchor(e.currentTarget)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    <MoreHorizIcon />
                                                </IconButton>
                                                <Menu
                                                    anchorEl={moreAnchor}
                                                    open={Boolean(moreAnchor)}
                                                    onClose={() => setMoreAnchor(null)}
                                                    PaperProps={{
                                                        sx: {
                                                            bgcolor: '#25232C',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            color: '#fff',
                                                        },
                                                    }}
                                                >
                                                    <MenuItem
                                                        onClick={() => {
                                                            setMoreAnchor(null);
                                                            if (!isAuthenticated) {
                                                                navigate('/login', { state: { from: `/community/posts/${id}` } });
                                                                return;
                                                            }
                                                            setReportOpen(true);
                                                        }}
                                                    >
                                                        <ListItemIcon sx={{ color: '#FF4757', minWidth: 32 }}>
                                                            <FlagIcon fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText primary="Báo cáo" />
                                                    </MenuItem>
                                                </Menu>
                                                <ReportDialog
                                                    open={reportOpen}
                                                    onClose={() => setReportOpen(false)}
                                                    targetType="COMMUNITY_POST"
                                                    targetId={Number(id)}
                                                    targetTitle={post.title}
                                                />
                                            </>
                                        )}
                                    </Stack>
                                </Box>
                            </Stack>

                            <Typography fontSize={18} fontWeight={800} color="#fff" sx={{ mb: 1.5, lineHeight: 1.35 }}>
                                {post.title}
                            </Typography>

                            <CommunityPostExpandableDescription
                                text={post.description}
                                color="rgba(255,255,255,0.9)"
                                moreColor={PURPLE}
                                fontSize={15}
                            />

                            {images.length > 0 && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        gap: 1,
                                        overflowX: 'auto',
                                        borderRadius: '12px',
                                        mb: 2,
                                        '&::-webkit-scrollbar': { height: 6 },
                                        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3 },
                                    }}
                                >
                                    {images.map((url) => (
                                        <Box
                                            key={url}
                                            component="img"
                                            src={url}
                                            alt=""
                                            sx={{
                                                flexShrink: 0,
                                                width: images.length === 1 ? '100%' : '85%',
                                                maxHeight: 360,
                                                objectFit: 'cover',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}

                            <Stack direction="row" alignItems="center" spacing={3} sx={{ pt: 0.5 }}>
                                <Tooltip title={isLiked ? 'Bỏ thích' : 'Thích'}>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <IconButton size="small" disabled={likeSubmitting} onClick={handleLike} sx={{ color: isLiked ? LIKE_RED : 'rgba(255,255,255,0.6)' }}>
                                            {isLiked ? <FavoriteIcon sx={{ fontSize: 20 }} /> : <FavoriteBorder sx={{ fontSize: 20 }} />}
                                        </IconButton>
                                        <Typography fontSize={13} fontWeight={600} color="rgba(255,255,255,0.6)">
                                            {likeCount}
                                        </Typography>
                                    </Stack>
                                </Tooltip>
                                <Tooltip title="Bình luận">
                                    <Stack direction="row" alignItems="center" spacing={0.5} onClick={scrollToComments} sx={{ cursor: 'pointer' }}>
                                        <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            <ModeCommentOutlined sx={{ fontSize: 20 }} />
                                        </IconButton>
                                        <Typography fontSize={13} fontWeight={600} color="rgba(255,255,255,0.6)">
                                            {commentCount}
                                        </Typography>
                                    </Stack>
                                </Tooltip>
                                <Tooltip title="Chia sẻ">
                                    <IconButton size="small" disabled={shareSubmitting} onClick={handleShare} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                        <ShareOutlined sx={{ fontSize: 21 }} />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Box>

                        <Box
                            ref={commentsRef}
                            sx={{
                                bgcolor: CARD_BG,
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                overflow: 'hidden',
                            }}
                        >
                            <CommunityPostComments postId={Number(id)} onNotify={onNotify} onThreadDelta={onThreadDelta} />
                        </Box>
                    </>
                ) : null}
            </Box>
        </Box>
    );
}
