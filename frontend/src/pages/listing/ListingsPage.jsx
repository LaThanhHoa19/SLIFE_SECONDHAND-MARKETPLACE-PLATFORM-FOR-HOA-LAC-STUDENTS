/** Mục đích: Trang danh sách, đọc query q/category/sort/page/size từ URL, gọi useListings + Pagination. */
import {Box} from '@mui/material';
import {useSearchParams} from 'react-router-dom';
import ListingsFeed from '../../components/listing/ListingsFeed';
import Pagination from '../../components/common/Pagination';
import useListings from '../../hooks/useListings';

export default function ListingsPage() {
    const [searchParams] = useSearchParams();
    const {data, isLoading, meta} = useListings({
        q: searchParams.get('q') || '',
        category: searchParams.get('category') || '',
        location: searchParams.get('location') || '',
        sort: searchParams.get('sort') || 'createdAt,desc',
        page: Number(searchParams.get('page') || 0),
        size: Number(searchParams.get('size') || 10),
    });
    return (
        <Box sx={{minHeight: 'calc(100vh - 64px)', py: 3, px: 2, bgcolor: '#BCBCBC'}}>
            <Box sx={{maxWidth: 720, mx: 'auto'}}>
                <ListingsFeed listings={data} isLoading={isLoading}/>
                <Box sx={{mt: 2}}>
                    <Pagination page={Number(searchParams.get('page') || 0)} totalPages={meta.totalPages}/>
                </Box>
            </Box>
        </Box>
    );
}
