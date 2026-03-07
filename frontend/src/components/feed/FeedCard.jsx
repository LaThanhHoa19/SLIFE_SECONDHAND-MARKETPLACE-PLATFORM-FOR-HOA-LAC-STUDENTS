import {
    Avatar,
    Box,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    IconButton,
    Typography,
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SendIcon from '@mui/icons-material/Send';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import ImageGrid from './ImageGrid';

const formatPrice = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'Giá: đang cập nhật';
    }

    return `${Number(value).toLocaleString('vi-VN')} VND`;
};

const getRelativeTime = (createdAt) => {
    if (!createdAt) {
        return 'Vừa xong';
    }

    const postedTime = new Date(createdAt).getTime();
    if (Number.isNaN(postedTime)) {
        return 'Vừa xong';
    }

    const diffInMinutes = Math.max(1, Math.floor((Date.now() - postedTime) / (1000 * 60)));

    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
};

const mapListingForCard = (listing = {}) => {
    const seller = listing.user || listing.sellerSummary || {};

    return {
        id: listing.id,
        title: listing.title || 'Bài đăng chưa có tiêu đề',
        description: listing.description || 'Chưa có mô tả.',
        condition: listing.condition || 'Đang cập nhật',
        location: listing.location || 'Đang cập nhật',
        price: listing.price,
        images: Array.isArray(listing.images) ? listing.images : [],
        createdAt: listing.createdAt,
        commentCount: listing.commentCount ?? 0,
        userName: seller.name || seller.fullName || 'Người dùng SLIFE',
        userAvatar: seller.avatar || seller.avatarUrl || '',
    };
};

export default function FeedCard({ listing }) {
    const item = mapListingForCard(listing);

    return (
        <Card
            sx={{
                width: '100%',
                maxWidth: 700,
                alignSelf: 'center',
            }}
        >
            <CardHeader
                avatar={<Avatar src={item.userAvatar} alt={item.userName} sx={{ width: 40, height: 40 }} />}
                title={
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {item.userName}
                    </Typography>
                }
                subheader={
                    <Typography variant="body2" color="text.secondary">
                        {getRelativeTime(item.createdAt)}
                    </Typography>
                }
                action={
                    <IconButton aria-label="more-options">
                        <MoreHorizIcon />
                    </IconButton>
                }
                sx={{ pb: 0 }}
            />

            <CardContent sx={{ pt: 1.5 }}>
                <Typography variant="h6" sx={{ fontSize: 24, fontWeight: 700 }}>
                    {item.title}
                </Typography>

                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                    {item.description}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Tình trạng: {item.condition}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Vị trí: {item.location}
                </Typography>

                <Typography sx={{ mt: 1.5, color: '#E53935', fontWeight: 700 }}>
                    {formatPrice(item.price)}
                </Typography>

                <ImageGrid images={item.images} title={item.title} />
            </CardContent>

            <CardActions sx={{ px: 2, pt: 0, pb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton aria-label="favorite">
                    <FavoriteBorderIcon />
                </IconButton>
                <IconButton aria-label="send">
                    <SendIcon />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton aria-label="comments">
                        <ChatBubbleOutlineIcon />
                    </IconButton>
                    <Typography variant="body2" color="text.secondary">
                        {item.commentCount}
                    </Typography>
                </Box>
                <IconButton aria-label="share">
                    <ShareIcon />
                </IconButton>
            </CardActions>
        </Card>
    );
}