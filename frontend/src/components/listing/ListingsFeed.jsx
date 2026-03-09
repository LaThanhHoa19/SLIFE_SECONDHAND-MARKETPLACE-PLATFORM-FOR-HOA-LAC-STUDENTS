/**
 * ListingsFeed — render danh sách listing dạng grid linh hoạt.
 * Kết hợp Skeleton loading từ 'main' và tính năng Load More từ 'Hoa'.
 */
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';
import SkeletonGrid from '../common/SkeletonGrid';
import ListingCard from './ListingCard';
import ListingCardSkeleton from './ListingCardSkeleton';

const DEFAULT_COLUMNS = { xs: 1, sm: 2, md: 3, lg: 4 };

export default function ListingsFeed({
    listings = [],
    isLoading = false,
    isFetchingMore = false, // Trạng thái khi bấm Load More
    onLoadMore,
    hasMore = false,
    columns = DEFAULT_COLUMNS,
}) {
    const { xs, sm, md, lg } = { ...DEFAULT_COLUMNS, ...columns };

    const gridSx = {
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
            xs: `repeat(${xs}, 1fr)`,
            sm: `repeat(${sm}, 1fr)`,
            md: `repeat(${md}, 1fr)`,
            lg: `repeat(${lg}, 1fr)`,
        },
    };

    // Initial Loading State
    if (isLoading && listings.length === 0) {
        return (
            <Box p={2}>
                <SkeletonGrid
                    count={8}
                    columns={columns}
                    renderItem={() => <ListingCardSkeleton />}
                />
            </Box>
        );
    }

    // Empty State
    if (!isLoading && listings.length === 0) {
        return (
            <Box p={4} textAlign="center">
                <Typography color="text.secondary">Không có kết quả nào.</Typography>
            </Box>
        );
    }

    return (
        <Box p={2}>
            {/* Grid display for Listing Cards */}
            <Box sx={gridSx}>
                {listings.map((item) => (
                    <ListingCard key={item.listingId ?? item.id} listing={item} />
                ))}
            </Box>

            {/* Pagination / Load More Section (Integrated from Hoa) */}
            {hasMore && (
                <Box mt={4} textAlign="center">
                    <Button
                        variant="outlined"
                        onClick={onLoadMore}
                        disabled={isFetchingMore}
                        startIcon={isFetchingMore ? <CircularProgress size={20} /> : null}
                        sx={{ minWidth: 200 }}
                    >
                        {isFetchingMore ? 'Đang tải...' : 'Xem thêm'}
                    </Button>
                </Box>
            )}
        </Box>
    );
}

ListingsFeed.propTypes = {
    listings: PropTypes.array,
    isLoading: PropTypes.bool,
    isFetchingMore: PropTypes.bool,
    onLoadMore: PropTypes.func,
    hasMore: PropTypes.bool,
    columns: PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        md: PropTypes.number,
        lg: PropTypes.number,
    }),
};