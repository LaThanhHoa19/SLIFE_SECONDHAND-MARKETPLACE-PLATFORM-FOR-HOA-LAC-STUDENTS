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
import { searchPlaces, reverseGeocode, getGeoClientConfig, getPlaceByRefId } from '../../api/geoApi';
import useDebounce from '../../hooks/useDebounce';

/** Đại học FPT Hà Nội — khuôn viên Hòa Lạc (mặc định bản đồ đăng tin) */
const FPT_UNIVERSITY_HN_LAT = 21.0135;
const FPT_UNIVERSITY_HN_LNG = 105.5257;
const MAP_DEFAULT_ZOOM = 15;

function truncateUtf(str, maxLen) {
    if (!str || maxLen <= 0) return '';
    const s = String(str);
    if (s.length <= maxLen) return s;
    return `${s.slice(0, maxLen - 1)}…`;
}

/** Gộp tên địa điểm + địa chỉ từ Vietmap thành một dòng hiển thị đầy đủ */
function buildFullAddressLine(nameRaw, addressRaw) {
    const name = (nameRaw || '').trim();
    const addr = (addressRaw || '').trim();
    if (!name) return addr;
    if (!addr) return name;
    const n = name.toLowerCase();
    const a = addr.toLowerCase();
    if (a.includes(n) || n.includes(a)) return addr.length >= name.length ? addr : name;
    return `${name}, ${addr}`;
}

function parseCoord(v) {
    if (v == null || v === '') return NaN;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : NaN;
}

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
            /** Ghi chú không có trên bản đồ (vd: phòng 102) — gửi riêng pickupAddressSupplement, lưu DB ở address_text */
            pickupAddressSupplement: '',
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

    // Tìm kiếm trên bản đồ (tách khỏi địa chỉ từ gim / reverse)
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const debouncedMapQuery = useDebounce(mapSearchQuery, 400);
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);

    const applyReverseToForm = useCallback((data) => {
        if (!data) return;
        const name = (data.locationName || '').trim();
        const addr = (data.addressText || '').trim();
        const line = buildFullAddressLine(name, addr);
        if (!line) return;
        setValue('pickupLocationName', truncateUtf(line, 200));
        setValue('pickupAddressText', line);
    }, [setValue]);

    /** Tile key: ưu tiên VITE_VIETMAP_TILE_KEY; nếu thiếu (chạy local không Docker) lấy từ BE /api/geo/client-config */
    const [vietmapTileKey, setVietmapTileKey] = useState(
        () => (import.meta.env.VITE_VIETMAP_TILE_KEY || '').trim(),
    );

    useEffect(() => {
        if (vietmapTileKey) return;
        let cancelled = false;
        getGeoClientConfig()
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                const key = typeof data?.tileKey === 'string' ? data.tileKey.trim() : '';
                if (!cancelled && key) setVietmapTileKey(key);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [vietmapTileKey]);

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

    // Lưu nháp: chạy qua validation của react-hook-form (cùng rule với đăng tin)
    const handleSaveDraftSubmit = (values) => {
        const finalValues = {
            ...values,
            price: Number(values.price.toString().replace(/\D/g, "")),
        };
        onSaveDraft?.(finalValues, imageFiles);
    };

    const handleSaveDraftClick = (e) => {
        e.preventDefault();
        if (imageFiles.length === 0) {
            setImageError('Vui lòng tải lên ít nhất 1 hình ảnh');
        }
        handleSubmit(handleSaveDraftSubmit)(e);
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

    // Vietmap GL: khởi tạo một lần, mặc định trung tâm ĐH FPT Hà Nội (Hòa Lạc)
    useEffect(() => {
        if (!vietmapTileKey) {
            return;
        }

        let cancelled = false;

        const onMapClick = async (e) => {
            const { lng, lat } = e.lngLat;
            setValue('pickupLat', lat.toFixed(6));
            setValue('pickupLng', lng.toFixed(6));
            try {
                const res = await reverseGeocode({ lat, lng });
                const data = res?.data?.data ?? res?.data;
                if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                    applyReverseToForm(data);
                } else {
                    const fb = buildFullAddressLine('Vị trí đã chọn', `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                    setValue('pickupLocationName', truncateUtf(fb, 200));
                    setValue('pickupAddressText', fb);
                }
            } catch {
                const fb = buildFullAddressLine('Vị trí đã chọn', `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                setValue('pickupLocationName', truncateUtf(fb, 200));
                setValue('pickupAddressText', fb);
            }
        };

        const initMap = () => {
            if (cancelled || mapRef.current || !window.vietmapgl) return;

            const map = new window.vietmapgl.Map({
                container: 'vietmap-container',
                style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${vietmapTileKey}`,
                center: [FPT_UNIVERSITY_HN_LNG, FPT_UNIVERSITY_HN_LAT],
                zoom: MAP_DEFAULT_ZOOM,
            });

            map.addControl(new window.vietmapgl.NavigationControl(), 'top-left');
            map.once('load', () => {
                if (!cancelled) setMapReady(true);
            });
            map.on('click', onMapClick);
            mapRef.current = map;
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
            setMapReady(false);
            if (mapRef.current) {
                try {
                    mapRef.current.remove();
                } catch {
                    /* bỏ qua */
                }
                mapRef.current = null;
            }
            markerRef.current = null;
        };
    }, [vietmapTileKey, setValue, applyReverseToForm]);

    // Đồng bộ marker + camera khi đổi tọa độ (gợi ý tìm kiếm / chỉnh từ nguồn khác)
    useEffect(() => {
        if (!mapReady || !mapRef.current || !window.vietmapgl) return;
        const lat = pickupLat !== '' && pickupLat != null ? Number(pickupLat) : NaN;
        const lng = pickupLng !== '' && pickupLng != null ? Number(pickupLng) : NaN;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const map = mapRef.current;
        map.flyTo({
            center: [lng, lat],
            zoom: Math.max(map.getZoom(), MAP_DEFAULT_ZOOM),
            essential: true,
        });

        if (!markerRef.current) {
            markerRef.current = new window.vietmapgl.Marker()
                .setLngLat([lng, lat])
                .addTo(map);
        } else {
            markerRef.current.setLngLat([lng, lat]);
        }
    }, [pickupLat, pickupLng, mapReady]);

    // Gợi ý địa điểm khi tìm trên bản đồ (bias khu vực FPT Hòa Lạc)
    useEffect(() => {
        const q = debouncedMapQuery.trim();
        if (!q) {
            setSuggestions([]);
            return;
        }
        setIsSearching(true);
        searchPlaces({ q, lat: FPT_UNIVERSITY_HN_LAT, lng: FPT_UNIVERSITY_HN_LNG })
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                setSuggestions(Array.isArray(data) ? data : []);
            })
            .catch(() => setSuggestions([]))
            .finally(() => setIsSearching(false));
    }, [debouncedMapQuery]);

    const handleSuggestionClick = async (sugg) => {
        const name = (sugg.name ?? sugg.locationName ?? '').trim();
        const address = (sugg.address ?? sugg.addressText ?? '').trim();
        const displayFromSearch = (sugg.display ?? '').trim();
        const refId = sugg.ref_id ?? sugg.refId ?? null;

        let lat = parseCoord(sugg.lat ?? sugg.latitude);
        let lng = parseCoord(sugg.lng ?? sugg.longitude);
        let place = null;

        // Search v3 thường chỉ trả ref_id, không có lat/lng — cần Place API
        if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && refId) {
            try {
                const res = await getPlaceByRefId(refId);
                place = res?.data?.data ?? res?.data ?? null;
                lat = parseCoord(place?.lat);
                lng = parseCoord(place?.lng);
            } catch {
                /* bỏ qua */
            }
        }

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const displayFromPlace = place && typeof place.display === 'string' ? place.display.trim() : '';
        const nameP = (place && typeof place.name === 'string' ? place.name : name) || '';
        const addrP = (place && typeof place.address === 'string' ? place.address : address) || '';

        let fullLine =
            displayFromPlace ||
            displayFromSearch ||
            buildFullAddressLine(nameP, addrP);

        if (!fullLine) {
            try {
                const res = await reverseGeocode({ lat, lng });
                const data = res?.data?.data ?? res?.data;
                if (data && typeof data === 'object') {
                    fullLine = buildFullAddressLine(data.locationName, data.addressText);
                }
            } catch {
                /* bỏ qua */
            }
        }

        if (!fullLine) {
            fullLine = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }

        setValue('pickupLat', lat.toFixed(6));
        setValue('pickupLng', lng.toFixed(6));
        setValue('pickupLocationName', truncateUtf(fullLine, 200));
        setValue('pickupAddressText', fullLine);
        setMapSearchQuery(fullLine);
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

                    <input type="hidden" {...register('pickupLat')} />
                    <input type="hidden" {...register('pickupLng')} />
                    <input type="hidden" {...register('pickupAddressText')} />

                    <Typography fontWeight={600} fontSize={16} mt={2} mb={0.75}>
                        Địa chỉ điểm hẹn (từ bản đồ)
                    </Typography>
                    <Box
                        sx={{
                            minHeight: 52,
                            px: 2,
                            py: 1.25,
                            borderRadius: 1,
                            border: '1px solid rgba(148, 163, 184, 0.35)',
                            bgcolor: '#111827',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Typography
                            fontSize={16}
                            color={pickupAddressText ? '#e5e7eb' : '#6b7280'}
                            sx={{ lineHeight: 1.45 }}
                        >
                            {pickupAddressText?.trim()
                                ? pickupAddressText
                                : 'Tìm hoặc bấm trên bản đồ để gim vị trí — địa chỉ đầy đủ sẽ hiện ở đây.'}
                        </Typography>
                    </Box>

                    <TextField
                        fullWidth
                        label="Ghi chú thêm (tuỳ chọn)"
                        margin="normal"
                        placeholder="Chỉ khi không có trên bản đồ, VD: Phòng 102, tầng 3"
                        {...register('pickupAddressSupplement')}
                        sx={{
                            "& .MuiInputBase-input": {
                                fontSize: "16px"
                            }
                        }}
                    />

                    <Typography fontWeight={600} fontSize={16} mt={2} mb={0.75}>
                        Tìm trên bản đồ
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="VD: KTX Đại học FPT, tòa Alpha…"
                        value={mapSearchQuery}
                        onChange={(e) => setMapSearchQuery(e.target.value)}
                        sx={{
                            "& .MuiInputBase-input": {
                                fontSize: "16px"
                            }
                        }}
                    />
                    {(mapSearchQuery.trim() && (suggestions.length > 0 || isSearching)) && (
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

                    <Typography fontSize={15} mt={1.5} color="error">
                        Chỉ hỗ trợ giao dịch trong khu vực Hoà Lạc. Tìm địa điểm hoặc bấm trên bản đồ để gim vị trí (mặc định: ĐH FPT Hà Nội).
                    </Typography>

                    <Box
                        id="vietmap-container"
                        sx={{
                            mt: 2,
                            width: '100%',
                            height: 340,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid rgba(148, 163, 184, 0.35)',
                            bgcolor: '#020617',
                        }}
                    />
                    <Typography fontSize={12} mt={0.5} color="#9ca3af">
                        Nếu bản đồ không hiển thị: kiểm tra VITE_VIETMAP_TILE_KEY, backend dev (vietmap.tileKey / GET /api/geo/client-config), hoặc kết nối mạng.
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