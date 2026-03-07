/**
 * Trang tạo tin đăng mới. Chỉ user đã đăng nhập mới vào được (AUTH_REQUIRED).
 * Nút "Đăng tin" trên profile dẫn đến /listings/new.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import ListingForm from '../../components/listing/ListingForm';
import { createListing, uploadImages } from '../../api/listingApi';

function getPayload(res) {
  const body = res?.data;
  return body?.data ?? body;
}

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values, imageFiles) => {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        title: values.title?.trim() || '',
        description: values.description?.trim() || null,
        price: values.price != null && values.price !== '' ? Number(values.price) : 0,
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        condition: values.condition || 'USED_GOOD',
        isGiveaway: !!values.isGiveaway,
        purpose: values.purpose || 'SALE',
      };
      const res = await createListing(payload);
      const created = getPayload(res);
      const id = created?.id ?? created?.listingId;
      if (id && imageFiles?.length > 0) {
        try {
          const formData = new FormData();
          imageFiles.forEach((f) => formData.append('images', f));
          await uploadImages(id, formData);
        } catch (_) {
          // Nếu backend chưa có endpoint upload ảnh, vẫn chuyển trang
        }
      }
      if (id) {
        navigate(`/listings/${id}`, { replace: true });
      } else {
        navigate('/profile/me', { replace: true });
      }
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Tạo tin thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: 3, px: 2 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Tạo tin mới
      </Typography>
      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <ListingForm onSubmit={handleSubmit} submitting={submitting} mode="create" />
      </Paper>
    </Box>
  );
}
