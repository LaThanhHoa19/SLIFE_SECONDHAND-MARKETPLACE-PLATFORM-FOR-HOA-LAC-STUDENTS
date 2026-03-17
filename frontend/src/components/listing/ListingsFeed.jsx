/** Mục đích: render danh sách listing + loading + loadMore. Props: listings,isLoading,onLoadMore. */
import { Box, Typography, Fade } from '@mui/material';
import ListingCard from './ListingCard';
import ListingCardSkeleton from './ListingCardSkeleton';

const SKELETON_COUNT = 6;

export default function ListingsFeed({ listings = [], isLoading = false, viewMode = 'list' }) {
    if (isLoading) {
        return (
            <Fade in timeout={{ enter: 280 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        minHeight: 320,
                    }}
                >
                    {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                animation: 'listingsFeedFadeIn 0.35s ease-out both',
                                animationDelay: `${idx * 45}ms`,
                                '@keyframes listingsFeedFadeIn': {
                                    from: { opacity: 0, transform: 'translateY(8px)' },
                                    to: { opacity: 1, transform: 'translateY(0)' },
                                },
                            }}
                        >
                            <ListingCardSkeleton />
                        </Box>
                    ))}
                </Box>
            </Fade>
        );
    }

    if (!listings.length) {
        return (
            <Fade in timeout={{ enter: 320 }}>
                <Box sx={{ p: 4, borderRadius: 2, textAlign: 'center', bgcolor: '#201D26' }}>
                    <Typography variant="body1" color="rgba(255,255,255,0.7)">
                        Chưa có tin đăng phù hợp.
                    </Typography>
                </Box>
            </Fade>
        );
    }

    return (
        <Fade in timeout={{ enter: 360 }}>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(260px, 1fr))' : '1fr',
                    gap: 2,
                    '& > *': {
                        animation: 'listingsCardFadeIn 0.4s ease-out both',
                    },
                    '& > *:nth-of-type(1)': { animationDelay: '0ms' },
                    '& > *:nth-of-type(2)': { animationDelay: '40ms' },
                    '& > *:nth-of-type(3)': { animationDelay: '80ms' },
                    '& > *:nth-of-type(4)': { animationDelay: '120ms' },
                    '& > *:nth-of-type(5)': { animationDelay: '160ms' },
                    '& > *:nth-of-type(6)': { animationDelay: '200ms' },
                    '& > *:nth-of-type(n+7)': { animationDelay: '240ms' },
                    '@keyframes listingsCardFadeIn': {
                        from: { opacity: 0, transform: 'translateY(6px)' },
                        to: { opacity: 1, transform: 'translateY(0)' },
                    },
                }}
            >
                {listings.map((item) => (
                    <ListingCard key={item.id || item.listingId} listing={item} />
                ))}
            </Box>
        </Fade>
    );
}
