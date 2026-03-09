/**
 * ListingsFeed — render danh sách listing dạng grid.
 * Khi isLoading=true hiển thị skeleton thay spinner.
 * Props: listings, isLoading, columns
 */
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import SkeletonGrid from '../common/SkeletonGrid';
import ListingCard from './ListingCard';
import ListingCardSkeleton from './ListingCardSkeleton';

const DEFAULT_COLUMNS = { xs: 1, sm: 2, md: 3, lg: 4 };

export default function ListingsFeed({
                                         listings = [],
                                         isLoading = false,
                                         columns = DEFAULT_COLUMNS,
                                     }) {
    const { xs = 1, sm = 2, md = 3, lg = 4 } = columns;

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

    if (isLoading) {
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

    if (!listings.length) {
        return (
            <Box p={4} textAlign="center">
                <Typography color="text.secondary">Không có kết quả nào.</Typography>
            </Box>
        );
    }

    return (
        <Box p={2} sx={gridSx}>
            {listings.map((item) => (
                <ListingCard key={item.listingId ?? item.id} listing={item} />
            ))}
        </Box>
    );
}

ListingsFeed.propTypes = {
    listings: PropTypes.array,
    isLoading: PropTypes.bool,
    columns: PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        md: PropTypes.number,
        lg: PropTypes.number,
    }),
};
