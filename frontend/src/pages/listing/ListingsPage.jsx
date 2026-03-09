/** Mục đích: Trang danh sách listing – đọc q/category/sort/page/size từ URL. */
import { Box, Stack } from '@mui/material';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import Sidebar from '../../components/layout/Sidebar';
import ListingsFeed from '../../components/listing/ListingsFeed';
import useListings from '../../hooks/useListings';

export default function ListingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get('page') || 0);
    const size = Number(searchParams.get('size') || 10);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'createdAt,desc';

    const { data, isLoading, meta } = useListings({ q, category, sort, page, size });

    const handlePageChange = useCallback(
        (newPage) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set('page', String(newPage));
                return next;
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        [setSearchParams],
    );

    const handlePageSizeChange = useCallback(
        (newSize) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set('size', String(newSize));
                next.set('page', '0');
                return next;
            });
        },
        [setSearchParams],
    );

    return (
        <Stack direction="row">
            <Sidebar />
            <Box flex={1} minWidth={0}>
                <ListingsFeed listings={data} isLoading={isLoading} />
                <Pagination
                    page={page}
                    totalPages={meta?.totalPages ?? 0}
                    totalElements={meta?.totalElements}
                    pageSize={size}
                    onChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    disabled={isLoading}
                />
            </Box>
        </Stack>
    );
}
