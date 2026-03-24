/**
 * ImageUploader — chọn và preview nhiều ảnh, trả về File[] qua onFilesChange.
 * Hiển thị hết ảnh đã chọn; nếu tổng (ảnh cũ + ảnh mới) vượt giới hạn thì cảnh báo và form sẽ chặn đăng.
 *
 * Props:
 *   onFilesChange  – (files: File[]) => void
 *   maxSizeMB      – dung lượng tối đa mỗi ảnh MB (default 5)
 */
import { useState, useLayoutEffect, useId, useMemo, useRef } from 'react';
import { Alert, Box, Typography, IconButton } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';
import { MAX_IMAGES_PER_LISTING } from '../../constants/listingLimits';

const MAX_SIZE_MB = 5;

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
  maxSizeMB = MAX_SIZE_MB,
  existingImages,
  existingImageUrls = [],
  onRemoveExistingImage,
}) {
  const inputId = useId();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [removingId, setRemovingId] = useState(null);
  const [invalidHint, setInvalidHint] = useState(null);

  const resolvedExisting = useMemo(
    () => normalizeExisting(existingImages, existingImageUrls),
    [existingImages, existingImageUrls],
  );

  const existingCount = resolvedExisting.length;
  const totalCount = existingCount + files.length;
  const isOverLimit = totalCount > MAX_IMAGES_PER_LISTING;
  /** Chỉ cho chọn thêm khi chưa đủ giới hạn (khi đã vượt thì khóa để người dùng xóa bớt trước). */
  const canAddMoreFiles = totalCount < MAX_IMAGES_PER_LISTING;

  const onFilesChangeRef = useRef(onFilesChange);
  onFilesChangeRef.current = onFilesChange;

  const handleRemoveExisting = async (imageId) => {
    if (imageId == null || !onRemoveExistingImage) return;
    setRemovingId(imageId);
    try {
      await onRemoveExistingImage(imageId);
    } finally {
      setRemovingId(null);
    }
  };

  // useLayoutEffect: báo parent trước paint — tránh submit ngay sau khi xóa ảnh mà state cha vẫn còn mảng cũ (race với useEffect).
  // Chỉ phụ thuộc `files` — không để `onFilesChange` trong deps (identity đổi mỗi render → lặp vô hạn).
  useLayoutEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      onFilesChangeRef.current?.([]);
      return;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    onFilesChangeRef.current?.(files);

    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const handleAddImages = (e) => {
    const selected = Array.from(e.target.files || []);

    const validFiles = selected.filter(
      (file) => file.type.startsWith('image/') && file.size <= maxSizeMB * 1024 * 1024,
    );
    const skippedInvalid = selected.length - validFiles.length;

    setFiles((prev) => [...prev, ...validFiles]);

    if (skippedInvalid > 0) {
      setInvalidHint(
        `${skippedInvalid} tệp không được thêm (chỉ ảnh, mỗi ảnh ≤ ${maxSizeMB}MB).`,
      );
    } else {
      setInvalidHint(null);
    }

    e.target.value = '';
  };

  const removeImage = (index) => {
    setInvalidHint(null);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const hasExisting = resolvedExisting.length > 0;
  const showUnifiedGrid = hasExisting || files.length > 0;
  const showBigDropzone = !showUnifiedGrid && canAddMoreFiles;

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

  const subtitle =
    existingCount > 0
      ? `Ảnh sản phẩm (Tối đa ${MAX_IMAGES_PER_LISTING} ảnh — ${existingCount} ảnh cũ + ${files.length} ảnh mới = ${totalCount}; mỗi ảnh ≤ ${maxSizeMB}MB)`
      : `Ảnh sản phẩm (Tối đa ${MAX_IMAGES_PER_LISTING} ảnh, mỗi ảnh ≤ ${maxSizeMB}MB)`;

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
        {subtitle}
      </Typography>

      {invalidHint && (
        <Alert severity="warning" onClose={() => setInvalidHint(null)} sx={{ mb: 1.5 }}>
          {invalidHint}
        </Alert>
      )}

      {isOverLimit && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          Bạn đang có {totalCount} ảnh (tối đa {MAX_IMAGES_PER_LISTING}). Vui lòng xóa bớt ảnh trước khi đăng
          bài.
        </Alert>
      )}

      <input
        type="file"
        accept="image/*"
        multiple
        id={inputId}
        hidden
        disabled={!canAddMoreFiles}
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
          {canAddMoreFiles && addTile}

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

          {previews.map((url, index) => {
            const file = files[index];
            const key = file
              ? `new-${index}-${file.name}-${file.size}-${file.lastModified}`
              : `new-${index}-${url}`;
            return (
              <Box
                key={key}
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
            );
          })}
        </Box>
      )}
    </Box>
  );
}

ImageUploader.propTypes = {
  onFilesChange: PropTypes.func,
  maxSizeMB: PropTypes.number,
  existingImages: PropTypes.arrayOf(PropTypes.object),
  existingImageUrls: PropTypes.arrayOf(PropTypes.string),
  onRemoveExistingImage: PropTypes.func,
};
