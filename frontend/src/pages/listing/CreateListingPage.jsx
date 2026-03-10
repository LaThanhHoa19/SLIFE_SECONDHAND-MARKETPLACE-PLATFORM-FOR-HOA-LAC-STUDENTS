/** Mục đích: Tạo listing + upload images POST /api/listings và POST /api/listings/{id}/images. Validation: title,description,category bắt buộc; price>=0 nếu !isGiveaway; check banned keywords từ /api/banned_keywords. */
import { Box, Typography } from '@mui/material';
import ListingForm from '../../components/listing/ListingForm';
export default function CreateListingPage(){ return <Box><Typography>Tạo tin mới</Typography><ListingForm /></Box>; }
