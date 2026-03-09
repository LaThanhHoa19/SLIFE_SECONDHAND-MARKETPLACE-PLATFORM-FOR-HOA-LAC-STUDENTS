/**
 * Skeleton placeholder cho ListingCard — mirror đúng layout của ListingCard.
 * Dùng khi đang fetch danh sách listing.
 */
import { Card, CardContent, Skeleton } from '@mui/material';

export default function ListingCardSkeleton() {
    return (
        <Card sx={{ overflow: 'hidden' }}>
            {/* Image area — height 160 khớp với CardMedia trong ListingCard */}
            <Skeleton variant="rectangular" width="100%" height={160} />
            <CardContent>
                {/* Title */}
                <Skeleton variant="text" sx={{ fontSize: '1rem' }} width="80%" />
                {/* Price */}
                <Skeleton variant="text" sx={{ fontSize: '0.875rem' }} width="50%" />
            </CardContent>
        </Card>
    );
}
