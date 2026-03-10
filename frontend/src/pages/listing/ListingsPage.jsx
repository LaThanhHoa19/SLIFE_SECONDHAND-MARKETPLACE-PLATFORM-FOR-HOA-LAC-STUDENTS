/** Mục đích: Trang danh sách, đọc query q/category/sort/page/size từ URL, gọi useListings + Pagination. */
import { Box } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import ListingsFeed from '../../components/listing/ListingsFeed';
import Pagination from '../../components/common/Pagination';
import useListings from '../../hooks/useListings';
export default function ListingsPage() {
    const [searchParams] = useSearchParams();
    const { data, isLoading, meta } = useListings({
        q: searchParams.get('q') || '',
        category: searchParams.get('category') || '',
        location: searchParams.get('location') || '',
        sort: searchParams.get('sort') || 'createdAt,desc',
        page: Number(searchParams.get('page') || 0),
        size: Number(searchParams.get('size') || 10),
    });
    return (
        <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
            <ListingsFeed listings={data} isLoading={isLoading} />
            <Pagination page={Number(searchParams.get('page') || 0)} totalPages={meta.totalPages} />
        </Box>
    );
}
