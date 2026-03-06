/**
 * Mục đích: Upload ảnh (preview + progress bar + drag/drop hint).
 * API: POST /api/listings/{id}/images (multipart/form-data).
 * Validation: max file size (vd 5MB), loại file image/*, số lượng tối đa 10.
 * Accessibility: keyboard focus cho vùng upload; alt text cho preview.
 */
import {useState} from 'react';
import {Box, LinearProgress, Typography, IconButton} from '@mui/material';
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";

export default function ImageUploader() {
    const [progress, setProgress] = useState(0);
    const [files, setFiles] = useState([]);
    const handleAddImages = (e) => {
        const selected = Array.from(e.target.files || []);
        const validFiles = selected.filter(file =>
            file.type.startsWith("image/") &&
            file.size <= 5 * 1024 * 1024
        );
        const newFiles = [...files, ...validFiles].slice(0, 6);
        setFiles(newFiles);
        e.target.value = null;
    };
    const removeImage = (index) => {
        const updated = files.filter((_, i) => i !== index);
        setFiles(updated);
    };
    // TODO: implement drag-and-drop; gọi listingApi.uploadImages(listingId, formData, onUploadProgress).
    return (
        <Box>

            {/* INPUT HIDDEN */}
            <input
                type="file"
                accept="image/*"
                multiple
                id="upload-image"
                hidden
                onChange={handleAddImages}
            />

            {/* KHUNG UPLOAD BAN ĐẦU */}
            {files.length === 0 && (
                <label htmlFor="upload-image">

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
                            gap: 1
                        }}
                    >

                        <AddPhotoAlternateOutlinedIcon
                            sx={{
                                fontSize: 50,
                                color: "#9D6EED"
                            }}
                        />

                        <Typography fontWeight={600} fontSize={18}>
                            Thêm ảnh
                        </Typography>

                    </Box>

                </label>
            )}

            {/* GRID PREVIEW */}
            {files.length > 0 && (

                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 2
                    }}
                >

                    {/* NÚT ADD */}
                    {files.length < 6 && (
                        <label htmlFor="upload-image">

                            <Box
                                sx={{
                                    width: 110,
                                    height: 110,
                                    borderRadius: "10px",
                                    background: "#EDE7F6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer"
                                }}
                            >
                                <AddPhotoAlternateOutlinedIcon
                                    sx={{color: "#9D6EED", fontSize: 35}}
                                />
                            </Box>

                        </label>
                    )}

                    {/* DANH SÁCH ẢNH */}
                    {files.map((file, index) => {

                        const url = URL.createObjectURL(file);

                        return (

                            <Box
                                key={index}
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
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover"
                                    }}
                                />

                                {/* NÚT XOÁ */}
                                <IconButton
                                    size="small"
                                    onClick={() => removeImage(index)}
                                    sx={{
                                        position: "absolute",
                                        top: 4,
                                        right: 4,
                                        background: "rgba(0,0,0,0.5)",
                                        color: "#fff",
                                        "&:hover": {
                                            background: "rgba(0,0,0,0.7)"
                                        }
                                    }}
                                >
                                    <CloseIcon fontSize="small"/>
                                </IconButton>
                            </Box>

                        );

                    })}
                </Box>
            )}
        </Box>
    );
}
