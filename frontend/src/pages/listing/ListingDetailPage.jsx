/** Mục đích: Chi tiết listing + ảnh, seller, offer, report, mark sold/hide, mở chat. API: GET /api/listings/{id}, POST /api/offers, POST /api/reports. */
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
export default function ListingDetailPage(){ const {id}=useParams(); return <Box><Typography>TODO: Listing detail skeleton #{id}</Typography></Box>; }
