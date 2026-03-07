/**
 * Upload ảnh cho listing (preview + gửi file lên parent qua onFilesChange).
 * Parent gọi POST /api/listings/{id}/images sau khi tạo listing.
 */
import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;

export default function ImageUploader({ onFilesChange }) {
  const [files, setFiles] = useState([]);

  const handleChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    const valid = chosen.filter((f) => f.size <= MAX_SIZE_MB * 1024 * 1024).slice(0, MAX_FILES);
    setFiles(valid);
    if (onFilesChange) onFilesChange(valid);
    e.target.value = '';
  };

  return (
    <Box>
      <Button
        variant="outlined"
        component="label"
        startIcon={<CloudUploadIcon />}
        fullWidth
        sx={{ py: 1.5 }}
      >
        Chọn ảnh (tối đa {MAX_FILES}, mỗi ảnh &le; {MAX_SIZE_MB}MB)
        <input type="file" accept="image/*" multiple hidden onChange={handleChange} />
      </Button>
      {files.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Đã chọn {files.length} ảnh
        </Typography>
      )}
    </Box>
  );
}
