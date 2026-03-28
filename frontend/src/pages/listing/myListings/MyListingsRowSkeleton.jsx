import { Box, Skeleton, Stack } from '@mui/material';

/** Skeleton hàng ngang — khớp layout MyListingCard (khác ListingCardSkeleton dạng card feed). */
export default function MyListingsRowSkeleton() {
    return (
        <Box sx={{
            display: 'flex',
            gap: 2.5,
            p: 2.5,
            borderRadius: '14px',
            bgcolor: '#262130',
            border: '1px solid rgba(255,255,255,0.06)',
        }}>
            <Skeleton
                variant="rounded"
                width={112} height={112}
                sx={{ bgcolor: 'rgba(255,255,255,0.07)', flexShrink: 0, borderRadius: '10px' }}
            />
            <Box sx={{ flex: 1, pt: 0.5 }}>
                <Skeleton variant="text" width="55%" height={22} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
                <Skeleton variant="text" width="30%" height={20} sx={{ bgcolor: 'rgba(255,255,255,0.07)', mt: 0.75 }} />
                <Stack direction="row" gap={1} sx={{ mt: 1 }}>
                    <Skeleton variant="rounded" width={72} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '20px' }} />
                    <Skeleton variant="rounded" width={88} height={22} sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '20px' }} />
                </Stack>
                <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mt: 1 }} />
            </Box>
        </Box>
    );
}
