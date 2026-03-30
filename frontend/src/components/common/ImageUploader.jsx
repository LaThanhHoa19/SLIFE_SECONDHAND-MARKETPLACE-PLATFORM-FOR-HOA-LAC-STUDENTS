/**
 * ImageUploader — chọn và preview nhiều ảnh, trả về File[] qua onFilesChange.
 * Props:
 *   onFilesChange  – (files: File[]) => void
 *   maxFiles       – tối đa số ảnh (default 10)
 *   maxSizeMB      – dung lượng tối đa mỗi ảnh MB (default 5)
 */
import { useState, useEffect, useId, useMemo } from 'react';
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

function isAllowedListingImage(file, maxBytes) {
    if (!file || file.size <= 0 || file.size > maxBytes) return false;
    const t = (file.type || '').toLowerCase().trim();
    if (t && LISTING_IMAGE_MIME.has(t)) return true;
    return /\.(jpe?g|png|gif|webp)$/i.test(file.name || '');
}

const TILE = {
    size: 110,
    radius: '10px',
};

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
                                      }) {
    const inputId = useId();
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

    const resolvedExisting = useMemo(
        () => normalizeExisting(existingImages, existingImageUrls),
        [existingImages, existingImageUrls],
    );

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
        const validFiles = selected.filter((file) => isAllowedListingImage(file, maxBytes));

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
                    `Chỉ chấp nhận ảnh JPG, PNG, GIF hoặc WebP (tối đa ${maxSizeMB}MB/file). Có ${invalidCount} file không hợp lệ đã bỏ qua.`,
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

    const addTile = (
        <label htmlFor={inputId} style={{ display: 'block' }}>
            <Box
                sx={{
                    width: TILE.size,
                    height: TILE.size,
                    borderRadius: TILE.radius,
                    background: '#EDE7F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    '&:hover': { background: '#e0d4f7' },
                }}
            >
                <AddPhotoAlternateOutlinedIcon sx={{ color: '#9D6EED', fontSize: 35 }} />
            </Box>
        </label>
    );

    return (
        <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: capNotice ? 0.5 : 1.5 }}>
                Ảnh sản phẩm — JPG, PNG, GIF, WebP (tối đa {cap} ảnh, mỗi file ≤ {maxSizeMB}MB)
            </Typography>
            {capNotice ? (
                <Typography variant="body2" color="error" sx={{ mb: 1.5, fontWeight: 600 }}>
                    {capNotice}
                </Typography>
            ) : null}

            <input
                type="file"
                accept={LISTING_IMAGE_ACCEPT}
                multiple
                id={inputId}
                hidden
                onChange={handleAddImages}
            />

            {showBigDropzone && (
                <label htmlFor={inputId} style={{ display: 'block' }}>
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
                    >
                        <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 50, color: '#9D6EED' }} />
                        <Typography fontWeight={600} fontSize={16}>
                            Thêm ảnh
                        </Typography>
                    </Box>
                </label>
            )}

            {showUnifiedGrid && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                    {files.length < cap && addTile}

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
};
