import { useEffect, useMemo, useRef } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

import RightPanel from '../layout/RightPanel';
import CommunityPostCard from './CommunityPostCard';
import useCommunityPostList from '../../hooks/useCommunityPostList';
import useCommunityFeedRealtime from '../../hooks/useCommunityFeedRealtime';
import { useAuth } from '../../hooks/useAuth';

function FeedSkeleton() {
    return (
        <Stack spacing={1.1} sx={{ p: 1 }}>
            {[1, 2, 3].map((k) => (
                <Box key={k} sx={{ borderRadius: 2.2, p: 1.2, border: '1px solid rgba(255,255,255,0.07)', bgcolor: 'rgba(255,255,255,0.018)' }}>
                    <Box sx={{ height: 140, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.07)' }} />
                </Box>
            ))}
        </Stack>
    );
}

export default function CommunityPostListPage({ mode, title, emptyTitle, emptySubtitle, requireAuth = false }) {
    const theme = useTheme();
    const sentinelRef = useRef(null);
    const { user, isAuthenticated } = useAuth();
    const isDark = theme.palette.mode === 'dark';

    const { posts, loading, loadingMore, hasMore, error, loadInitial, loadMore, patchPost, deletePost } = useCommunityPostList({ mode });

    useCommunityFeedRealtime(true, undefined, (evt) => {
        const type = String(evt?.type || '');
        const postId = Number(evt?.postId);
        if (!Number.isFinite(postId)) return;
        if (type === 'POST_DELETED') deletePost(postId);
        if (type === 'SAVED_TOGGLED' && Number(evt?.userId) === Number(user?.id)) {
            if (!evt?.saved && mode === 'saved') deletePost(postId);
            else patchPost(postId, { isSaved: !!evt?.saved });
        }
        if (type === 'LIKED_TOGGLED' && Number(evt?.userId) === Number(user?.id)) {
            if (!evt?.liked && mode === 'liked') deletePost(postId);
            else patchPost(postId, { isLiked: !!evt?.liked });
        }
    });

    useEffect(() => {
        if (!sentinelRef.current || loading || loadingMore || !hasMore) return undefined;
        const obs = new IntersectionObserver((entries) => {
            const e = entries?.[0];
            if (e?.isIntersecting) void loadMore();
        }, { rootMargin: '280px', threshold: 0.01 });
        obs.observe(sentinelRef.current);
        return () => obs.disconnect();
    }, [hasMore, loading, loadingMore, loadMore]);

    const empty = useMemo(() => ({ title: emptyTitle, subtitle: emptySubtitle }), [emptyTitle, emptySubtitle]);

    if (requireAuth && !isAuthenticated) {
        return <Box sx={{ p: 3 }}><Alert severity="warning">Bạn cần đăng nhập để xem trang này.</Alert></Box>;
    }

    return (
        <Box sx={{ minHeight: 'calc(100vh - 96px)', p: { xs: 1, sm: 1.5, md: 2 }, background: isDark ? 'radial-gradient(1200px 420px at 18% -8%, rgba(128,88,255,0.24) 0%, rgba(20,24,56,0.96) 46%, #070b22 100%)' : alpha(theme.palette.primary.main, 0.04) }}>
            <Box sx={{ display: 'flex', gap: { xs: 1.5, lg: 2.5 }, alignItems: 'flex-start', justifyContent: 'center', maxWidth: 1220, mx: 'auto', width: '100%' }}>
                <Box sx={{ flex: '1 1 720px', minWidth: { xs: 0, sm: 420 }, maxWidth: 720, mx: 'auto' }}>
                    <Box sx={{ borderTopLeftRadius: '24px', borderTopRightRadius: '24px', bgcolor: 'rgba(10,13,30,0.88)', border: '1px solid rgba(255,255,255,0.12)', borderBottom: 'none', overflow: 'hidden' }}>
                        <Box sx={{ px: 2, py: 1.2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <Typography sx={{ fontSize: { xs: 15, sm: 16 }, fontWeight: 800, color: '#e5dcff' }}>{title}</Typography>
                        </Box>
                    </Box>

                    {error ? <Alert severity="error" sx={{ mb: 1.2, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={loadInitial}>Thử lại</Button>}>{error}</Alert> : null}

                    <Box sx={{ borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', bgcolor: 'rgba(10,13,30,0.88)', border: '1px solid rgba(255,255,255,0.12)', borderTop: 'none', overflow: 'hidden' }}>
                        {loading ? <FeedSkeleton /> : posts.length === 0 ? (
                            <Card elevation={0} sx={{ borderRadius: 0, bgcolor: 'transparent' }}>
                                <CardContent sx={{ py: 5, textAlign: 'center' }}>
                                    <Typography variant="subtitle1" fontWeight={800} gutterBottom sx={{ color: '#d5ccff' }}>{empty.title}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 2 }}>{empty.subtitle}</Typography>
                                </CardContent>
                            </Card>
                        ) : (
                            <Stack spacing={0}>
                                {posts.map((post) => <CommunityPostCard key={post.id} post={post} onPatchPost={(id, patch) => patchPost(id, patch)} onDeletePost={deletePost} />)}
                                <Box ref={sentinelRef} sx={{ height: 1 }} />
                                {hasMore && loadingMore ? <Box sx={{ textAlign: 'center', py: 1.2 }}><CircularProgress size={22} /></Box> : null}
                            </Stack>
                        )}
                    </Box>
                </Box>
                <RightPanel />
            </Box>
        </Box>
    );
}
