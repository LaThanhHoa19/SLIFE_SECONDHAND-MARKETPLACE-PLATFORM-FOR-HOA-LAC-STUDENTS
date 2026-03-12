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

      {/* KHUNG UPLOAD LỚN – chỉ hiện khi chưa có ảnh */}
      {files.length === 0 && (
        <label htmlFor="upload-image-input" style={{ display: "block" }}>
          <Box
            sx={{
              height: 200,
              borderRadius: "14px",
              background: "#EDE7F6",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              gap: 1,
              "&:hover": { background: "#e0d4f7" }
            }}
          >
            <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 50, color: "#9D6EED" }} />
            <Typography fontWeight={600} fontSize={18}>
              Thêm ảnh
            </Typography>
          </Box>
        </label>
      )}

      {/* GRID PREVIEW – hiện khi đã có ảnh */}
      {files.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>

          {/* NÚT THÊM NHỎ */}
          {files.length < MAX_FILES && (
            <label htmlFor="upload-image-input">
              <Box
                sx={{
                  width: 110,
                  height: 110,
                  borderRadius: "10px",
                  background: "#EDE7F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  "&:hover": { background: "#e0d4f7" }
                }}
              >
                <AddPhotoAlternateOutlinedIcon sx={{ color: "#9D6EED", fontSize: 35 }} />
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
                borderRadius: "10px",
                overflow: "hidden",
                position: "relative"
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
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}