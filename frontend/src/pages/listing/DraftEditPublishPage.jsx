/**
 * Trang "Chỉnh sửa & Đăng" cho bản nháp — đường dẫn: /drafts/:id/publish
 * Không thay đổi logic Create/Edit listing hiện tại, chỉ tách flow dành cho tab DRAFT.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import ListingForm from '../../components/listing/ListingForm';
import { useMaxImagesPerPost } from '../../hooks/useMaxImagesPerPost';
import { getListing, updateListing, uploadImages } from '../../api/listingApi';
import { useAuth } from '../../hooks/useAuth';
import { formatPickupDisplayLine } from '../../utils/addressDisplay';
import { fullImageUrl } from '../../utils/constants';
import { unwrapApiData } from '../../utils/apiPayload';
import { useToast } from '../../context/ToastContext';
import {
    getListingSubmitErrorMessage,
    isListingImageRelatedApiError,
} from '../../utils/listingSubmitErrors';

const getPayload = unwrapApiData;

function mapListingToFormDefaults(data) {
    const pa = data?.pickupAddress || {};
    const locName = (pa.locationName ?? '').trim();
    const addrText = (pa.addressText ?? '').trim();
    const displayLine =
        formatPickupDisplayLine(locName, addrText) || (typeof data?.location === 'string' ? data.location.trim() : '');

    const priceRaw = data?.price;
    let priceDigits = '';
    if (priceRaw != null && priceRaw !== '') {
        const n = Number(priceRaw);
        if (Number.isFinite(n)) priceDigits = String(Math.round(n));
    }

    const isGiveaway = data?.isGiveaway === true || data?.purpose === 'GIVEAWAY';

    return {
        title: data?.title ?? '',
        description: data?.description ?? '',
        price: isGiveaway ? '0' : priceDigits,
        condition: data?.condition ?? 'USED_GOOD',
        isGiveaway,
        categoryId: data?.categoryId != null ? String(data.categoryId) : '',
        categoryName: data?.categoryName ?? '',
        pickupAddressId: pa?.id != null ? Number(pa.id) : null,
        pickupLocationName: locName || displayLine,
        pickupAddressText: displayLine,
        pickupAddressSupplement: addrText,
        pickupLat: pa?.lat != null && pa?.lat !== '' ? String(pa.lat) : '',
        pickupLng: pa?.lng != null && pa?.lng !== '' ? String(pa.lng) : '',
    };
}

function mapExistingImageUrls(data) {
    const raw = data?.images;
    if (!Array.isArray(raw)) return [];
    return raw.map((u) => fullImageUrl(u)).filter(Boolean);
}

function buildPublishPayload(values) {
    return {
        isDraft: false,
        title: values.title?.trim() || null,
        description: values.description?.trim() || null,
        price: values.price != null && values.price !== '' ? Number(values.price) : null,
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        condition: values.condition || 'USED_GOOD',
        isGiveaway: !!values.isGiveaway,
        purpose: values.isGiveaway ? 'GIVEAWAY' : (values.purpose || 'SALE'),
        pickupAddressId: values.pickupAddressId ? Number(values.pickupAddressId) : null,
        pickupLocationName: values.pickupLocationName?.trim() || values.location || null,
        pickupAddressSupplement: values.pickupAddressSupplement?.trim() || null,
        pickupLat: values.pickupLat ? Number(values.pickupLat) : null,
        pickupLng: values.pickupLng ? Number(values.pickupLng) : null,
    };
}

async function uploadListingImages(listingId, imageFiles) {
    if (!listingId || !imageFiles?.length) return;
    const formData = new FormData();
    imageFiles.forEach((f) => formData.append('images', f));
    await uploadImages(listingId, formData);
}

export default function DraftEditPublishPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const maxImagesPerPost = useMaxImagesPerPost();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [forbidden, setForbidden] = useState(false);
    const [listingData, setListingData] = useState(null);
    const [formDefaults, setFormDefaults] = useState(null);
    const [existingImageUrls, setExistingImageUrls] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitErrorPlacement, setSubmitErrorPlacement] = useState('top');
    const { showToast } = useToast();

    const listingIdNum = useMemo(() => {
        const n = Number(id);
        return Number.isFinite(n) ? n : NaN;
    }, [id]);

    useEffect(() => {
        if (!id || Number.isNaN(listingIdNum)) {
            setError('Mã bản nháp không hợp lệ.');
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError('');
        setSubmitErrorPlacement('top');
        setForbidden(false);
        setFormDefaults(null);
        setExistingImageUrls([]);
        setListingData(null);

        getListing(id)
            .then((res) => {
                if (cancelled) return;
                const data = getPayload(res);
                setListingData(data);
                setFormDefaults(mapListingToFormDefaults(data));
                setExistingImageUrls(mapExistingImageUrls(data));
            })
            .catch((err) => {
                if (!cancelled) {
                    const msg = getListingSubmitErrorMessage(err, 'Không tải được bản nháp.');
                    setError(msg);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id, listingIdNum]);

    useEffect(() => {
        if (!listingData || user?.id == null) return;
        const sellerId =
            listingData?.seller?.id ?? listingData?.sellerSummary?.userId ?? listingData?.sellerSummary?.id;
        if (sellerId != null && String(sellerId) !== String(user.id)) {
            setForbidden(true);
            setFormDefaults(null);
        }
    }, [listingData, user?.id]);

    const handlePublish = async (values, imageFiles) => {
        setError('');
        setSubmitErrorPlacement('top');
        setSubmitting(true);
        try {
            const payload = buildPublishPayload(values);
            await updateListing(listingIdNum, payload);
            await uploadListingImages(listingIdNum, imageFiles);
            navigate(`/listings/${listingIdNum}`, { replace: true });
        } catch (err) {
            const msg = getListingSubmitErrorMessage(err, 'Đăng tin thất bại.');
            const nearImages = isListingImageRelatedApiError(err);
            setSubmitErrorPlacement(nearImages ? 'images' : 'top');
            setError(msg);
            if (nearImages) showToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
                <CircularProgress size={36} sx={{ color: '#9D6EED' }} />
                <Typography variant="body2" color="rgba(255,255,255,0.55)">
                    Đang tải bản nháp…
                </Typography>
            </Box>
        );
    }

    if (forbidden) {
        return (
            <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4, px: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Bạn không phải chủ bản nháp này hoặc không có quyền chỉnh sửa.
                </Alert>
            </Box>
        );
    }

    if (error && !formDefaults) {
        return (
            <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4, px: 2 }}>
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            {formDefaults && (
                <ListingForm
                    key={`draft-${String(listingIdNum)}`}
                    mode="edit"
                    submitLabel="ĐĂNG TIN"
                    defaultValues={formDefaults}
                    existingImageUrls={existingImageUrls}
                    maxImagesPerPost={maxImagesPerPost}
                    onSubmit={handlePublish}
                    submitting={submitting}
                    serverSubmitError={error}
                    serverSubmitErrorPlacement={submitErrorPlacement}
                    onDismissServerSubmitError={() => setError('')}
                />
            )}
        </Box>
    );
}

