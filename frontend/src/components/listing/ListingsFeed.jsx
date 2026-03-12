/** Mục đích: render danh sách listing + loading + loadMore. Props: listings,isLoading,onLoadMore. */
import { Box, Typography } from '@mui/material';
import ListingCard from './ListingCard';
import ListingCardSkeleton from './ListingCardSkeleton';

export default function ListingsFeed({ listings = [], isLoading = false }) {
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({ length: 3 }).map((_, idx) => (
                    <ListingCardSkeleton key={idx} />
                ))}
            </Box>
        );
    }

    if (!listings.length) {
        return (
            <Box sx={{ p: 4, borderRadius: 2, textAlign: 'center', bgcolor: '#201D26' }}>
                <Typography variant="body1" color="rgba(255,255,255,0.7)">Chưa có tin đăng phù hợp.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {listings.map((item) => <ListingCard key={item.id || item.listingId} listing={item} />)}
        </Box>
    );
}
