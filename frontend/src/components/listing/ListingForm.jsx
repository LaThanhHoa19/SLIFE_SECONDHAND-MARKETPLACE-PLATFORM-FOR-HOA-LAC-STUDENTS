import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Box, Button, TextField, Typography, Grid, MenuItem, Checkbox, 
    FormControlLabel, ToggleButton, ToggleButtonGroup, Dialog, 
    DialogTitle, List, ListItemButton, ListItemText, IconButton, 
    InputAdornment, Radio, Stack
} from "@mui/material";

// Icons
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import LaptopMacOutlined from "@mui/icons-material/LaptopMacOutlined";

import ImageUploader from '../common/ImageUploader';
import { getCategories } from '../../api/categoryApi';
import { getLocations } from '../../api/locationApi';

export default function ListingForm({ defaultValues = {}, onSubmit, submitting = false, mode = 'create' }) {
    // Logic quản lý State & Form
    const [imageFiles, setImageFiles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [openCategory, setOpenCategory] = useState(false);
    
    const { register, handleSubmit, watch, setValue, clearErrors, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            description: '',
            price: '',
            condition: 'USED',
            location: '',
            isGiveaway: false,
            categoryId: '',
            categoryName: '', // Hiển thị trên UI
            ...defaultValues,
        },
    });

    const isGiveaway = watch('isGiveaway');
    const selectedCategoryName = watch('categoryName');
    const currentCondition = watch('condition');

    // Fetch danh mục từ API
    useEffect(() => {
        getCategories()
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                setCategories(Array.isArray(data) ? data : []);
            })
            .catch(() => setCategories([]));
    }, []);

    // Fetch khu vực giao dịch từ API
    useEffect(() => {
        getLocations()
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                const list = Array.isArray(data) ? data : [];
                setLocations(list);
                if (list.length > 0 && !defaultValues.location) {
                    setValue('location', list[0]);
                }
            })
            .catch(() => setLocations([]));
    }, []);

    // Xử lý logic giá khi check/uncheck "Cho tặng"
    useEffect(() => {
        if (isGiveaway) {
            setValue('price', '0');
            clearErrors('price');
        } else {
            setValue('price', '');
        }
    }, [isGiveaway, setValue, clearErrors]);

    const formatPrice = (value) => {
        if (!value || value === "0") return value;
        return Number(value.toString().replace(/\D/g, "")).toLocaleString("vi-VN");
    };

    const handleFormSubmit = (values) => {
        // Chuyển giá về số trước khi gửi
        const finalValues = {
            ...values,
            price: Number(values.price.toString().replace(/\D/g, ""))
        };
        onSubmit?.(finalValues, imageFiles);
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit(handleFormSubmit)}
            sx={{
                maxWidth: "1200px",
                width: "90%",
                mx: "auto",
                mt: 6,
                mb: 8,
                p: 6,
                border: "3px solid #201D26",
                borderRadius: "14px",
                backgroundColor: "#FFFFFF"
            }}
        >
            {/* 1. HÌNH ẢNH */}
            <Typography fontWeight={600} fontSize={20} mb={2}>
                Hình ảnh sản phẩm <Box component="span" sx={{ color: 'error.main' }}>*</Box>
            </Typography>
            <Box mb={4}>
                <ImageUploader onFilesChange={setImageFiles} />
            </Box>

            {/* 2. MÔ TẢ */}
            <Typography fontWeight={600} fontSize={20} mb={1.5}>
                Mô tả chi tiết <Box component="span" sx={{ color: 'error.main' }}>*</Box>
            </Typography>
            <TextField
                fullWidth
                multiline
                rows={5}
                placeholder="Ví dụ: Máy còn mới 95%, đầy đủ phụ kiện, bảo hành 3 tháng..."
                {...register("description", {
                    required: "Vui lòng nhập mô tả",
                    validate: (v) =>
                        v.trim().split(/\s+/).filter(Boolean).length >= 10 || "Mô tả tối thiểu 10 từ"
                })}
                error={!!errors.description}
                helperText={errors.description?.message}
                sx={{
                    mb: 4,
                    "& .MuiInputBase-input": {
                        fontSize: "20px"
                    }
                }}
            />

            {/* 3. TIÊU ĐỀ & DANH MỤC */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Typography fontWeight={600} fontSize={20} mb={1.5}>
                        Tiêu đề <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Tên sản phẩm của bạn"
                        {...register("title", { 
                            required: "Nhập tiêu đề",
                            minLength: { value: 2, message: "Tối thiểu 2 ký tự" }
                        })}
                        error={!!errors.title}
                        helperText={errors.title?.message}
                        sx={{
                            "& .MuiInputBase-input": {
                                fontSize: "20px"
                            }
                        }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography fontWeight={600} fontSize={20} mb={1.5}>
                        Danh mục <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>
                    <Box
                        onClick={() => setOpenCategory(true)}
                        sx={{
                            border: `1px solid ${errors.categoryId ? '#d32f2f' : '#ccc'}`,
                            borderRadius: "10px",
                            px: 2, py: 1.5,
                            cursor: "pointer",
                            fontSize: "20px",
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            "&:hover": { borderColor: "#201D26" }
                        }}
                    >
                        {selectedCategoryName || "Chọn danh mục sản phẩm"}
                        <ChevronRightIcon />
                    </Box>
                    {errors.categoryId && (
                        <Typography color="error" variant="caption" sx={{ ml: 2 }}>
                            Vui lòng chọn danh mục
                        </Typography>
                    )}
                </Grid>
            </Grid>

            {/* 4. GIÁ & ĐỊA ĐIỂM */}
            <Grid container spacing={3} mt={1}>
                <Grid item xs={12} md={6}>
                    <Typography fontWeight={600} fontSize={20} mb={1.5}>
                        Giá bán <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>
                    <TextField
                        fullWidth
                        {...register("price", {
                            validate: (v) => {
                                if (isGiveaway) return true;
                                const num = Number(String(v || "").replace(/\D/g, ""));
                                if (!num) return "Vui lòng nhập giá";
                                if (num < 1000) return "Giá tối thiểu 1.000đ";
                                return true;
                            }
                        })}
                        value={formatPrice(watch('price'))}
                        disabled={isGiveaway}
                        onChange={(e) => setValue('price', e.target.value.replace(/\D/g, ""), { shouldValidate: true })}
                        error={!!errors.price}
                        helperText={errors.price?.message}
                        InputProps={{
                            endAdornment: <InputAdornment position="end"><Box sx={{ fontSize: 20, fontWeight: 700, ml: 0.5 }}>đ</Box></InputAdornment>
                        }}
                        sx={{
                            "& .MuiInputBase-input": {
                                fontSize: "20px"
                            }
                        }}
                    />
                    <FormControlLabel
                        control={<Checkbox {...register('isGiveaway')} />}
                        label="Tôi muốn trao tặng miễn phí"
                        sx={{
                            mt: 1,
                            "& .MuiFormControlLabel-label": {
                                fontSize: "18px",
                                fontWeight: 500
                            }
                        }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography fontWeight={600} fontSize={20} mb={1.5}>
                        Khu vực giao dịch <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                    </Typography>
                    <TextField
                        select
                        fullWidth
                        {...register("location")}
                        SelectProps={{ displayEmpty: true }}
                        sx={{
                            "& .MuiInputBase-input": {
                                fontSize: "20px"
                            }
                        }}
                    >
                        {locations.map((loc) => (
                            <MenuItem key={loc} value={loc} sx={{ fontSize: "20px" }}>
                                {loc}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Typography fontSize={16} mt={1} color="error">
                        Chỉ hỗ trợ giao dịch trong khu vực Hoà Lạc
                    </Typography>
                </Grid>
            </Grid>

            {/* 5. TÌNH TRẠNG & SUBMIT */}
            <Grid container spacing={3} mt={2} alignItems="center">
                <Grid item xs={12} md={6}>
                    <Typography fontWeight={600} fontSize={20} mb={1.5}>
                        Tình trạng sản phẩm
                    </Typography>
                    <ToggleButtonGroup
                        exclusive
                        value={currentCondition}
                        onChange={(_, val) => val && setValue('condition', val)}
                    >
                        <ToggleButton
                            value="USED"
                            sx={{
                                px: 4,
                                py: 1.2,
                                borderRadius: "12px",
                                backgroundColor: "#E0E0E0",
                                color: "#201D26",
                                border: "none",
                                "&.Mui-selected": {
                                    backgroundColor: "#9D6EED",
                                    color: "#fff",
                                    "&:hover": {
                                        backgroundColor: "#B794F6"
                                    }
                                }
                            }}
                        >
                            ĐÃ SỬ DỤNG
                        </ToggleButton>

                        <ToggleButton
                            value="NEW"
                            sx={{
                                px: 4,
                                py: 1.2,
                                borderRadius: "12px",
                                backgroundColor: "#E0E0E0",
                                color: "#201D26",
                                border: "none",
                                "&.Mui-selected": {
                                    backgroundColor: "#9D6EED",
                                    color: "#fff",
                                    "&:hover": {
                                        backgroundColor: "#B794F6"
                                    }
                                }
                            }}
                        >
                            MỚI
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Stack direction="row" gap={2}>
                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{
                                borderColor: "#201D26",
                                color: "#201D26",
                                py: 1.6,
                                fontSize: "18px",
                                fontWeight: 600,
                                borderRadius: "12px",
                                border: "3px solid"
                            }}
                        >
                            LƯU NHÁP
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={submitting}
                            sx={{
                                backgroundColor: "#201D26",
                                py: 1.6,
                                fontSize: "18px",
                                fontWeight: 600,
                                borderRadius: "12px"
                            }}
                        >
                            {submitting ? 'ĐANG XỬ LÝ...' : mode === 'create' ? 'ĐĂNG TIN' : 'CẬP NHẬT'}
                        </Button>
                    </Stack>
                </Grid>
            </Grid>

            {/* DIALOG CHỌN DANH MỤC */}
            <Dialog open={openCategory} onClose={() => setOpenCategory(false)} fullWidth maxWidth="xs">
                <DialogTitle
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: "#201D26",
                        color: "#fff"
                    }}
                >
                    Chọn danh mục
                    <IconButton onClick={() => setOpenCategory(false)} sx={{ color: "#fff" }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <List sx={{ background: "#201D26", color: "#fff", p: 0 }}>
                    {categories.map((c) => (
                        <ListItemButton 
                            key={c.id || c.categoryId} 
                            onClick={() => {
                                setValue('categoryId', c.id || c.categoryId);
                                setValue('categoryName', c.name);
                                setOpenCategory(false);
                            }}
                            sx={{
                                borderBottom: "1px solid rgba(255,255,255,0.1)",
                                py: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 2
                            }}
                        >
                            <ListItemText primary={c.name} />
                            <ChevronRightIcon />
                        </ListItemButton>
                    ))}
                </List>
            </Dialog>
        </Box>
    );
}