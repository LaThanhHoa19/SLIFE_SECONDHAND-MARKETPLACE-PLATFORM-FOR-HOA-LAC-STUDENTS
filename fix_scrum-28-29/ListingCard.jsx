/** Mục đích: Card hiển thị listing. Props: listing,onClick,showPrice,showStatus. API: none. */
import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
export default function ListingCard({ listing, onClick, showPrice = true, showStatus = true }){ return <Card><CardActionArea onClick={() => onClick?.(listing)}><CardContent><Typography>{listing?.title || 'TODO title'}</Typography>{showPrice && <Typography>{listing?.price}</Typography>}{showStatus && <Typography>{listing?.status}</Typography>}</CardContent></CardActionArea></Card>; }
