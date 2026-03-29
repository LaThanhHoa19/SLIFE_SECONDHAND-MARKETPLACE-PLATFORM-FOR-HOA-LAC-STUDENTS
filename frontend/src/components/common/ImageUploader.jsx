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

const MAX_FILES = 10;
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
                                        maxFiles = MAX_FILES,
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
  const cap = Math.max(0, Math.min(maxFiles, MAX_FILES));

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

    const validFiles = selected.filter(
        (file) => file.type.startsWith('image/') && file.size <= maxSizeMB * 1024 * 1024,
    );

    setFiles((prev) => {
      const room = Math.max(0, cap - prev.length);
      if (room === 0) {
        setCapNotice(`Đã đủ ${cap} ảnh (tối đa cho mỗi tin). Xóa bớt ảnh nếu muốn thêm ảnh khác.`);
        return prev;
      }
      const take = validFiles.slice(0, room);
      const invalidCount = selected.length - validFiles.length;
      if (validFiles.length > room) {
        setCapNotice(`Chỉ thêm được ${take.length} ảnh nữa — giới hạn ${cap} ảnh cho mỗi tin.`);
      } else if (invalidCount > 0) {
        setCapNotice('Một số file không phải ảnh hợp lệ hoặc vượt quá dung lượng cho phép.');
      } else {
        setCapNotice('');
      }
      return [...prev, ...take];
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
          Ảnh sản phẩm (Tối đa {cap} ảnh, mỗi ảnh ≤ {maxSizeMB}MB)
        </Typography>
        {capNotice ? (
            <Typography variant="body2" color="error" sx={{ mb: 1.5, fontWeight: 600 }}>
              {capNotice}
            </Typography>
        ) : null}

        <input type="file" accept="image/*" multiple id={inputId} hidden onChange={handleAddImages} />

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
