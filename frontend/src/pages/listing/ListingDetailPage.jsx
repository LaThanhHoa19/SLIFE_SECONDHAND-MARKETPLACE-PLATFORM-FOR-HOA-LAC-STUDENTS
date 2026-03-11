/** Chi tiết listing: ảnh, title, mô tả, giá, seller + link profile + Nhắn tin. */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  ImageList,
  ImageListItem,
  Link,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import { getListing } from '../../api/listingApi';
import * as chatApi from '../../api/chatApi';
import { fullImageUrl } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

function getPayload(res) {
  const body = res?.data;
  return body?.data ?? body;
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getListing(id)
      .then((res) => {
        setListing(getPayload(res));
        setError('');
      })
      .catch((err) => {
        setError(err?.message || 'Không tải được tin.');
        setListing(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }
  if (error || !listing) {
    return (
      <Box p={3} textAlign="center">
        <Typography color="error">{error || 'Không tìm thấy tin.'}</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Quay lại
        </Button>
      </Box>
    );
  }

  const images = listing?.images ?? [];
  const imageUrls = images.map((path) => fullImageUrl(path)).filter(Boolean);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 3, px: 2 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Quay lại
      </Button>
      <Paper sx={{ overflow: 'hidden', borderRadius: 2 }}>
        {imageUrls.length > 0 ? (
          <ImageList cols={imageUrls.length <= 2 ? imageUrls.length : 3} gap={8} sx={{ m: 0, p: 2, pb: 0 }}>
            {imageUrls.map((src, i) => (
              <ImageListItem key={i}>
                <img
                  src={src}
                  alt={`${listing.title} ${i + 1}`}
                  loading="lazy"
                  style={{ borderRadius: 8, objectFit: 'cover', maxHeight: 360 }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        ) : (
          <Box
            sx={{
              height: 280,
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">Chưa có ảnh</Typography>
          </Box>
        )}
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {listing.title}
          </Typography>
          <Typography variant="h6" color="primary.main" fontWeight={600} sx={{ mb: 1 }}>
            {listing.isGiveaway ? 'Cho tặng' : listing.price != null ? `${Number(listing.price).toLocaleString('vi-VN')} ₫` : '—'}
          </Typography>
          {(listing.sellerSummary || listing.sellerId) && (
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                Người đăng:{' '}
                {listing.sellerId ? (
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate(`/profile/${listing.sellerId}`)}
                    sx={{ fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {listing.sellerSummary || 'Xem profile'}
                  </Link>
                ) : (
                  listing.sellerSummary
                )}
              </Typography>
              {listing.sellerId && !listing.isOwnListing && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<ChatIcon />}
                  disabled={startingChat}
                  onClick={async () => {
                    setStartingChat(true);
                    try {
                      const res = await chatApi.getSession(listing.id);
                      const sessionId = res?.data?.data ?? res?.data;
                      if (sessionId) navigate(`/chat${sessionId ? `?sessionId=${sessionId}` : ''}`);
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setStartingChat(false);
                    }
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  {startingChat ? 'Đang mở...' : 'Nhắn tin'}
                </Button>
              )}
            </Box>
          )}
          {listing.description && (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {listing.description}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
