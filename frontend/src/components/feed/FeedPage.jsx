import { useEffect, useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { getListings } from '../../api/listingApi';
import FeedCard from './FeedCard';

const normalizeListingsPayload = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.content)) {
        return payload.content;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
};

export default function FeedPage() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const fetchListings = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await getListings({ page: 0, size: 20, sort: 'createdAt,desc' });
                const data = normalizeListingsPayload(response?.data);

                if (isMounted) {
                    setListings(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err?.response?.data?.message || err?.message || 'Không thể tải danh sách bài đăng.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchListings();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <Container maxWidth={false} sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <Box sx={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {loading && (
                    <Typography variant="body1" color="text.secondary">
                        Đang tải bài đăng...
                    </Typography>
                )}

                {!loading && error && (
                    <Typography variant="body1" color="error">
                        {error}
                    </Typography>
                )}

                {!loading && !error && listings.length === 0 && (
                    <Typography variant="body1" color="text.secondary">
                        Chưa có bài đăng nào.
                    </Typography>
                )}

                {!loading && !error && listings.map((listing) => <FeedCard key={listing.id} listing={listing} />)}
            </Box>
        </Container>
    );
}