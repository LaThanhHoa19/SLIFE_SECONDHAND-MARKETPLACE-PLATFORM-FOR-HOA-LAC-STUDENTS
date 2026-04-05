/**
 * Trang tạo tin đăng mới. Chỉ user đã đăng nhập mới vào được (AUTH_REQUIRED).
 * Nút "Đăng tin" trên profile dẫn đến /listings/new.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import ListingForm from '../../components/listing/ListingForm';
import { APP_SHELL_BG } from '../../utils/layoutConstants';
import { useMaxImagesPerPost } from '../../hooks/useMaxImagesPerPost';
import { createListingWithImages } from '../../api/listingApi';
import { unwrapApiData } from '../../utils/apiPayload';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { usePhoneVerification } from '../../context/PhoneVerificationContext';
import {
  getListingSubmitErrorMessage,
  isListingImageRelatedApiError,
} from '../../utils/listingSubmitErrors';

const getPayload = unwrapApiData;

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

export default function CreateListingPage() {
  const navigate = useNavigate();
  const maxImagesPerPost = useMaxImagesPerPost();
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitErrorPlacement, setSubmitErrorPlacement] = useState('top');
  const { showToast } = useToast();
  const draftRedirectTimerRef = useRef(null);

  const { checkVerification } = usePhoneVerification();
  const { user, isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && user) {
        checkVerification(() => {
            // verified, do nothing and stay on page
        });
    }
  }, [user, isAuthLoading, checkVerification]);

  useEffect(() => {
    return () => {
      if (draftRedirectTimerRef.current) {
        window.clearTimeout(draftRedirectTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async (values, imageFiles) => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const payload = buildPayload(values, false);
      const res = await createListingWithImages(payload, imageFiles);
      const created = getPayload(res);
      const id = created?.id ?? created?.listingId;
      showToast('Đăng tin thành công.', 'success');
      if (id) {
        navigate(`/listings/${id}`, { replace: true });
      } else {
        navigate('/profile/me', { replace: true });
      }
    } catch (err) {
      const msg = getListingSubmitErrorMessage(err, 'Tạo tin thất bại.');
      const nearImages = isListingImageRelatedApiError(err);
      setSubmitErrorPlacement(nearImages ? 'images' : 'top');
      setSubmitError(msg);
      if (nearImages) showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async (values, imageFiles) => {
    setSubmitError('');
    setSavingDraft(true);
    try {
      const payload = buildPayload(values, true);
      const res = await createListingWithImages(payload, imageFiles);
      const created = getPayload(res);
      const id = created?.id ?? created?.listingId;
      showToast('Đã lưu nháp thành công!', 'success');
      // Sau 1.5s navigate về profile/drafts nếu có, hoặc ở lại trang
      if (draftRedirectTimerRef.current) {
        window.clearTimeout(draftRedirectTimerRef.current);
      }
      draftRedirectTimerRef.current = window.setTimeout(() => {
        if (id) navigate(`/listings/${id}`, { replace: true });
      }, 1500);
    } catch (err) {
      const msg = getListingSubmitErrorMessage(err, 'Lưu nháp thất bại.');
      const nearImages = isListingImageRelatedApiError(err);
      setSubmitErrorPlacement(nearImages ? 'images' : 'top');
      setSubmitError(msg);
      if (nearImages) showToast(msg, 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  return (
      <Box
          sx={{
            minHeight: '100%',
            width: '100%',
            bgcolor: APP_SHELL_BG,
            py: { xs: 1, md: 2 },
            px: 0,
          }}
      >
        <ListingForm
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            submitting={submitting}
            savingDraft={savingDraft}
            mode="create"
            layoutVariant="createStudio"
            maxImagesPerPost={maxImagesPerPost}
            serverSubmitError={submitError}
            serverSubmitErrorPlacement={submitErrorPlacement}
            onDismissServerSubmitError={() => setSubmitError('')}
        />
      </Box>
  );
}
