/**
 * Trang "Đăng lại" (không tạo record mới cho đến khi bấm ĐĂNG TIN).
 * Route: /listings/:id/repost
 *
 * Flow:
 * - Load listing nguồn (expired/hidden) để prefill form + hiển thị ảnh hiện có (URL).
 * - Khi submit: gọi POST "repost" để BE clone-to-draft + clone images, sau đó publish (updateListing isDraft=false)
 *   và upload ảnh mới (nếu người dùng chọn thêm).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ListingForm from '../../components/listing/ListingForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { APP_SHELL_BG } from '../../utils/layoutConstants';
import { useMaxImagesPerPost } from '../../hooks/useMaxImagesPerPost';
import { useNavigationBlocker } from '../../hooks/useNavigationBlocker';
import { getListing, updateListing, uploadImages } from '../../api/listingApi';
import { repostListing } from '../../api/myListingApi';
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

    const isGiveaway =
        data?.isGiveaway === true ||
        data?.purpose === 'GIVEAWAY' ||
        (priceDigits !== '' && Number(priceDigits) === 0);

    return {
        title: data?.title ?? '',
        description: data?.description ?? '',
        price: isGiveaway ? '0' : priceDigits,
        condition: data?.condition ?? 'USED_GOOD',
        isGiveaway,
        categoryId: data?.category?.id != null
            ? String(data.category.id)
            : (data?.categoryId != null ? String(data.categoryId) : ''),
        categoryName: data?.category?.name ?? data?.categoryName ?? '',
        pickupAddressId: pa?.id != null ? Number(pa.id) : null,
        pickupLocationName: locName || displayLine,
        pickupAddressText: displayLine,
        pickupAddressSupplement: addrText,
        pickupLat: pa?.lat != null && pa?.lat !== '' ? String(pa.lat) : '',
        pickupLng: pa?.lng != null && pa?.lng !== '' ? String(pa.lng) : '',
    };
}

function mapExistingImageUrls(data) {
    const items = data?.imageItems;
    if (Array.isArray(items) && items.length > 0) {
        return items
            .map((x) => fullImageUrl(x?.url))
            .filter(Boolean);
    }
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

export default function RepostPublishPage() {
    const { id } = useParams(); // source listing id
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const maxImagesPerPost = useMaxImagesPerPost();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [forbidden, setForbidden] = useState(false);
    const [listingData, setListingData] = useState(null);
    const [formDefaults, setFormDefaults] = useState(null);
    const [existingImageUrls, setExistingImageUrls] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitErrorPlacement, setSubmitErrorPlacement] = useState('top');

    const [isDirty, setIsDirty] = useState(false);
    const [leaveOpen, setLeaveOpen] = useState(false);

    const sourceIdNum = useMemo(() => {
        const n = Number(id);
        return Number.isFinite(n) ? n : NaN;
    }, [id]);

    const shouldBlock = isDirty && !submitting;
    const blocker = useNavigationBlocker(shouldBlock);

    useEffect(() => {
        if (blocker.state === 'blocked') {
            setLeaveOpen(true);
        }
    }, [blocker.state]);

    const closeLeave = useCallback(() => {
        setLeaveOpen(false);
        if (blocker.state === 'blocked') blocker.reset();
    }, [blocker]);

    const confirmLeave = useCallback(() => {
        setLeaveOpen(false);
        if (blocker.state === 'blocked') blocker.proceed();
    }, [blocker]);

    useEffect(() => {
        if (!shouldBlock) return;
        const handler = (e) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [shouldBlock]);

    const handleBack = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    useEffect(() => {
        if (!id || Number.isNaN(sourceIdNum)) {
            setError('Mã tin nguồn không hợp lệ.');
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
                    const msg = getListingSubmitErrorMessage(err, 'Không tải được tin để đăng lại.');
                    setError(msg);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id, sourceIdNum]);

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
            // Chỉ tạo record mới tại thời điểm user bấm "ĐĂNG TIN"
            const { data: body } = await repostListing(sourceIdNum);
            const payload = body?.data;
            const newIdRaw =
                payload != null && typeof payload === 'object' && payload !== null && 'data' in payload
                    ? payload.data
                    : payload;
            const newId = newIdRaw != null && newIdRaw !== '' ? Number(newIdRaw) : NaN;
            if (!Number.isFinite(newId) || newId <= 0) {
                throw new Error('Không tạo được bản nháp đăng lại.');
            }

            const publishPayload = buildPublishPayload(values);
            await updateListing(newId, publishPayload);
            await uploadListingImages(newId, imageFiles);

            showToast('Đăng lại tin thành công.', 'success');
            navigate(`/listings/${newId}`, { replace: true });
        } catch (err) {
            const msg = getListingSubmitErrorMessage(err, 'Đăng lại thất bại.');
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
                    Đang tải tin để đăng lại…
                </Typography>
            </Box>
        );
    }

    if (forbidden) {
        return (
            <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4, px: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Bạn không phải chủ tin này hoặc không có quyền đăng lại.
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
        <Box
            sx={{
                minHeight: '100%',
                width: '100%',
                bgcolor: APP_SHELL_BG,
                py: { xs: 1, md: 2 },
                px: 0,
            }}
        >
            <Box sx={{ maxWidth: 1360, mx: 'auto', px: { xs: 1, md: 2 } }}>
                <Stack direction="row" alignItems="center" gap={1} sx={{ py: 1 }}>
                    <IconButton
                        type="button"
                        onClick={handleBack}
                        sx={{
                            color: 'rgba(255,255,255,0.75)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            bgcolor: 'rgba(255,255,255,0.04)',
                            '&:hover': { bgcolor: 'rgba(157,110,237,0.12)', color: '#fff' },
                        }}
                    >
                        <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Box>
                        <Typography fontWeight={800} color="#fff" sx={{ letterSpacing: '-0.02em' }}>
                            Đăng lại tin
                        </Typography>
                        <Typography fontSize={12.5} color="rgba(255,255,255,0.45)">
                            Tin mới chỉ được tạo khi bạn bấm “Đăng tin”.
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {formDefaults && (
                <ListingForm
                    key={`repost-source-${String(sourceIdNum)}`}
                    mode="edit"
                    layoutVariant="createStudio"
                    studioSidebarTitle="Hoàn thiện & đăng lại"
                    submitLabel="ĐĂNG TIN"
                    defaultValues={formDefaults}
                    existingImageUrls={existingImageUrls}
                    maxImagesPerPost={maxImagesPerPost}
                    onSubmit={handlePublish}
                    onDirtyChange={setIsDirty}
                    submitting={submitting}
                    serverSubmitError={error}
                    serverSubmitErrorPlacement={submitErrorPlacement}
                    onDismissServerSubmitError={() => setError('')}
                />
            )}

            <ConfirmDialog
                open={leaveOpen}
                variant="warning"
                title="Bạn có muốn thoát khỏi chỉnh sửa?"
                content="Nội dung sẽ không được lưu."
                confirmLabel="Thoát"
                cancelLabel="Ở lại"
                onClose={closeLeave}
                onConfirm={confirmLeave}
            />
        </Box>
    );
}

