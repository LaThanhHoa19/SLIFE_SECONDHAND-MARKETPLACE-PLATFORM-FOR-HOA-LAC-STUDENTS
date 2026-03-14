/**
 * Skeleton placeholder cho ListingCard — mirror đúng layout của ListingCard.
 * Dùng khi đang fetch danh sách listing.
 */
import { Card, CardContent, Skeleton } from '@mui/material';

export default function ListingCardSkeleton() {
    return (
        <Card sx={{ overflow: 'hidden' }}>
            <Skeleton
                variant="rectangular"
                width="100%"
                height={160}
                animation="wave"
                sx={{ bgcolor: 'rgba(255,255,255,0.07)' }}
            />
            <CardContent>
                <Skeleton
                    variant="text"
                    sx={{ fontSize: '1rem', maxWidth: '85%', bgcolor: 'rgba(255,255,255,0.07)' }}
                    animation="wave"
                />
                <Skeleton
                    variant="text"
                    sx={{ fontSize: '0.875rem', maxWidth: '50%', mt: 0.5, bgcolor: 'rgba(255,255,255,0.06)' }}
                    animation="wave"
                />
            </CardContent>
        </Card>
    );
}
