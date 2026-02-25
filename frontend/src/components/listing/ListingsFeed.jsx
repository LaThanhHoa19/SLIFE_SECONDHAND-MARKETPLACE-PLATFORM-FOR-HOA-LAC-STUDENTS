/** Mục đích: render danh sách listing + loading + loadMore. Props: listings,isLoading,onLoadMore. */
import { Box, Button } from '@mui/material';
import ListingCard from './ListingCard';
import Loading from '../common/Loading';
export default function ListingsFeed({ listings = [], isLoading = false, onLoadMore }){ if (isLoading) return <Loading />; return <Box>{listings.map((item) => <ListingCard key={item.listingId || item.id} listing={item} />)}<Button onClick={onLoadMore}>TODO: Load more</Button></Box>; }
