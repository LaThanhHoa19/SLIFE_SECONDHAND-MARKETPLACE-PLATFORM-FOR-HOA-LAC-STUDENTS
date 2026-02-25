/**
 * Mục đích: Upload ảnh (preview + progress bar + drag/drop hint).
 * API: POST /api/listings/{id}/images (multipart/form-data).
 * Validation: max file size (vd 5MB), loại file image/*, số lượng tối đa 10.
 * Accessibility: keyboard focus cho vùng upload; alt text cho preview.
 */
import { useState } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

export default function ImageUploader() {
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState([]);
  // TODO: implement drag-and-drop; gọi listingApi.uploadImages(listingId, formData, onUploadProgress).
  return (
    <Box>
      <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
      <Typography>TODO: Preview grid ({files.length} ảnh đã chọn)</Typography>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
}
