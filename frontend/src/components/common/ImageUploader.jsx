/**
 * Upload ảnh cho listing: chọn file, preview thumbnails, gửi danh sách file qua onFilesChange.
 * Parent gọi POST /api/listings/{id}/images sau khi tạo tin.
 */
import { useState, useEffect } from 'react';
import { Box, Typography, Button, ImageList, ImageListItem } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;

export default function ImageUploader({ onFilesChange }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      if (onFilesChange) onFilesChange([]);
      return;
    }
    const valid = files.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024).slice(0, MAX_FILES);
    const urls = valid.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    if (onFilesChange) onFilesChange(valid);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const handleChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    setFiles(chosen);
    e.target.value = '';
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Ảnh sản phẩm (tối đa {MAX_FILES}, mỗi ảnh ≤ {MAX_SIZE_MB}MB)
      </Typography>
      <Button
        variant="outlined"
        component="label"
        startIcon={<CloudUploadIcon />}
        fullWidth
        sx={{ py: 1.5, mb: 2 }}
      >
        Chọn ảnh
        <input type="file" accept="image/*" multiple hidden onChange={handleChange} />
      </Button>
      {previews.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Đã chọn {previews.length} ảnh — sẽ tải lên sau khi bạn bấm « Đăng tin »
          </Typography>
          <ImageList cols={4} gap={8} sx={{ m: 0 }}>
            {previews.map((url, i) => (
              <ImageListItem key={i}>
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  style={{ borderRadius: 8, objectFit: 'cover', height: 100 }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        </>
      )}
    </Box>
  );
}
