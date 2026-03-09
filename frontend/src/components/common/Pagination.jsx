/**
 * Pagination reusable component
 * Props:
 *   page          – current page (0-indexed)
 *   totalPages    – total number of pages
 *   totalElements – total number of items (optional, for display)
 *   pageSize      – current page size
 *   pageSizes     – array of allowed page sizes, e.g. [10, 20, 50]
 *   onChange(page)          – called when page changes (0-indexed)
 *   onPageSizeChange(size)  – called when page size changes (optional)
 *   disabled      – disable all controls
 */
import {
    Box,
    MenuItem,
    Pagination as MuiPagination,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import PropTypes from 'prop-types';

const DEFAULT_PAGE_SIZES = [10, 20, 30];

export default function Pagination({
                                       page = 0,
                                       totalPages = 0,
                                       totalElements,
                                       pageSize = 10,
                                       pageSizes = DEFAULT_PAGE_SIZES,
                                       onChange,
                                       onPageSizeChange,
                                       disabled = false,
                                   }) {
    if (totalPages <= 0) return null;

    const from = totalElements != null ? page * pageSize + 1 : null;
    const to =
        totalElements != null ? Math.min((page + 1) * pageSize, totalElements) : null;

    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            px={2}
            py={1.5}
            flexWrap="wrap"
        >
            {/* Left: total count + page size */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
                {totalElements != null && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {from}–{to} / {totalElements} kết quả
                    </Typography>
                )}

                {onPageSizeChange && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2" color="text.secondary">
                            Hiển thị:
                        </Typography>
                        <Select
                            size="small"
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            disabled={disabled}
                            sx={{ fontSize: '0.875rem', minWidth: 64 }}
                        >
                            {pageSizes.map((s) => (
                                <MenuItem key={s} value={s}>
                                    {s}
                                </MenuItem>
                            ))}
                        </Select>
                    </Stack>
                )}
            </Stack>

            {/* Right: page navigator */}
            <Box>
                <MuiPagination
                    count={totalPages}
                    page={page + 1}
                    onChange={(_, value) => onChange?.(value - 1)}
                    disabled={disabled}
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                    siblingCount={1}
                    boundaryCount={1}
                />
            </Box>
        </Stack>
    );
}

Pagination.propTypes = {
    page: PropTypes.number,
    totalPages: PropTypes.number,
    totalElements: PropTypes.number,
    pageSize: PropTypes.number,
    pageSizes: PropTypes.arrayOf(PropTypes.number),
    onChange: PropTypes.func,
    onPageSizeChange: PropTypes.func,
    disabled: PropTypes.bool,
};
