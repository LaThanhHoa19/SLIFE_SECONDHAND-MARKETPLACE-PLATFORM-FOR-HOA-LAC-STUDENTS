/** * Mục đích: Trang danh sách listing – Đồng bộ hóa URL (q, category, sort, page) với API.
 * Hỗ trợ phân trang, tìm kiếm và lọc dữ liệu.
 */
import { Box, Stack } from '@mui/material';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ErrorState from '../../components/common/ErrorState';
import Pagination from '../../components/common/Pagination';
import Sidebar from '../../components/layout/Sidebar';
import ListingsFeed from '../../components/listing/ListingsFeed';
import useListings from '../../hooks/useListings';

export default function ListingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // 1. Trích xuất tham số từ URL (SSOT - Single Source of Truth)
    const page = Number(searchParams.get('page') || 0);
    const size = Number(searchParams.get('size') || 10);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'createdAt,desc';

    // 2. Gọi Hook lấy dữ liệu dựa trên URL params
    const { data, isLoading, error, refetch, meta } = useListings({ 
        q, 
        category, 
        sort, 
        page, 
        size 
    });

    // 3. Xử lý thay đổi trang - Cập nhật URL thay vì chỉ cập nhật State nội bộ
    const handlePageChange = useCallback(
        (newPage) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set('page', String(newPage));
                return next;
            });
            // Cuộn lên đầu trang mượt mà sau khi chuyển trang
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        [setSearchParams],
    );

    const handlePageSizeChange = useCallback(
        (newSize) => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set('size', String(newSize));
                next.set('page', '0'); // Reset về trang đầu khi đổi size
                return next;
            });
        },
        [setSearchParams],
    );

    return (
        <Stack direction="row" spacing={0} sx={{ minHeight: '100vh' }}>
            {/* Sidebar cho phép người dùng lọc danh mục nhanh */}
            <Sidebar />
            
            <Box flex={1} minWidth={0} p={2}>
                {error ? (
                    <ErrorState
                        variant={error.variant || 'error'}
                        message={error.message || 'Đã có lỗi xảy ra khi tải danh sách.'}
                        onRetry={refetch}
                    />
                ) : (
                    <>
                        {/* Hiển thị danh sách grid đã merge trước đó */}
                        <ListingsFeed 
                            listings={data} 
                            isLoading={isLoading} 
                        />
                        
                        {/* Thanh phân trang tích hợp */}
                        <Pagination
                            page={page}
                            totalPages={meta?.totalPages ?? 0}
                            totalElements={meta?.totalElements ?? 0}
                            pageSize={size}
                            onChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            disabled={isLoading}
                        />
                    </>
                )}
            </Box>
        </Stack>
    );
}