/** Mục đích: Trang danh sách — feed bên trái, panel danh mục bên phải. */
import { Box } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import ListingsFeed from '../../components/listing/ListingsFeed';
import RightPanel from '../../components/layout/RightPanel';
import Pagination from '../../components/common/Pagination';
import useListings from '../../hooks/useListings';

export default function ListingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { data, isLoading, meta, patchListing } = useListings({
        q: searchParams.get('q') || '',
        category: searchParams.get('category') || '',
        location: searchParams.get('location') || '',
        condition: searchParams.get('condition') || '',
        sort: searchParams.get('sort') || 'createdAt,desc',
        page: Number(searchParams.get('page') || 0),
        size: Number(searchParams.get('size') || 10),
    });

    return (
        <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'flex-start' }}>
            {/* Feed chính */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <ListingsFeed listings={data} isLoading={isLoading} onPatchListing={patchListing} />
                <Pagination
                    page={Number(searchParams.get('page') || 0)}
                    totalPages={meta.totalPages}
                    onChange={(nextPage) => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', String(nextPage));
                        setSearchParams(params);
                    }}
                />
            </Box>

            {/* Panel phải — danh mục, banner, tải app */}
            <RightPanel />
        </Box>
    );
}
