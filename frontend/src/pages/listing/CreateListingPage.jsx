/**
 * Trang tạo tin đăng mới. Chỉ user đã đăng nhập mới vào được (AUTH_REQUIRED).
 * Nút "Đăng tin" trên profile dẫn đến /listings/new.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Alert, Snackbar } from '@mui/material';
import ListingForm from '../../components/listing/ListingForm';
import { createListing, uploadImages } from '../../api/listingApi';

function getPayload(res) {
  const body = res?.data;
  return body?.data ?? body;
}

function buildPayload(values, isDraft = false) {
  return {
    isDraft,
    title: values.title?.trim() || null,
    description: values.description?.trim() || null,
    price: values.price != null && values.price !== '' ? Number(values.price) : null,
    categoryId: values.categoryId ? Number(values.categoryId) : null,
    condition: values.condition || 'USED_GOOD',
    isGiveaway: !!values.isGiveaway,
    purpose: values.isGiveaway ? 'GIVEAWAY' : (values.purpose || 'SALE'),
    pickupAddressId: values.pickupAddressId ? Number(values.pickupAddressId) : null,
    pickupLocationName: values.pickupLocationName?.trim() || values.location || null,
    /** Chỉ ghi chú thêm (phòng/tầng); địa chỉ Vietmap nằm ở pickupLocationName */
    pickupAddressSupplement: values.pickupAddressSupplement?.trim() || null,
    pickupLat: values.pickupLat ? Number(values.pickupLat) : null,
    pickupLng: values.pickupLng ? Number(values.pickupLng) : null,
  };
}

async function uploadListingImages(id, imageFiles) {
  if (!id || !imageFiles?.length) return;
  const formData = new FormData();
  imageFiles.forEach((f) => formData.append('images', f));
  await uploadImages(id, formData);
}

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [draftSuccess, setDraftSuccess] = useState(false);

  const handleSubmit = async (values, imageFiles) => {
    setError('');
    setSubmitting(true);
    try {
      const payload = buildPayload(values, false);
      const res = await createListing(payload);
      const created = getPayload(res);
      const id = created?.id ?? created?.listingId;
      await uploadListingImages(id, imageFiles);
      if (id) {
        navigate(`/listings/${id}`, { replace: true });
      } else {
        navigate('/profile/me', { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Tạo tin thất bại.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async (values, imageFiles) => {
    setError('');
    setSavingDraft(true);
    try {
      const payload = buildPayload(values, true);
      const res = await createListing(payload);
      const created = getPayload(res);
      const id = created?.id ?? created?.listingId;
      await uploadListingImages(id, imageFiles);
      setDraftSuccess(true);
      // Sau 1.5s navigate về profile/drafts nếu có, hoặc ở lại trang
      setTimeout(() => {
        if (id) navigate(`/listings/${id}`, { replace: true });
      }, 1500);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Lưu nháp thất bại.';
      setError(msg);
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <Box>
      {error && (
        <Box sx={{ maxWidth: "680px", width: "100%", mx: "auto", mt: 2 }}>
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        </Box>
      )}
      <ListingForm
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        submitting={submitting}
        savingDraft={savingDraft}
        mode="create"
      />
      <Snackbar
        open={draftSuccess}
        autoHideDuration={2000}
        onClose={() => setDraftSuccess(false)}
        message="Đã lưu nháp thành công!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
