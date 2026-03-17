import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
    Box, Button, TextField, Typography, Grid, MenuItem, Checkbox,
    FormControlLabel, ToggleButton, ToggleButtonGroup, Dialog,
    DialogTitle, List, ListItemButton, ListItemText, IconButton,
    InputAdornment, Stack, Collapse,
} from "@mui/material";

// Icons
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import ImageUploader from '../common/ImageUploader';
import { getCategories } from '../../api/categoryApi';
import { getLocations } from '../../api/locationApi';

function buildCategoryTree(flatList) {
    if (!Array.isArray(flatList) || flatList.length === 0) return [];
    const byId = new Map();
    flatList.forEach((c) => {
        const id = c.id ?? c.categoryId;
        byId.set(id, { ...c, id, children: [] });
    });
    const roots = [];
    flatList.forEach((c) => {
        const node = byId.get(c.id ?? c.categoryId);
        if (!node) return;
        const parentId = c.parentId ?? c.parent_id ?? null;
        if (parentId == null) {
            roots.push(node);
        } else {
            const parent = byId.get(parentId);
            if (parent) parent.children.push(node);
            else roots.push(node);
        }
    });
    return roots;
}

export default function ListingForm({ defaultValues = {}, onSubmit, submitting = false, mode = 'create' }) {
    // Logic quản lý State & Form
    const [imageFiles, setImageFiles] = useState([]);
    const [imageError, setImageError] = useState('');
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [openCategory, setOpenCategory] = useState(false);
    const [expandedCatId, setExpandedCatId] = useState(null);
    
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
        // if (imageFiles.length === 0) {
        //     setImageError('Vui lòng tải lên ít nhất 1 hình ảnh');
        //     return;
        // }
        const finalValues = {
            ...values,
            price: Number(values.price.toString().replace(/\D/g, ""))
        };
        onSubmit?.(finalValues, imageFiles);
    };

    const handleFilesChange = useCallback((files) => {
        setImageFiles(files);
        if (files.length > 0) setImageError('');
    }, []);

    const onFormSubmit = (e) => {
        e.preventDefault();
        if (imageFiles.length === 0) setImageError('Vui lòng tải lên ít nhất 1 hình ảnh');
        handleSubmit(handleFormSubmit)(e);
    };

    return (
        <Box
            component="form"
            onSubmit={onFormSubmit}
            sx={{
                maxWidth: "1200px",
                width: "90%",
                mx: "auto",
                mt: 6,
                mb: 8,
                p: 6,
                border: "3px solid #201D26",
                borderRadius: "14px",
                backgroundColor: "#201D26",
                color: "#FFFFFF",

                "& .MuiInputBase-root": {
                    backgroundColor: "#312F37",
                    color: "#fff"
                },

                "& .MuiInputBase-input": {
                    color: "#fff"
                }
            }}
        >
            {/* 1. HÌNH ẢNH */}
            <Typography fontWeight={600} fontSize={20} mb={2}>
                Hình ảnh sản phẩm <Box component="span" sx={{ color: 'error.main' }}>*</Box>
            </Typography>
            <Box mb={4}>
                <ImageUploader
                    onFilesChange={handleFilesChange}
                    error={imageError}
                />

                {imageError && (
                    <Typography color="error" sx={{ mt: 1 }}>
                        {imageError}
                    </Typography>
                )}
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
                    <input
                        type="hidden"
                        {...register('categoryId', { required: 'Vui lòng chọn danh mục' })}
                    />
                    <Box
                        onClick={() => setOpenCategory(true)}
                        sx={{
                            border: `1px solid ${errors.categoryId ? '#d32f2f' : 'transparent'}`,
                            borderRadius: "10px",
                            px: 2, py: 1.5,
                            cursor: "pointer",
                            fontSize: "20px",
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: "#312F37",
                            color: "#fff",

                            "&:hover": {
                                borderColor: "#9D6EED"
                            },

                            "&:focus-within": {
                                borderColor: "#9D6EED"
                            }
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
                            endAdornment: <InputAdornment position="end"><Box sx={{ fontSize: 20, fontWeight: 700, ml: 0.5, color: "#fff" }}>đ</Box></InputAdornment>
                        }}
                        sx={{
                            "& .MuiInputBase-input": {
                                fontSize: "20px"
                            },
                            "& .MuiInputBase-input.Mui-disabled": {
                                WebkitTextFillColor: "#fff"
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
                        value={watch('location')}
                        onChange={(e) => setValue('location', e.target.value)}
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

                                "&:hover": {
                                    backgroundColor: "#d5d5d5"
                                },

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

                                "&:hover": {
                                    backgroundColor: "#d5d5d5"
                                },

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
                                backgroundColor: "#E0E0E0",
                                color: "#201D26",
                                py: 1.6,
                                fontSize: "18px",
                                fontWeight: 600,
                                borderRadius: "12px",
                                border: "none",

                                "&:hover": {
                                    backgroundColor: "#d5d5d5"
                                }
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
                                backgroundColor: "#9D6EED",
                                py: 1.6,
                                fontSize: "18px",
                                fontWeight: 600,
                                borderRadius: "12px",

                                "&:hover": {
                                    backgroundColor: "#B794F6"
                                }
                            }}
                        >
                            {submitting ? 'ĐANG XỬ LÝ...' : mode === 'create' ? 'ĐĂNG TIN' : 'CẬP NHẬT'}
                        </Button>
                    </Stack>
                </Grid>
            </Grid>

            {/* DIALOG CHỌN DANH MỤC */}
            <Dialog
                open={openCategory}
                onClose={() => { setOpenCategory(false); setExpandedCatId(null); }}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { bgcolor: '#201D26', backgroundImage: 'none' } }}
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        bgcolor: "#2A2733",
                        color: "#fff",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        py: 1.5,
                    }}
                >
                    <Typography fontWeight={700} fontSize={16}>Chọn danh mục</Typography>
                    <IconButton onClick={() => { setOpenCategory(false); setExpandedCatId(null); }} sx={{ color: "rgba(255,255,255,0.6)" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <List sx={{ p: 0, maxHeight: 480, overflowY: 'auto' }}>
                    {buildCategoryTree(categories).map((parent, idx, arr) => {
                        const parentId = parent.id ?? parent.categoryId;
                        const hasChildren = parent.children?.length > 0;
                        const isExpanded = expandedCatId === parentId;

                        const selectCategory = (id, name) => {
                            setValue('categoryId', id);
                            setValue('categoryName', name);
                            clearErrors('categoryId');
                            setOpenCategory(false);
                            setExpandedCatId(null);
                        };

                        return (
                            <Box key={parentId}>
                                {/* Hàng danh mục cha */}
                                <ListItemButton
                                    onClick={() => {
                                        if (hasChildren) {
                                            setExpandedCatId(isExpanded ? null : parentId);
                                        } else {
                                            selectCategory(parentId, parent.name);
                                        }
                                    }}
                                    sx={{
                                        py: 1.75,
                                        px: 2.5,
                                        borderBottom: (!isExpanded && idx < arr.length - 1)
                                            ? '1px solid rgba(255,255,255,0.07)'
                                            : 'none',
                                        bgcolor: isExpanded ? 'rgba(157,110,237,0.1)' : 'transparent',
                                        '&:hover': { bgcolor: 'rgba(157,110,237,0.12)' },
                                    }}
                                >
                                    <ListItemText
                                        primary={parent.name}
                                        primaryTypographyProps={{
                                            fontSize: 15,
                                            fontWeight: isExpanded ? 700 : 500,
                                            color: isExpanded ? '#B794F6' : 'rgba(255,255,255,0.9)',
                                        }}
                                    />
                                    {hasChildren ? (
                                        <ExpandMoreIcon
                                            sx={{
                                                fontSize: 20,
                                                color: isExpanded ? '#9D6EED' : 'rgba(255,255,255,0.4)',
                                                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                                transition: 'transform 0.2s, color 0.2s',
                                            }}
                                        />
                                    ) : (
                                        <ChevronRightIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
                                    )}
                                </ListItemButton>

                                {/* Danh mục con — accordion */}
                                {hasChildren && (
                                    <Collapse in={isExpanded} timeout={200}>
                                        <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                            {parent.children.map((child, cIdx) => {
                                                const childId = child.id ?? child.categoryId;
                                                return (
                                                    <ListItemButton
                                                        key={childId}
                                                        onClick={() => selectCategory(childId, `${parent.name} > ${child.name}`)}
                                                        sx={{
                                                            py: 1.4,
                                                            pl: 4,
                                                            pr: 2.5,
                                                            borderBottom: cIdx < parent.children.length - 1
                                                                ? '1px solid rgba(255,255,255,0.05)'
                                                                : 'none',
                                                            '&:hover': { bgcolor: 'rgba(157,110,237,0.15)' },
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                width: 4, height: 4, borderRadius: '50%',
                                                                bgcolor: 'rgba(157,110,237,0.7)',
                                                                mr: 1.5, flexShrink: 0,
                                                            }}
                                                        />
                                                        <ListItemText
                                                            primary={child.name}
                                                            primaryTypographyProps={{
                                                                fontSize: 14,
                                                                fontWeight: 400,
                                                                color: 'rgba(255,255,255,0.8)',
                                                            }}
                                                        />
                                                    </ListItemButton>
                                                );
                                            })}
                                        </Box>
                                    </Collapse>
                                )}
                            </Box>
                        );
                    })}
                </List>
            </Dialog>
        </Box>
    );
}