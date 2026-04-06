/** Mục đích: Trang danh sách — feed bên trái, panel danh mục bên phải với infinite scroll + scroll-to-top. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Fab, Typography } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useSearchParams } from 'react-router-dom';
import ListingsFeed from '../../components/listing/ListingsFeed';
import FeedHeader from '../../components/listing/FeedHeader';
import RightPanel from '../../components/layout/RightPanel';
import useListings from '../../hooks/useListings';

export default function ListingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const resolveFeedTypeFromParams = useCallback((params) => {
        const short = String(params.get('f') || '').toLowerCase();
        if (short === 'n') return 'NEWEST';
        if (short === 'p') return 'POPULAR';
        if (short === 'g') return 'GIVEAWAY';
        if (short === 'w') return 'FOLLOWING';

        // Backward-compat với URL cũ
        const fromFeedType = String(params.get('feedType') || '').toUpperCase();
        if (['NEWEST', 'POPULAR', 'FOLLOWING', 'GIVEAWAY'].includes(fromFeedType)) {
            return fromFeedType;
        }

        const prioritizeFollowing = String(params.get('prioritizeFollowing') || '').toLowerCase();
        if (prioritizeFollowing === 'true') return 'FOLLOWING';
        if (prioritizeFollowing === 'false') return 'NEWEST';

        // Mặc định mới: vào Feed ở tab Mới nhất
        return 'NEWEST';
    }, []);

    const [feedType, setFeedType] = useState(() => resolveFeedTypeFromParams(searchParams));

    useEffect(() => {
        const nextFeedType = resolveFeedTypeFromParams(searchParams);
        setFeedType((prev) => (prev === nextFeedType ? prev : nextFeedType));
    }, [searchParams, resolveFeedTypeFromParams]);

    const { data, isLoading, isLoadingMore, hasMore, loadMore, patchListing, refetch } = useListings({
        q: searchParams.get('q') || '',
        category: searchParams.get('category') || '',
        subcategory: searchParams.get('subcategory') || '',
        location: searchParams.get('location') || '',
        condition: searchParams.get('condition') || '',
        sort: searchParams.get('sort') || 'createdAt,desc',
        prioritizeFollowing: feedType === 'FOLLOWING',
        feedType,
        size: 10,
    });

    // IntersectionObserver sentinel for infinite scroll
    const sentinelRef = useRef(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMore();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, loadMore]);

    // Scroll-to-top button visibility
    const [showTop, setShowTop] = useState(false);
    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 400);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleFeedTypeChange = useCallback((nextFeedType) => {
        if (!nextFeedType) return;
        setFeedType(nextFeedType);
        const params = new URLSearchParams(searchParams);

        // Dọn các param mặc định để URL ngắn gọn hơn
        params.delete('page');
        if (params.get('sort') === 'createdAt,desc') {
            params.delete('sort');
        }

        // Canonical theo feed type: chỉ giữ những gì thật sự cần
        params.delete('prioritizeFollowing');
        params.delete('feedType');
        params.delete('f');

        if (nextFeedType === 'POPULAR') params.set('f', 'p');
        if (nextFeedType === 'GIVEAWAY') params.set('f', 'g');
        if (nextFeedType === 'NEWEST') params.set('f', 'n');
        if (nextFeedType === 'FOLLOWING') params.set('f', 'w');

        setSearchParams(params);
    }, [searchParams, setSearchParams]);

    return (
        <Box sx={{ display: 'flex', gap: { xs: 2, lg: 3 }, p: 2, alignItems: 'flex-start', maxWidth: 1040, mx: 'auto', width: '100%', justifyContent: 'center' }}>
            {/* Feed chính */}
            <Box sx={{ flex: 1, minWidth: { xs: 0, sm: 400 }, maxWidth: 680, display: 'flex', flexDirection: 'column' }}>
                <FeedHeader feedType={feedType} onFeedTypeChange={handleFeedTypeChange} onRefetch={refetch} />
                <ListingsFeed listings={data} isLoading={isLoading} onPatchListing={patchListing} />

                {/* Infinite scroll sentinel */}
                <Box ref={sentinelRef} sx={{ height: 1 }} />

                {/* Loading more indicator */}
                {isLoadingMore && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={28} sx={{ color: '#9D6EED' }} />
                    </Box>
                )}

                {/* End of feed message */}
                {!hasMore && !isLoading && data.length > 0 && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography fontSize={13} color="rgba(255,255,255,0.35)">
                            Bạn đã xem hết tất cả tin đăng 🎉
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Panel phải — danh mục, banner, tải app */}
            <RightPanel />

            {/* Scroll to Top FAB */}
            {showTop && (
                <Fab
                    size="small"
                    onClick={scrollToTop}
                    sx={{
                        position: 'fixed',
                        bottom: 32,
                        right: 32,
                        bgcolor: '#9D6EED',
                        color: '#fff',
                        '&:hover': { bgcolor: '#8B59D6' },
                        boxShadow: '0 4px 16px rgba(157,110,237,0.4)',
                        zIndex: 1200,
                    }}
                    aria-label="Lên đầu trang"
                >
                    <KeyboardArrowUpIcon />
                </Fab>
            )}
        </Box>
    );
}
