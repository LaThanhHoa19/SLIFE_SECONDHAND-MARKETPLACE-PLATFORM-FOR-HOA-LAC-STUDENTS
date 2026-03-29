import { Box, Skeleton, Stack } from '@mui/material';
import { STITCH_ACTION_BAR_BG, STITCH_CARD, STITCH_CARD_BORDER } from './myListingsConfig';

export default function MyListingsGridCardSkeleton() {
    return (
        <Box sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            bgcolor: STITCH_CARD,
            border: `1px solid ${STITCH_CARD_BORDER}`,
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Skeleton
                variant="rounded"
                sx={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    bgcolor: 'rgba(255,255,255,0.06)',
                    borderRadius: 0,
                }}
            />
            <Stack sx={{ p: 2, gap: 1 }}>
                <Skeleton variant="text" width="90%" height={22} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
                <Skeleton variant="text" width="40%" height={26} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
            </Stack>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 1.5,
                    py: 1,
                    bgcolor: STITCH_ACTION_BAR_BG,
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <Stack direction="row" gap={0.5}>
                    <Skeleton variant="circular" width={34} height={34} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                    <Skeleton variant="circular" width={34} height={34} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                    <Skeleton variant="circular" width={34} height={34} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                </Stack>
                <Skeleton variant="text" width={68} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
            </Box>
        </Box>
    );
}
