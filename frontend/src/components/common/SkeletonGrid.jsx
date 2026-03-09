/**
 * SkeletonGrid — generic wrapper render N skeleton items trong grid.
 * Props:
 *   count       – số skeleton cần render (default 8)
 *   columns     – { xs, sm, md, lg } số cột tương ứng breakpoint
 *   renderItem  – () => ReactNode, render một skeleton item
 */
import { Box } from '@mui/material';
import PropTypes from 'prop-types';

const DEFAULT_COLUMNS = { xs: 1, sm: 2, md: 3, lg: 4 };

export default function SkeletonGrid({
                                         count = 8,
                                         columns = DEFAULT_COLUMNS,
                                         renderItem,
                                     }) {
    const { xs = 1, sm = 2, md = 3, lg = 4 } = columns;

    return (
        <Box
            sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                    xs: `repeat(${xs}, 1fr)`,
                    sm: `repeat(${sm}, 1fr)`,
                    md: `repeat(${md}, 1fr)`,
                    lg: `repeat(${lg}, 1fr)`,
                },
            }}
        >
            {Array.from({ length: count }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <Box key={i}>{renderItem?.()}</Box>
            ))}
        </Box>
    );
}

SkeletonGrid.propTypes = {
    count: PropTypes.number,
    columns: PropTypes.shape({
        xs: PropTypes.number,
        sm: PropTypes.number,
        md: PropTypes.number,
        lg: PropTypes.number,
    }),
    renderItem: PropTypes.func,
};
