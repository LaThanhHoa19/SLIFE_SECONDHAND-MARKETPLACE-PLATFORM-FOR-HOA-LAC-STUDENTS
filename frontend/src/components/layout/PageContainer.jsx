/**
 * Wrapper for page content with consistent max-width.
 * Padding is provided by MainLayout; this only constrains width and centers.
 */
import { Box } from '@mui/material';
import {
    NARROW_PAGE_MAX_WIDTH,
    DETAIL_PAGE_MAX_WIDTH,
} from '../../utils/layoutConstants';

const MAX_WIDTH_MAP = {
    narrow: NARROW_PAGE_MAX_WIDTH,
    detail: DETAIL_PAGE_MAX_WIDTH,
    full: null,
};

export default function PageContainer({
                                          children,
                                          maxWidth = 'full',
                                          sx = {},
                                          ...rest
                                      }) {
    const resolvedMaxWidth = typeof maxWidth === 'string' ? MAX_WIDTH_MAP[maxWidth] : maxWidth;
    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: resolvedMaxWidth ?? '100%',
                mx: resolvedMaxWidth ? 'auto' : undefined,
                ...sx,
            }}
            {...rest}
        >
            {children}
        </Box>
    );
}
