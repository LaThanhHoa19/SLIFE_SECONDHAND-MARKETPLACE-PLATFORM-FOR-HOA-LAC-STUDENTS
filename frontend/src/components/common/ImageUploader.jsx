import { useState, useEffect } from 'react';
import { Box, Typography, IconButton, ImageList, ImageListItem } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;

export default function ImageUploader({ onFilesChange }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Xử lý tạo và thu hồi (cleanup) URL preview để tránh rò rỉ bộ nhớ
  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      if (onFilesChange) onFilesChange([]);
      return;
    }

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    
    if (onFilesChange) onFilesChange(files);

    // Cleanup function
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files, onFilesChange]);

  const handleAddImages = (e) => {
    const selected = Array.from(e.target.files || []);
    
    // Lọc file đúng định dạng và kích thước
    const validFiles = selected.filter(file =>
      file.type.startsWith("image/") &&
      file.size <= MAX_SIZE_MB * 1024 * 1024
    );

    // Hợp nhất với danh sách cũ và giới hạn số lượng
    setFiles(prev => [...prev, ...validFiles].slice(0, MAX_FILES));
    
    // Reset value để có thể chọn lại cùng 1 file nếu cần
    e.target.value = '';
  };

  const removeImage = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
        Ảnh sản phẩm (Tối đa {MAX_FILES} ảnh, mỗi ảnh ≤ {MAX_SIZE_MB}MB)
      </Typography>

      {/* INPUT HIDDEN */}
      <input
        type="file"
        accept="image/*"
        multiple
        id="upload-image-input"
        hidden
        onChange={handleAddImages}
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {/* NÚT THÊM ẢNH (Hiển thị dạng khung lớn nếu chưa có ảnh, hoặc ô nhỏ nếu đã có ảnh) */}
        {files.length < MAX_FILES && (
          <label htmlFor="upload-image-input">
            <Box
              sx={{
                width: files.length === 0 ? "100%" : 110,
                height: files.length === 0 ? 150 : 110,
                borderRadius: "12px",
                background: "#f5f3ff",
                border: "2px dashed #9D6EED",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "0.3s",
                "&:hover": { background: "#ede7f6" }
              }}
            >
              <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 32, color: "#9D6EED" }} />
              {files.length === 0 && (
                <Typography variant="body2" sx={{ mt: 1, color: "#9D6EED", fontWeight: 600 }}>
                  Thêm hình ảnh
                </Typography>
              )}
            </Box>
          </label>
        )}

        {/* DANH SÁCH PREVIEW */}
        {previews.map((url, index) => (
          <Box
            key={url}
            sx={{
              width: 110,
              height: 110,
              borderRadius: "12px",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
          >
            <img
              src={url}
              alt={`preview-${index}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <IconButton
              size="small"
              onClick={() => removeImage(index)}
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                "&:hover": { background: "rgba(0,0,0,0.7)" }
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
}