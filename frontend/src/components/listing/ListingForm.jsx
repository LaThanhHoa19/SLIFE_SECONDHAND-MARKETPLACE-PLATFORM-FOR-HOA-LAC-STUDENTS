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

export default function ListingForm({ defaultValues = {}, onSubmit, submitting = false, mode = 'create' }) {
    // Logic quản lý State & Form
    const [imageFiles, setImageFiles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [openCategory, setOpenCategory] = useState(false);
    
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            description: '',
            price: '',
            condition: 'USED',
            location: 'tanxa',
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

    // Xử lý logic giá khi check "Cho tặng"
    useEffect(() => {
        if (isGiveaway) setValue('price', '0');
    }, [isGiveaway, setValue]);

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
                maxWidth: "1000px",
                width: "95%",
                mx: "auto",
                mt: 4,
                mb: 8,
                p: { xs: 3, md: 6 },
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
                rows={4}
                placeholder="Ví dụ: Máy còn mới 95%, đầy đủ phụ kiện, bảo hành 3 tháng..."
                {...register("description", { required: "Vui lòng nhập mô tả" })}
                error={!!errors.description}
                helperText={errors.description?.message}
                sx={{ mb: 4 }}
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
                            minLength: { value: 10, message: "Tối thiểu 10 ký tự" }
                        })}
                        error={!!errors.title}
                        helperText={errors.title?.message}
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
                            fontSize: "16px",
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
                        Giá bán
                    </Typography>
                    <TextField
                        fullWidth
                        value={formatPrice(watch('price'))}
                        disabled={isGiveaway}
                        onChange={(e) => setValue('price', e.target.value.replace(/\D/g, ""))}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">đ</InputAdornment>
                        }}
                    />
                    <FormControlLabel
                        control={<Checkbox {...register('isGiveaway')} />}
                        label="Trao tặng miễn phí"
                        sx={{ mt: 1 }}
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
                    >
                        <MenuItem value="tanxa">Tân Xã (Gần FPT)</MenuItem>
                        <MenuItem value="thachhoa">Thạch Hòa</MenuItem>
                        <MenuItem value="binhyen">Bình Yên</MenuItem>
                    </TextField>
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
                        <ToggleButton value="USED" sx={{ px: 3, borderRadius: "10px" }}>ĐÃ SỬ DỤNG</ToggleButton>
                        <ToggleButton value="NEW" sx={{ px: 3, borderRadius: "10px" }}>MỚI</ToggleButton>
                    </ToggleButtonGroup>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Stack direction="row" gap={2}>
                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{ py: 1.5, fontWeight: 700, borderRadius: "12px", border: '2px solid' }}
                        >
                            LƯU NHÁP
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={submitting}
                            sx={{ py: 1.5, fontWeight: 700, borderRadius: "12px", backgroundColor: "#201D26" }}
                        >
                            {submitting ? 'ĐANG XỬ LÝ...' : mode === 'create' ? 'ĐĂNG TIN NGAY' : 'CẬP NHẬT'}
                        </Button>
                    </Stack>
                </Grid>
            </Grid>

            {/* DIALOG CHỌN DANH MỤC */}
            <Dialog open={openCategory} onClose={() => setOpenCategory(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ bgcolor: "#201D26", color: "#fff" }}>Chọn danh mục</DialogTitle>
                <List sx={{ p: 0 }}>
                    {categories.map((c) => (
                        <ListItemButton 
                            key={c.id || c.categoryId} 
                            onClick={() => {
                                setValue('categoryId', c.id || c.categoryId);
                                setValue('categoryName', c.name);
                                setOpenCategory(false);
                            }}
                            sx={{ borderBottom: "1px solid #eee", py: 2 }}
                        >
                            <ListItemText primary={c.name} />
                            <ChevronRightIcon fontSize="small" color="disabled" />
                        </ListItemButton>
                    ))}
                </List>
            </Dialog>
        </Box>
    );
}