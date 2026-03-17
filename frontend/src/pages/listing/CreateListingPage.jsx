/**
 * Trang tạo tin đăng mới. Chỉ user đã đăng nhập mới vào được (AUTH_REQUIRED).
 * Nút "Đăng tin" trên profile dẫn đến /listings/new.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Alert } from '@mui/material';
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
        purpose: values.isGiveaway ? 'GIVEAWAY' : (values.purpose || 'SALE'),
        pickupLocationName: values.location || null,
      };
      const res = await createListing(payload);
      const created = getPayload(res);
      const id = created?.id ?? created?.listingId;
      if (id && imageFiles?.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((f) => formData.append('images', f));
        await uploadImages(id, formData);
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
    <Box>
      {error && (
        <Box sx={{ maxWidth: "1200px", width: "90%", mx: "auto", mt: 2 }}>
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Box>
      )}
      <ListingForm onSubmit={handleSubmit} submitting={submitting} mode="create" />
    </Box>
  );
}
