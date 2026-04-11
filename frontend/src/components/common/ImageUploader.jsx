/**
 * ImageUploader — chọn và preview nhiều ảnh, trả về File[] qua onFilesChange.
 * Props:
 *   onFilesChange  – (files: File[]) => void
 *   maxFiles       – tối đa số ảnh (default 10)
 *   maxSizeMB      – dung lượng tối đa mỗi ảnh MB (default 5)
 *   variant        – 'default' | 'studioHero' (ảnh đầu lớn + lưới phụ, dùng trang tạo tin)
 */
import { useState, useEffect, useId, useMemo, useRef } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';

const MAX_FILES_DEFAULT = 10;
/** Trần an toàn phía client (BE vẫn là nguồn sự thật). */
const MAX_FILES_CEILING = 50;
const MAX_SIZE_MB = 5;

/** Đồng bộ định dạng với backend (ListingImageService ALLOWED_EXT). */
const LISTING_IMAGE_MIME = new Set([
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);
/** Gợi ý OS chỉ hiện ảnh; vẫn có thể “Tất cả file” — lọc lại trong code. */
const LISTING_IMAGE_ACCEPT =
    'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp';

/** Bài cộng đồng — khớp CommunityPostImageService (chỉ JPG/PNG). */
const COMMUNITY_IMAGE_MIME = new Set(['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png']);
const COMMUNITY_IMAGE_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png';

function isAllowedImage(file, maxBytes, profile) {
    if (!file || file.size <= 0 || file.size > maxBytes) return false;
    const t = (file.type || '').toLowerCase().trim();
    const mimeSet = profile === 'community' ? COMMUNITY_IMAGE_MIME : LISTING_IMAGE_MIME;
    const extRe = profile === 'community' ? /\.(jpe?g|png)$/i : /\.(jpe?g|png|gif|webp)$/i;
    if (t && mimeSet.has(t)) return true;
    return extRe.test(file.name || '');
}

const TILE = {
    size: 110,
    radius: '10px',
};
const TILE_SM = 100;

function normalizeExisting(existingImages, existingImageUrls) {
    if (Array.isArray(existingImages) && existingImages.length > 0) {
        return existingImages.map((x) =>
            typeof x === 'string' ? { id: null, url: x } : { id: x.id ?? null, url: x.url },
        );
    }
    const urls = existingImageUrls || [];
    if (!Array.isArray(urls) || urls.length === 0) return [];
    return urls.map((u) => ({ id: null, url: typeof u === 'string' ? u : u?.url || '' })).filter((x) => x.url);
}

export default function ImageUploader({
                                          onFilesChange,
                                          maxFiles = MAX_FILES_DEFAULT,
                                          maxSizeMB = MAX_SIZE_MB,
                                          existingImages,
                                          existingImageUrls = [],
                                          onRemoveExistingImage,
                                          variant = 'default',
                                          /** 'listing' | 'community' — community chỉ JPG/PNG (đồng bộ BE). */
                                          imageProfile = 'listing',
                                      }) {
    const inputId = useId();
    const inputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [removingId, setRemovingId] = useState(null);
    const [capNotice, setCapNotice] = useState('');
    const cap = Math.max(
        0,
        Math.min(
            Number.isFinite(Number(maxFiles)) && Number(maxFiles) >= 0 ? Number(maxFiles) : MAX_FILES_DEFAULT,
            MAX_FILES_CEILING,
        ),
    );
    const acceptAttr = imageProfile === 'community' ? COMMUNITY_IMAGE_ACCEPT : LISTING_IMAGE_ACCEPT;
    const formatsLabel =
        imageProfile === 'community' ? 'JPG, PNG' : 'JPG, PNG, GIF, WebP';

    const resolvedExisting = useMemo(
        () => normalizeExisting(existingImages, existingImageUrls),
        [existingImages, existingImageUrls],
    );

    /** Studio layout: ảnh server trước, rồi preview file mới — trước đây chỉ render previews nên sửa tin không thấy ảnh cũ. */
    const studioDisplaySlots = useMemo(() => {
        const slots = [];
        resolvedExisting.forEach((ex, i) => {
            slots.push({
                kind: 'existing',
                url: ex.url,
                existing: ex,
                key: `ex-${ex.id ?? 'noid'}-${i}-${ex.url}`,
            });
        });
        previews.forEach((url, i) => {
            slots.push({ kind: 'new', url, fileIndex: i, key: `nw-${i}-${url}` });
        });
        return slots;
    }, [resolvedExisting, previews]);

    const handleRemoveExisting = async (imageId) => {
        if (imageId == null || !onRemoveExistingImage) return;
        setRemovingId(imageId);
        try {
            await onRemoveExistingImage(imageId);
        } finally {
            setRemovingId(null);
        }
    };

    useEffect(() => {
        if (files.length === 0) {
            setPreviews([]);
            if (onFilesChange) onFilesChange([]);
            return;
        }

        const urls = files.map((file) => URL.createObjectURL(file));
        setPreviews(urls);

        if (onFilesChange) onFilesChange(files);

        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [files, onFilesChange]);

    const handleAddImages = (e) => {
        const selected = Array.from(e.target.files || []);
        e.target.value = '';

        const maxBytes = maxSizeMB * 1024 * 1024;
        const validFiles = selected.filter((file) => isAllowedImage(file, maxBytes, imageProfile));

        setFiles((prev) => {
            const room = Math.max(0, cap - prev.length);
            if (room === 0) {
                setCapNotice(`Đã đủ ${cap} ảnh (tối đa cho mỗi tin). Xóa bớt ảnh nếu muốn thêm ảnh khác.`);
                return prev;
            }
            const invalidCount = selected.length - validFiles.length;
            // Không thể giới hạn hộp thoại OS — nếu chọn quá số slot còn lại thì bỏ cả lô, bắt chọn lại.
            if (validFiles.length > room) {
                setCapNotice(
                    `Mỗi lần chỉ được chọn tối đa ${room} ảnh (còn ${room} slot; tối đa ${cap} ảnh/tin). Bạn đã chọn ${validFiles.length} ảnh hợp lệ — không thêm ảnh nào. Vui lòng chọn lại.`,
                );
                return prev;
            }
            if (invalidCount > 0) {
                setCapNotice(
                    imageProfile === 'community'
                        ? `Chỉ chấp nhận ảnh JPG hoặc PNG (tối đa ${maxSizeMB}MB/file). Có ${invalidCount} file không hợp lệ đã bỏ qua.`
                        : `Chỉ chấp nhận ảnh JPG, PNG, GIF hoặc WebP (tối đa ${maxSizeMB}MB/file). Có ${invalidCount} file không hợp lệ đã bỏ qua.`,
                );
            } else {
                setCapNotice('');
            }
            return [...prev, ...validFiles];
        });
    };

    const removeImage = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setCapNotice('');
    };

    const hasExisting = resolvedExisting.length > 0;
    const showUnifiedGrid = hasExisting || files.length > 0;
    const showBigDropzone = !showUnifiedGrid && cap > 0;

    const studioHero = variant === 'studioHero';
    const studioHeroTiles = useMemo(() => {
        if (!studioHero) return [];
        const ex = resolvedExisting.map((item, idx) => ({
            kind: 'existing',
            key: item.id != null ? `existing-${item.id}` : `existing-${item.url}-${idx}`,
            url: item.url,
            id: item.id ?? null,
        }));
        const pv = previews.map((url, idx) => ({
            kind: 'preview',
            key: `preview-${url}-${idx}`,
            url,
            index: idx,
        }));
        // Ưu tiên hiển thị ảnh mới chọn trước; nếu chưa chọn, dùng ảnh existing.
        return pv.length > 0 ? [...pv, ...ex] : ex;
    }, [studioHero, resolvedExisting, previews]);

    const addTileSx = (sz) => ({
        width: sz,
        height: sz,
        borderRadius: TILE.radius,
        background: studioHero ? 'rgba(157,110,237,0.08)' : '#EDE7F6',
        border: studioHero ? '2px dashed rgba(157,110,237,0.45)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        '&:hover': { background: studioHero ? 'rgba(157,110,237,0.14)' : '#e0d4f7' },
    });

    const triggerFilePicker = () => {
        inputRef.current?.click();
    };

    const addTile = (sz = TILE.size) => (
        <Box sx={addTileSx(sz)} onClick={triggerFilePicker} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerFilePicker()}>
            <AddPhotoAlternateOutlinedIcon sx={{ color: '#9D6EED', fontSize: sz > TILE_SM ? 40 : 32 }} />
        </Box>
    );

    return (
        <Box>
            {!studioHero ? (
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: capNotice ? 0.5 : 1.5 }}>
                    Ảnh sản phẩm — {formatsLabel} (tối đa {cap} ảnh, mỗi file ≤ {maxSizeMB}MB)
                </Typography>
            ) : null}
            {studioHero && imageProfile === 'community' ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: capNotice ? 0.75 : 1.25 }}>
                    Định dạng: {formatsLabel} · tối đa {cap} ảnh · mỗi file ≤ {maxSizeMB}MB
                </Typography>
            ) : null}
            {capNotice ? (
                <Typography variant="body2" color="error" sx={{ mb: 1.5, fontWeight: 600 }}>
                    {capNotice}
                </Typography>
            ) : null}

            <input
                type="file"
                ref={inputRef}
                accept={acceptAttr}
                multiple
                id={inputId}
                hidden
                onChange={handleAddImages}
            />

            {showBigDropzone && !studioHero && (
                <Box
                    sx={{
                        height: 160,
                        borderRadius: '14px',
                        background: '#392D4D',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        gap: 1,
                        '&:hover': { background: '#46365E' },
                    }}
                    onClick={triggerFilePicker}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerFilePicker()}
                >
                    <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 50, color: '#9D6EED' }} />
                    <Typography fontWeight={600} fontSize={16}>
                        Thêm ảnh
                    </Typography>
                </Box>
            )}

            {showBigDropzone && studioHero && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'stretch' }}>
                    <Box
                        sx={{
                            flex: '1 1 260px',
                            minWidth: 240,
                            maxWidth: '100%',
                            minHeight: 220,
                            borderRadius: '14px',
                            border: '2px dashed rgba(157,110,237,0.45)',
                            bgcolor: 'rgba(157,110,237,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            gap: 0.75,
                            px: 2,
                            '&:hover': { bgcolor: 'rgba(157,110,237,0.1)' },
                        }}
                        onClick={triggerFilePicker}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && triggerFilePicker()}
                    >
                        <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 48, color: '#9D6EED' }} />
                        <Typography fontWeight={700} fontSize={15} color="#e5e7eb" textAlign="center">
                            Tải ảnh chính
                        </Typography>
                        <Typography fontSize={12} color="rgba(255,255,255,0.45)" textAlign="center">
                            Ảnh bìa nổi bật nhất
                        </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px', display: 'flex', flexWrap: 'wrap', gap: 1.5, alignContent: 'flex-start' }}>
                        {cap > 1 && files.length < cap ? addTile(TILE_SM) : null}
                    </Box>
                </Box>
            )}

            {showUnifiedGrid && !studioHero && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                    {files.length < cap && addTile(TILE.size)}

                    {hasExisting &&
                        resolvedExisting.map((item, i) => (
                            <Box
                                key={item.id != null ? `existing-${item.id}` : `existing-${item.url}-${i}`}
                                sx={{
                                    width: TILE.size,
                                    height: TILE.size,
                                    borderRadius: TILE.radius,
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    position: 'relative',
                                }}
                            >
                                <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {item.id != null && onRemoveExistingImage && (
                                    <IconButton
                                        type="button"
                                        size="small"
                                        disabled={removingId === item.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleRemoveExisting(item.id);
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            background: 'rgba(0,0,0,0.55)',
                                            color: '#fff',
                                            '&:hover': { background: 'rgba(0,0,0,0.75)' },
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        ))}

                    {previews.map((url, index) => (
                        <Box
                            key={url}
                            sx={{
                                width: TILE.size,
                                height: TILE.size,
                                borderRadius: TILE.radius,
                                overflow: 'hidden',
                                position: 'relative',
                                flexShrink: 0,
                            }}
                        >
                            <img src={url} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <IconButton
                                size="small"
                                onClick={() => removeImage(index)}
                                sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    background: 'rgba(0,0,0,0.5)',
                                    color: '#fff',
                                    '&:hover': { background: 'rgba(0,0,0,0.7)' },
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            )}

            {showUnifiedGrid && studioHero && (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <Box
                        sx={{
                            flex: '1 1 260px',
                            minWidth: 240,
                            maxWidth: '100%',
                            minHeight: 220,
                            borderRadius: '14px',
                            overflow: 'hidden',
                            position: 'relative',
                            border: studioDisplaySlots[0] ? 'none' : '2px dashed rgba(157,110,237,0.35)',
                            bgcolor: studioDisplaySlots[0] ? 'transparent' : 'rgba(157,110,237,0.04)',
                        }}
                    >
                        {studioDisplaySlots[0] ? (
                            <>
                                <img
                                    src={studioDisplaySlots[0].url}
                                    alt=""
                                    style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                                />
                                {studioDisplaySlots[0].kind === 'new' ? (
                                    <IconButton
                                        size="small"
                                        onClick={() => removeImage(studioDisplaySlots[0].fileIndex)}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            background: 'rgba(0,0,0,0.55)',
                                            color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.24)',
                                            zIndex: 2,
                                            opacity: 1,
                                            '&:hover': { background: 'rgba(0,0,0,0.75)' },
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                ) : null}
                                {studioDisplaySlots[0].kind === 'existing' &&
                                studioDisplaySlots[0].existing?.id != null &&
                                onRemoveExistingImage ? (
                                    <IconButton
                                        type="button"
                                        size="small"
                                        disabled={removingId === studioDisplaySlots[0].existing.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleRemoveExisting(studioDisplaySlots[0].existing.id);
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            background: 'rgba(0,0,0,0.55)',
                                            color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.24)',
                                            zIndex: 2,
                                            opacity: 1,
                                            '&:hover': { background: 'rgba(0,0,0,0.75)' },
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                ) : null}
                            </>
                        ) : (
                            <label htmlFor={inputId} style={{ display: 'flex', width: '100%', height: 220, cursor: 'pointer' }}>
                                <Box
                                    sx={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 0.75,
                                        px: 2,
                                    }}
                                >
                                    <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 48, color: '#9D6EED' }} />
                                    <Typography fontWeight={700} fontSize={15} color="#e5e7eb" textAlign="center">
                                        Tải ảnh chính
                                    </Typography>
                                    <Typography fontSize={12} color="rgba(255,255,255,0.45)">
                                        Ảnh bìa nổi bật nhất
                                    </Typography>
                                </Box>
                            </label>
                        )}
                    </Box>
                    <Box sx={{ flex: '1 1 220px', display: 'flex', flexWrap: 'wrap', gap: 1.5, alignContent: 'flex-start' }}>
                        {studioDisplaySlots.slice(1).map((slot) => (
                            <Box
                                key={slot.key}
                                sx={{
                                    width: TILE_SM,
                                    height: TILE_SM,
                                    borderRadius: TILE.radius,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    flexShrink: 0,
                                }}
                            >
                                <img src={slot.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {slot.kind === 'new' ? (
                                    <IconButton
                                        size="small"
                                        onClick={() => removeImage(slot.fileIndex)}
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            background: 'rgba(0,0,0,0.5)',
                                            color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.24)',
                                            zIndex: 2,
                                            opacity: 1,
                                            '&:hover': { background: 'rgba(0,0,0,0.7)' },
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                ) : null}
                                {slot.kind === 'existing' && slot.existing?.id != null && onRemoveExistingImage ? (
                                    <IconButton
                                        type="button"
                                        size="small"
                                        disabled={removingId === slot.existing.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleRemoveExisting(slot.existing.id);
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            background: 'rgba(0,0,0,0.5)',
                                            color: '#fff',
                                            border: '1px solid rgba(255,255,255,0.24)',
                                            zIndex: 2,
                                            opacity: 1,
                                            '&:hover': { background: 'rgba(0,0,0,0.7)' },
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                ) : null}
                            </Box>
                        ))}
                        {files.length < cap ? addTile(TILE_SM) : null}
                    </Box>
                </Box>
            )}
        </Box>
    );
}

ImageUploader.propTypes = {
    onFilesChange: PropTypes.func,
    maxFiles: PropTypes.number,
    maxSizeMB: PropTypes.number,
    existingImages: PropTypes.arrayOf(PropTypes.object),
    existingImageUrls: PropTypes.arrayOf(PropTypes.string),
    onRemoveExistingImage: PropTypes.func,
    variant: PropTypes.oneOf(['default', 'studioHero']),
    imageProfile: PropTypes.oneOf(['listing', 'community']),
};
