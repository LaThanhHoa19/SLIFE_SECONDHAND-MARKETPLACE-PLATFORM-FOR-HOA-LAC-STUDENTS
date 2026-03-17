import { useState, useEffect, useCallback, useRef } from 'react';
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
import { searchPlaces, reverseGeocode } from '../../api/geoApi';
import useDebounce from '../../hooks/useDebounce';

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

export default function ListingForm({ defaultValues = {}, onSubmit, onSaveDraft, submitting = false, savingDraft = false, mode = 'create' }) {
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
            condition: 'USED_GOOD',
            location: '',
            isGiveaway: false,
            categoryId: '',
            categoryName: '', // Hiển thị trên UI
            // Các field dành cho Vietmap / tạo địa chỉ mới
            pickupAddressId: null,
            pickupLocationName: '',
            pickupAddressText: '',
            pickupLat: '',
            pickupLng: '',
            ...defaultValues,
        },
    });

    const isGiveaway = watch('isGiveaway');
    const selectedCategoryName = watch('categoryName');
    const currentCondition = watch('condition');
    const pickupAddressText = watch('pickupAddressText');
    const pickupLat = watch('pickupLat');
    const pickupLng = watch('pickupLng');

    // State cho Vietmap search
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 400);
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const mapRef = useRef(null);
    const markerRef = useRef(null);

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
        const finalValues = {
            ...values,
            price: Number(values.price.toString().replace(/\D/g, ""))
        };
        onSubmit?.(finalValues, imageFiles);
    };

    const handleSaveDraftClick = () => {
        const values = watch(); // lấy giá trị hiện tại không qua validation
        const finalValues = {
            ...values,
            price: values.price ? Number(values.price.toString().replace(/\D/g, "")) : 0,
        };
        onSaveDraft?.(finalValues, imageFiles);
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

    // Inject Vietmap GL JS + init map (click để gim vị trí)
    useEffect(() => {
        const VIETMAP_TILE_KEY = import.meta.env.VITE_VIETMAP_TILE_KEY;
        if (!VIETMAP_TILE_KEY) {
            return;
        }

        let cancelled = false;

        const initMap = () => {
            if (cancelled || mapRef.current || !window.vietmapgl) return;

            const centerLat = pickupLat ? Number(pickupLat) : 10.803866;
            const centerLng = pickupLng ? Number(pickupLng) : 106.668171;

            const map = new window.vietmapgl.Map({
                container: 'vietmap-container',
                style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${VIETMAP_TILE_KEY}`,
                center: [centerLng, centerLat],
                zoom: 14,
            });

            map.addControl(new window.vietmapgl.NavigationControl(), 'top-left');

            mapRef.current = map;

            if (pickupLat && pickupLng) {
                const marker = new window.vietmapgl.Marker()
                    .setLngLat([Number(pickupLng), Number(pickupLat)])
                    .addTo(map);
                markerRef.current = marker;
            }

            map.on('click', async (e) => {
                const { lng, lat } = e.lngLat;
                if (!markerRef.current) {
                    markerRef.current = new window.vietmapgl.Marker().setLngLat([lng, lat]).addTo(map);
                } else {
                    markerRef.current.setLngLat([lng, lat]);
                }

                setValue('pickupLat', lat.toFixed(6));
                setValue('pickupLng', lng.toFixed(6));

                try {
                    const res = await reverseGeocode({ lat, lng });
                    const data = res?.data?.data ?? res?.data;
                    if (data) {
                        const name = data.locationName || '';
                        const addr = data.addressText || '';
                        setValue('pickupLocationName', name || addr);
                        setValue('pickupAddressText', addr);
                        setSearchQuery(addr || name || '');
                    }
                } catch {
                    // ignore reverse error
                }
            });
        };

        const ensureCss = () => {
            if (document.querySelector('link[data-vietmap-gl-css]')) return;
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.css';
            link.dataset.vietmapGlCss = 'true';
            document.head.appendChild(link);
        };

        ensureCss();

        let script = document.querySelector('script[data-vietmap-gl]');
        if (!script) {
            script = document.createElement('script');
            script.src = 'https://unpkg.com/@vietmap/vietmap-gl-js@6.0.1/dist/vietmap-gl.js';
            script.async = true;
            script.defer = true;
            script.dataset.vietmapGl = 'true';
            script.addEventListener('load', initMap);
            document.body.appendChild(script);
        } else if (window.vietmapgl) {
            initMap();
        } else {
            script.addEventListener('load', initMap);
        }

        return () => {
            cancelled = true;
        };
    }, [pickupLat, pickupLng, setValue]);

    // Gọi BE geo search khi user gõ địa chỉ chi tiết
    useEffect(() => {
        const q = debouncedQuery.trim();
        if (!q) {
            setSuggestions([]);
            return;
        }
        setIsSearching(true);
        searchPlaces({ q })
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                setSuggestions(Array.isArray(data) ? data : []);
            })
            .catch(() => setSuggestions([]))
            .finally(() => setIsSearching(false));
    }, [debouncedQuery]);

    const handleSuggestionClick = (sugg) => {
        const lat = sugg.lat ?? sugg.latitude;
        const lng = sugg.lng ?? sugg.longitude;
        const name = sugg.name ?? sugg.locationName ?? '';
        const address = sugg.address ?? sugg.addressText ?? '';

        setValue('pickupLocationName', name || address);
        setValue('pickupAddressText', address);
        setValue('pickupLat', lat ?? '');
        setValue('pickupLng', lng ?? '');
        setValue('location', name || address);
        setSearchQuery(name || address);
        setSuggestions([]);
        clearErrors('pickupLocationName');
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
                    {/* Dropdown khu vực (giữ logic cũ để tương thích) */}
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

                    {/* Trường địa chỉ chi tiết + gợi ý từ Vietmap */}
                    <TextField
                        fullWidth
                        label="Địa chỉ chi tiết (tuỳ chọn)"
                        margin="normal"
                        placeholder="VD: KTX Dom A, phòng 402"
                        {...register("pickupAddressText")}
                        value={pickupAddressText}
                        onChange={(e) => {
                            setValue('pickupAddressText', e.target.value);
                            setSearchQuery(e.target.value);
                        }}
                        sx={{
                            "& .MuiInputBase-input": {
                                fontSize: "16px"
                            }
                        }}
                    />
                    {pickupAddressText && suggestions.length > 0 && (
                        <Box
                            sx={{
                                mt: 0.5,
                                maxHeight: 220,
                                overflowY: 'auto',
                                borderRadius: 1,
                                border: '1px solid rgba(148, 163, 184, 0.35)',
                                bgcolor: '#111827',
                            }}
                        >
                            {suggestions.map((sugg, idx) => (
                                <Box
                                    key={`${sugg.id || idx}-${sugg.name || ''}`}
                                    onClick={() => handleSuggestionClick(sugg)}
                                    sx={{
                                        px: 1.5,
                                        py: 1,
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.18)' },
                                        borderBottom: idx < suggestions.length - 1
                                            ? '1px solid rgba(55, 65, 81, 0.6)'
                                            : 'none',
                                    }}
                                >
                                    <Typography fontSize={14} fontWeight={600} color="#e5e7eb">
                                        {sugg.name || sugg.locationName || 'Điểm gợi ý'}
                                    </Typography>
                                    {sugg.address && (
                                        <Typography fontSize={12} color="#9ca3af">
                                            {sugg.address}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                            {isSearching && (
                                <Box sx={{ px: 1.5, py: 1 }}>
                                    <Typography fontSize={12} color="#9ca3af">
                                        Đang tìm kiếm...
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                    {/* Toạ độ lat/lng (có thể được điền tự động từ gợi ý hoặc user nhập tay) */}
                    <Grid container spacing={2} mt={0.5}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Lat"
                                placeholder="21.0135"
                                {...register("pickupLat")}
                                sx={{
                                    "& .MuiInputBase-input": {
                                        fontSize: "16px"
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Lng"
                                placeholder="105.5257"
                                {...register("pickupLng")}
                                sx={{
                                    "& .MuiInputBase-input": {
                                        fontSize: "16px"
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>

                    <Typography fontSize={16} mt={1} color="error">
                        Chỉ hỗ trợ giao dịch trong khu vực Hoà Lạc. Bấm trên bản đồ Vietmap bên dưới để gim vị trí.
                    </Typography>

                    {/* Bản đồ Vietmap (click để gim vị trí) */}
                    <Box
                        id="vietmap-container"
                        sx={{
                            mt: 2,
                            width: '100%',
                            height: 260,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid rgba(148, 163, 184, 0.35)',
                            bgcolor: '#020617',
                        }}
                    />
                    <Typography fontSize={12} mt={0.5} color="#9ca3af">
                        Nếu bản đồ không hiển thị, hãy kiểm tra lại key Vietmap (VITE_VIETMAP_TILE_KEY) hoặc kết nối mạng.
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
                            value="USED_GOOD"
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
                            onClick={handleSaveDraftClick}
                            disabled={savingDraft || submitting}
                            sx={{
                                backgroundColor: "#E0E0E0",
                                color: "#201D26",
                                py: 1.6,
                                fontSize: "18px",
                                fontWeight: 600,
                                borderRadius: "12px",
                                border: "none",
                                "&:hover": { backgroundColor: "#d5d5d5" },
                                "&.Mui-disabled": { opacity: 0.6 },
                            }}
                        >
                            {savingDraft ? 'ĐANG LƯU...' : 'LƯU NHÁP'}
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