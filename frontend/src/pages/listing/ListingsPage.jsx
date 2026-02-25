/** Mục đích: Trang danh sách, đọc query q/category/sort/page/size từ URL, gọi useListings + Pagination. */
import { Box } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import ListingsFeed from '../../components/listing/ListingsFeed';
import Sidebar from '../../components/layout/Sidebar';
import Pagination from '../../components/common/Pagination';
import useListings from '../../hooks/useListings';
export default function ListingsPage(){ const [searchParams] = useSearchParams(); const {data,isLoading,meta}=useListings({ q: searchParams.get('q')||'', category: searchParams.get('category')||'', sort: searchParams.get('sort')||'createdAt,desc', page:Number(searchParams.get('page')||0), size:Number(searchParams.get('size')||10)}); return <Box><Sidebar /><ListingsFeed listings={data} isLoading={isLoading} /><Pagination page={Number(searchParams.get('page')||0)} totalPages={meta.totalPages} /></Box>; }
