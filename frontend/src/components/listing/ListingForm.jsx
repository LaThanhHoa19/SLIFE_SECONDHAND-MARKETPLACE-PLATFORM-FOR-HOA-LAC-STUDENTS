import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
    Box, Button, TextField, Typography, Grid, MenuItem, Checkbox,
    FormControlLabel, ToggleButton, ToggleButtonGroup, Dialog,
    DialogTitle, List, ListItemButton, ListItemText, IconButton,
    InputAdornment, Stack, Collapse, Alert, LinearProgress,
} from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Icons
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import ImageUploader from '../common/ImageUploader';
import { getCategories } from '../../api/categoryApi';
import { reverseGeocode, getGeoClientConfig } from '../../api/geoApi';
import LocationPicker from './LocationPicker';

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

/** Chuỗi lưu `location_name` / pickupLocationName: 3 cấp user chọn (không dùng reverse từ ghim). */
function buildPickupLocationNameFromAdmin(admin) {
    if (!admin) return '';
    const w = admin.ward?.name?.trim();
    const d = admin.district?.name?.trim();
    const p = admin.province?.name?.trim();
    return [w, d, p].filter(Boolean).join(', ');
}

function parseCoord(v) {
    if (v == null || v === '') return NaN;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : NaN;
}

/** Chuẩn hóa tiếng Việt để so sánh — bỏ dấu, viết thường */
function normalize(str = '') {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

/** Bỏ tiền tố hành chính để so khớp cốt tên (vd. "quan ba dinh" → "ba dinh") */
function canonicalAdminName(s) {
    const t = normalize(String(s || '')).trim();
    if (!t) return '';
    const prefixes = ['thanh pho ', 'tinh ', 'quan ', 'huyen ', 'thi xa ', 'phuong ', 'xa ', 'thi tran '];
    for (const p of prefixes) {
        if (t.startsWith(p)) return t.slice(p.length).trim();
    }
    return t;
}

function isPointInBbox(lat, lng, bbox) {
    if (!bbox || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    const { south, north, west, east } = bbox;
    if (![south, north, west, east].every(Number.isFinite)) return false;
    return lat >= south && lat <= north && lng >= west && lng <= east;
}

/** Nominatim: boundingbox = [south, north, west, east] */
function parseNominatimBbox(first) {
    const bb = first?.boundingbox;
    if (!Array.isArray(bb) || bb.length < 4) return null;
    const south = parseFloat(bb[0]);
    const north = parseFloat(bb[1]);
    const west = parseFloat(bb[2]);
    const east = parseFloat(bb[3]);
    if (![south, north, west, east].every(Number.isFinite)) return null;
    return { south, north, west, east };
}

/** Bỏ tiền tố Phường/Xã/Thị trấn (Unicode) — Nominatim thường index "Phúc Xá" không có "Phường" */
function stripVnWardDistrictPrefix(raw) {
    const t = String(raw || '').trim();
    if (!t) return '';
    return t.replace(/^(Phường|Xã|Thị trấn|Quận|Huyện|Thị xã|Thành phố)\s+/iu, '').trim();
}

/**
 * Nhiều phường VN trong data địa giới không khớp OSM → thử variant rồi fallback quận/tỉnh.
 * Thứ tự quan trọng: Nominatim thường trả [] với "…, Thành phố Hà Nội, Việt Nam" đủ cấp;
 * query ngắn (xã + Hà Nội) + countrycodes=vn mới trúng ranh giới đúng.
 * @returns {{ query: string, level: 'ward'|'district'|'province' }[]}
 */
function buildNominatimQueryCandidates(admin) {
    const ward = admin?.ward?.name?.trim();
    const district = admin?.district?.name?.trim();
    const province = admin?.province?.name?.trim();
    const tail = 'Việt Nam';
    const raw = [];
    const seen = new Set();
    const add = (parts, level) => {
        const query = parts.filter(Boolean).join(', ');
        if (!query || seen.has(query)) return;
        seen.add(query);
        raw.push({ query, level });
    };

    const provinceShort = province ? (stripVnWardDistrictPrefix(province) || province) : '';
    const districtShort = district ? (stripVnWardDistrictPrefix(district) || district) : '';
    const w2 = ward ? stripVnWardDistrictPrefix(ward) : '';

    if (ward && provinceShort) {
        add([ward, provinceShort, tail], 'ward');
        if (w2 && w2 !== ward) add([w2, provinceShort, tail], 'ward');
    }
    if (ward && district && provinceShort) {
        add([ward, districtShort, provinceShort, tail], 'ward');
        add([ward, district, provinceShort, tail], 'ward');
        if (w2 && w2 !== ward) {
            add([w2, districtShort, provinceShort, tail], 'ward');
            add([w2, district, provinceShort, tail], 'ward');
        }
    }
    if (ward && district && province) {
        add([ward, district, province, tail], 'ward');
        if (w2 && w2 !== ward) add([w2, district, province, tail], 'ward');
    }
    if (district && province) {
        add([district, province, tail], 'district');
        const d2 = stripVnWardDistrictPrefix(district);
        if (d2 && d2 !== district) add([d2, province, tail], 'district');
    }
    if (province) {
        add([province, tail], 'province');
        const p2 = stripVnWardDistrictPrefix(province);
        if (p2 && p2 !== province) add([p2, tail], 'province');
    }
    return raw;
}

/**
 * Nominatim trả về nhiều kết quả gần nghĩa (vd. "Thạch Thất" trùng huyện + xã).
 * Với query cấp xã, chỉ chấp nhận kết quả có display_name chứa cốt tên xã đã chọn.
 */
function nominatimDisplayMatchesChosenWard(displayName, wardName) {
    const w = String(wardName || '').trim();
    if (!w) return true;
    let core = canonicalAdminName(normalize(w));
    if (!core) core = normalize(w).trim();
    if (core.length < 4) return true;
    const d = normalize(displayName || '');
    return d.includes(core);
}

const NOMINATIM_HEADERS = {
    Accept: 'application/json',
    'Accept-Language': 'vi,en',
    'User-Agent': 'SLIFE-Marketplace/1.0 (listing geocode; contact: dev)',
};

/** Tuần tự + delay (policy Nominatim ~1 req/giây) */
async function fetchNominatimFirstHit(candidates, { signal, wardName } = {}) {
    for (let i = 0; i < candidates.length; i++) {
        if (signal?.aborted) return null;
        if (i > 0) {
            await new Promise((r) => setTimeout(r, 1100));
            if (signal?.aborted) return null;
        }
        const { query, level } = candidates[i];
        const useWardFilter = level === 'ward' && String(wardName || '').trim().length > 0;
        const limit = useWardFilter ? 15 : 1;
        const params = new URLSearchParams({
            q: query,
            format: 'json',
            limit: String(limit),
            countrycodes: 'vn',
        });
        const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        const res = await fetch(url, { headers: NOMINATIM_HEADERS, signal });
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];
        const first = useWardFilter
            ? arr.find((item) => nominatimDisplayMatchesChosenWard(item?.display_name, wardName))
            : arr[0];
        if (first) return { first, query, level };
    }
    return null;
}

/**
 * Ghim hợp lệ nếu: nằm trong bbox xã đã chọn (Nominatim), HOẶC khớp tỉnh + quận/huyện từ reverse/địa chỉ.
 * Không bắt buộc khớp tên xã/phường: Vietmap/OSM thường đổi cột hoặc tên xã lệch với dropdown địa giới VN.
 */
function computePinValidity({
                                lat, lng, addressText, reverseProvince, reverseDistrict, reverseWard, admin, adminBbox,
                            }) {
    if (!admin) {
        return {
            isValid: true,
            provinceMatch: true,
            districtMatch: true,
            wardMatch: true,
            bboxInside: false,
        };
    }
    const chosenProvince = normalize(admin.province?.name || '');
    const chosenDistrict = normalize(admin.district?.name || '');
    const chosenWard = normalize(admin.ward?.name || '');
    const addrNorm = normalize(addressText || '');
    const revPN = normalize(reverseProvince || '');
    const revDN = normalize(reverseDistrict || '');
    const revWN = normalize(reverseWard || '');

    const provCore = canonicalAdminName(chosenProvince) || chosenProvince.replace(/^tinh\s+/, '').replace(/^thanh pho\s+/, '').trim();
    const distCore = canonicalAdminName(chosenDistrict) || chosenDistrict;
    const wardCore = canonicalAdminName(chosenWard) || chosenWard;
    const revWardCore = canonicalAdminName(revWN);

    /** Tránh "ba dinh".includes("ba") — chỉ cho phép hay chứa needle khi needle đủ dài */
    const safeIncludes = (hay, needle) => needle.length >= 4 && hay.includes(needle);

    const provinceMatch = !chosenProvince || (
        (revPN.length >= 3 && (
            revPN.includes(chosenProvince) ||
            safeIncludes(chosenProvince, revPN) ||
            (provCore.length >= 3 && (revPN.includes(provCore) || safeIncludes(provCore, revPN)))
        )) ||
        (provCore.length >= 3 && addrNorm.includes(provCore))
    );

    const revDistCore = canonicalAdminName(revDN);
    const districtMatch = !chosenDistrict || (
        (revDN.length >= 3 && (
            revDN.includes(distCore) ||
            safeIncludes(distCore, revDN) ||
            (revDistCore.length >= 3 && (
                revDistCore.includes(distCore) ||
                safeIncludes(distCore, revDistCore)
            ))
        )) ||
        (distCore.length >= 3 && addrNorm.includes(distCore))
    );

    const wardMatch = !chosenWard || (
        (revWN.length >= 3 && (
            revWN.includes(wardCore) ||
            safeIncludes(wardCore, revWN) ||
            (revWardCore.length >= 3 && (
                revWardCore.includes(wardCore) ||
                safeIncludes(wardCore, revWardCore)
            ))
        )) ||
        (wardCore.length >= 3 && addrNorm.includes(wardCore))
    );

    const bboxInside = !!(adminBbox && isPointInBbox(lat, lng, adminBbox));
    const adminMatchProvinceDistrict = provinceMatch && districtMatch;
    const isValid = bboxInside || adminMatchProvinceDistrict;

    return { isValid, provinceMatch, districtMatch, wardMatch, bboxInside };
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

/** Fallback OSM Reverse Geocode khi Vietmap API key backend chưa có */
async function fetchOsmReverse(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
        const data = await res.json();
        if (!data || !data.address) return null;

        const ad = data.address;
        const province = ad.city || ad.province || ad.state || '';
        const district = ad.county || ad.district || ad.city_district || ad.town || '';
        const ward = ad.suburb || ad.village || ad.quarter || '';
        const name = data.name || ad.road || '';

        const parts = [name, ward, district, province].filter(Boolean);
        const addressText = parts.join(', ');

        return { province, district, ward, addressText };
    } catch {
        return null;
    }
}

// SVG hình gim bản đồ — màu vàng khi pending
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
  <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 28 12 28S28 21 28 12c0-6.627-5.373-12-12-12z" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
  <circle cx="16" cy="12" r="5" fill="#ffffff"/>
</svg>`;

function createPinElement() {
    const el = document.createElement('div');
    el.style.cssText = 'width:32px;height:40px;cursor:pointer;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.45));';
    el.innerHTML = PIN_SVG;
    return el;
}

/** Tiêu đề section kiểu Stitch (vạch tím trái). */
function CreateStudioSectionTitle({ title, subtitle, right }) {
    return (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                <Box sx={{ width: 4, minHeight: 28, borderRadius: 1, bgcolor: '#9D6EED', flexShrink: 0, mt: 0.35 }} />
                <Box>
                    <Typography fontWeight={800} fontSize={{ xs: 16, sm: 18 }} color="#f8fafc" letterSpacing="-0.02em">
                        {title}
                    </Typography>
                    {subtitle ? (
                        <Typography fontSize={12} color="rgba(248,250,252,0.42)" sx={{ mt: 0.25 }}>
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
            </Stack>
            {right}
        </Stack>
    );
}

export default function ListingForm({
                                        defaultValues = {},
                                        onSubmit,
                                        onSaveDraft,
                                        submitting = false,
                                        savingDraft = false,
                                        mode = 'create',
                                        /** Override label cho nút submit (vd: trang bản nháp muốn "Đăng tin"). */
                                        submitLabel,
                                        /** Chế độ sửa: URL ảnh đã lưu (hiển thị + tính đủ điều kiện có ít nhất 1 ảnh). */
                                        existingImageUrls = [],
                                        /** Tối đa ảnh / tin (từ GET /api/listings/form-config), áp ngay khi chọn file. */
                                        maxImagesPerPost = 10,
                                        /** Lỗi từ API sau submit (hiển thị trong form, có thể cuộn tới ảnh). */
                                        serverSubmitError = '',
                                        /** 'images' = báo ngay tại khối ảnh + cuộn tới; 'top' = phía trên form. */
                                        serverSubmitErrorPlacement = 'top',
                                        onDismissServerSubmitError,
                                        /** 'createStudio' — layout 2 cột + sidebar bước (đăng tin / sửa tin / nháp). */
                                        layoutVariant = 'default',
                                        /** Tiêu đề sidebar studio; mặc định theo mode. */
                                        studioSidebarTitle,
                                    }) {
    const [imageFiles, setImageFiles] = useState([]);
    const [imageError, setImageError] = useState('');
    const imageSectionRef = useRef(null);
    const formTopRef = useRef(null);
    const [categories, setCategories] = useState([]);
    const [openCategory, setOpenCategory] = useState(false);
    const [expandedCatId, setExpandedCatId] = useState(null);

    // Admin location — state cho UI, ref cho click handler (tránh closure stale)
    const [adminLocation, setAdminLocation] = useState(null);
    const adminLocationRef = useRef(null);
    /** Bbox quận/huyện (hoặc phường) từ Nominatim — ưu tiên khi so với reverse chỉ có tên phường */
    const adminBboxRef = useRef(null);
    const pendingFlyToRef = useRef(null);

    // Pending pin: chờ user xác nhận hoặc từ chối
    const [pendingPin, setPendingPin] = useState(null); // { lat, lng, addressText, districtHint? }
    const [pinStatus, setPinStatus] = useState('idle'); // 'idle' | 'valid' | 'invalid'

    // Map
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef(null);
    const markerRef = useRef(null);       // marker đã xác nhận (đỏ mặc định Vietmap)
    const pendingMarkerRef = useRef(null); // marker đang chờ xác nhận (vàng SVG)

    const { register, handleSubmit, watch, setValue, clearErrors, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            description: '',
            price: '',
            condition: 'USED_GOOD',
            isGiveaway: false,
            categoryId: '',
            categoryName: '',
            pickupAddressId: null,
            pickupLocationName: '',
            pickupAddressText: '',
            pickupAddressSupplement: '',
            pickupLat: '',
            pickupLng: '',
            pickupProvince: '',
            pickupDistrict: '',
            pickupWard: '',
            ...defaultValues,
        },
    });

    const isGiveaway = watch('isGiveaway');
    const selectedCategoryId = watch('categoryId');
    const selectedCategoryName = watch('categoryName');
    const currentCondition = watch('condition');
    const descriptionValue = watch('description') || '';
    const titleValue = watch('title') || '';
    const pickupAddressText = watch('pickupAddressText');
    const pickupLocationNameW = watch('pickupLocationName');
    const pickupLat = watch('pickupLat');
    const pickupLng = watch('pickupLng');
    const watchedPrice = watch('price');

    const isStudioLayout = layoutVariant === 'createStudio';
    const hasListingImages = imageFiles.length > 0 || (existingImageUrls?.length > 0);
    const studioHeading = studioSidebarTitle ?? (mode === 'create' ? 'Đăng tin mới' : 'Chỉnh sửa tin đăng');
    const studioSubmitPrimaryText = submitting
        ? 'Đang xử lý...'
        : (submitLabel
            ? (String(submitLabel).trim().toLowerCase() === 'đăng tin' ? 'Đăng tin' : String(submitLabel).trim())
            : (mode === 'create' ? 'Đăng tin ngay' : 'Cập nhật'));

    const draftListingScore = useMemo(() => {
        if (!isStudioLayout) return 0;
        let p = 0;
        if (hasListingImages) p += 17;
        if (titleValue.trim().length >= 2) p += 17;
        if (selectedCategoryName) p += 17;
        const words = descriptionValue.trim().split(/\s+/).filter(Boolean).length;
        if (words >= 10) p += 17;
        if (pickupLat && pickupLng) p += 17;
        const num = Number(String(watchedPrice || '').replace(/\D/g, ''));
        /* 17×5 + 15 = 100 (trước đây +12 nên tối đa chỉ 97%) */
        if (isGiveaway || (num >= 1000 && num < 1000000000)) p += 15;
        return Math.min(100, p);
    }, [isStudioLayout, hasListingImages, titleValue, selectedCategoryName, descriptionValue, pickupLat, pickupLng, isGiveaway, watchedPrice]);

    /** Bước 02 sidebar: khớp phụ đề (tiêu đề, danh mục, giá, mô tả) và rule validate form */
    const productDetailsStepComplete = useMemo(() => {
        if (titleValue.trim().length < 2 || !selectedCategoryName) return false;
        const words = descriptionValue.trim().split(/\s+/).filter(Boolean).length;
        if (words < 10) return false;
        if (isGiveaway) return true;
        const num = Number(String(watchedPrice || '').replace(/\D/g, ''));
        return num >= 1000 && num < 1000000000;
    }, [titleValue, selectedCategoryName, descriptionValue, isGiveaway, watchedPrice]);

    /** Tile key */
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
        return () => { cancelled = true; };
    }, [vietmapTileKey]);

    // Fetch danh mục
    useEffect(() => {
        getCategories()
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                setCategories(Array.isArray(data) ? data : []);
            })
            .catch(() => setCategories([]));
    }, []);

    // Khi vào trang sửa: backend GET /api/listings/{id} trả category = {id,name,parentId}
    // Mapper FE có thể chỉ set categoryName = tên con; ở đây suy ra nhãn "Cha > Con" từ cây danh mục.
    useEffect(() => {
        if (!selectedCategoryId) return;
        if (!Array.isArray(categories) || categories.length === 0) return;

        const idStr = String(selectedCategoryId);
        const byId = new Map();
        categories.forEach((c) => {
            const id = c?.id ?? c?.categoryId;
            if (id != null) byId.set(String(id), c);
        });

        const chain = [];
        let cur = byId.get(idStr);
        let guard = 0;
        while (cur && guard++ < 10) {
            const name = (cur?.name ?? '').trim();
            if (name) chain.push(name);
            const pid = cur?.parentId ?? cur?.parent_id ?? null;
            if (pid == null) break;
            cur = byId.get(String(pid));
        }
        if (chain.length === 0) return;
        const label = chain.reverse().join(' > ');

        const current = String(selectedCategoryName || '').trim();
        // Chỉ auto-fill nếu đang rỗng hoặc chỉ có tên con (không có dấu '>').
        if (!current || (!current.includes('>') && current !== label)) {
            setValue('categoryName', label, { shouldDirty: false });
        }
    }, [categories, selectedCategoryId, selectedCategoryName, setValue]);

    // Đồng bộ ref khi adminLocation state thay đổi
    useEffect(() => {
        adminLocationRef.current = adminLocation;
    }, [adminLocation]);

    // Khi chọn khu vực: bbox (validate ghim) + flyTo + reset pending pin
    useEffect(() => {
        if (!adminLocation) {
            adminBboxRef.current = null;
            return;
        }
        setPendingPin(null);
        setPinStatus('idle');
        if (pendingMarkerRef.current) {
            pendingMarkerRef.current.remove();
            pendingMarkerRef.current = null;
        }
        const candidates = buildNominatimQueryCandidates(adminLocation);
        const ac = new AbortController();
        let cancelled = false;

        (async () => {
            try {
                const hit = await fetchNominatimFirstHit(candidates, {
                    signal: ac.signal,
                    wardName: adminLocation?.ward?.name,
                });
                if (cancelled) return;
                if (!hit) {
                    adminBboxRef.current = null;
                    if (import.meta.env.DEV) {
                        // eslint-disable-next-line no-console
                        console.warn('Nominatim không tìm thấy với các query:', candidates.map((c) => c.query));
                    }
                    return;
                }
                const { first, level } = hit;
                const bbox = parseNominatimBbox(first);
                adminBboxRef.current = bbox;
                const lat = parseFloat(first.lat);
                const lng = parseFloat(first.lon);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                const zoom = level === 'ward' ? 14 : level === 'district' ? 13 : 11;
                const fly = { center: [lng, lat], zoom, essential: true };
                if (mapRef.current) {
                    mapRef.current.flyTo(fly);
                } else {
                    pendingFlyToRef.current = fly;
                }
            } catch (e) {
                if (cancelled || e?.name === 'AbortError') return;
                adminBboxRef.current = null;
                console.error('Nominatim error:', e);
            }
        })();

        return () => {
            cancelled = true;
            ac.abort();
        };
    }, [adminLocation]);

    // Giá khi bật/tắt "Cho tặng" — không xóa giá lần đầu trên trang sửa (giá đã load từ API)
    const prevGiveawayRef = useRef(null);
    useEffect(() => {
        if (mode === 'edit') {
            if (prevGiveawayRef.current === null) {
                prevGiveawayRef.current = isGiveaway;
                return;
            }
            if (prevGiveawayRef.current !== isGiveaway) {
                if (isGiveaway) {
                    setValue('price', '0');
                    clearErrors('price');
                } else {
                    setValue('price', '');
                }
                prevGiveawayRef.current = isGiveaway;
            }
            return;
        }
        if (isGiveaway) {
            setValue('price', '0');
            clearErrors('price');
        } else {
            setValue('price', '');
        }
    }, [isGiveaway, setValue, clearErrors, mode]);

    const formatPrice = (value) => {
        if (value == null || value === '') return '';
        if (value === '0' || value === 0) return '0';
        const digits = String(value).replace(/\D/g, '');
        if (!digits) return '';
        return Number(digits).toLocaleString('vi-VN');
    };

    const handleFormSubmit = (values) => {
        const finalValues = {
            ...values,
            price: Number(values.price.toString().replace(/\D/g, ""))
        };
        onSubmit?.(finalValues, imageFiles);
    };

    const handleSaveDraftSubmit = (values) => {
        const finalValues = {
            ...values,
            price: Number(values.price.toString().replace(/\D/g, "")),
        };
        onSaveDraft?.(finalValues, imageFiles);
    };

    const handleSaveDraftClick = (e) => {
        e.preventDefault();
        if (mode !== 'create') return;
        if (imageFiles.length === 0) {
            setImageError('Vui lòng tải lên ít nhất 1 hình ảnh');
        }
        handleSubmit(handleSaveDraftSubmit)(e);
    };

    const hasAtLeastOneImage =
        imageFiles.length > 0 || (mode === 'edit' && Array.isArray(existingImageUrls) && existingImageUrls.length > 0);

    const handleFilesChange = useCallback((files) => {
        setImageFiles(files);
        if (files.length > 0) setImageError('');
        onDismissServerSubmitError?.();
    }, [onDismissServerSubmitError]);

    useEffect(() => {
        if (!serverSubmitError) return;
        const t = window.setTimeout(() => {
            const el =
                serverSubmitErrorPlacement === 'images' ? imageSectionRef.current : formTopRef.current;
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
        return () => window.clearTimeout(t);
    }, [serverSubmitError, serverSubmitErrorPlacement]);

    const onFormSubmit = (e) => {
        e.preventDefault();
        handleSubmit(
            (values) => {
                if (!hasAtLeastOneImage) {
                    setImageError('Vui lòng tải lên ít nhất 1 hình ảnh');
                    imageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    return;
                }
                handleFormSubmit(values);
            },
            () => {
                if (!hasAtLeastOneImage) {
                    setImageError('Vui lòng tải lên ít nhất 1 hình ảnh');
                }
            }
        )(e);
    };

    // ── Vietmap GL: khởi tạo MỘT LẦN (không có adminLocation trong deps) ──
    useEffect(() => {
        if (!vietmapTileKey) return;

        let cancelled = false;

        const onMapClick = async (e) => {
            const { lng, lat } = e.lngLat;

            // Hiển thị marker vàng ngay lập tức
            if (!cancelled) {
                if (pendingMarkerRef.current) {
                    pendingMarkerRef.current.setLngLat([lng, lat]);
                } else if (mapRef.current && window.vietmapgl) {
                    pendingMarkerRef.current = new window.vietmapgl.Marker({
                        element: createPinElement(),
                        anchor: 'bottom',
                    })
                        .setLngLat([lng, lat])
                        .addTo(mapRef.current);
                }
                setPendingPin(null);
                setPinStatus('idle');
            }

            // Reverse geocode
            let addressText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            let reverseProvince = '';
            let reverseDistrict = '';
            let reverseWard = '';
            try {
                const res = await reverseGeocode({ lat, lng });
                const data = res?.data?.data ?? res?.data;
                if (data && typeof data === 'object') {
                    const name = (data.locationName || '').trim();
                    const addr = (data.addressText || '').trim();
                    const line = buildFullAddressLine(name, addr);
                    if (line) addressText = line;
                    reverseProvince = (data.province || data.city || '').trim();
                    reverseDistrict = (data.district || '').trim();
                    reverseWard = (data.ward || '').trim();
                }
            } catch { /* ignore */ }

            // Fallback OSM nếu Vietmap backend không trả province (vd: thiếu API key)
            if (!reverseProvince) {
                const osm = await fetchOsmReverse(lat, lng);
                if (osm) {
                    reverseProvince = osm.province;
                    reverseDistrict = osm.district;
                    reverseWard = osm.ward || '';
                    if (addressText === `${lat.toFixed(5)}, ${lng.toFixed(5)}` && osm.addressText) {
                        addressText = osm.addressText;
                    }
                }
            } else {
                const admPeek = adminLocationRef.current;
                if (admPeek?.ward?.name) {
                    const osm = await fetchOsmReverse(lat, lng);
                    if (osm?.ward) reverseWard = osm.ward;
                }
            }

            if (cancelled) return;

            // Đọc adminLocation từ ref (không bị stale closure)
            const currentAdmin = adminLocationRef.current;

            if (!currentAdmin) {
                // Chưa chọn khu vực — cho gim tự do
                setPendingPin({ lat, lng, addressText });
                setPinStatus('valid');
                return;
            }

            const {
                isValid,
                provinceMatch,
                districtMatch,
                wardMatch,
                bboxInside,
            } = computePinValidity({
                lat,
                lng,
                addressText,
                reverseProvince,
                reverseDistrict,
                reverseWard,
                admin: currentAdmin,
                adminBbox: adminBboxRef.current,
            });

            if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.log('===== DEBUG VALIDATION =====', {
                    chosen: `${normalize(currentAdmin.province?.name || '')} | ${normalize(currentAdmin.district?.name || '')} | ${normalize(currentAdmin.ward?.name || '')}`,
                    reverse: `${normalize(reverseProvince)} | ${normalize(reverseDistrict)} | ${normalize(reverseWard)}`,
                    address: normalize(addressText),
                    provinceMatch,
                    districtMatch,
                    wardMatch,
                    bboxInside,
                    isValid,
                });
            }

            setPendingPin({
                lat, lng, addressText,
                districtHint: isValid ? null : currentAdmin.district?.name,
            });
            setPinStatus(isValid ? 'valid' : 'invalid');
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
            // GPS GeolocateControl (nếu browser hỗ trợ)
            if (window.vietmapgl.GeolocateControl) {
                map.addControl(
                    new window.vietmapgl.GeolocateControl({
                        positionOptions: { enableHighAccuracy: true },
                        trackUserLocation: false,
                        showAccuracyCircle: false,
                    }),
                    'top-left'
                );
            }
            map.once('load', () => {
                if (cancelled) return;
                setMapReady(true);
                const pending = pendingFlyToRef.current;
                if (pending && mapRef.current) {
                    mapRef.current.flyTo(pending);
                    pendingFlyToRef.current = null;
                }
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
                try { mapRef.current.remove(); } catch { /* bỏ qua */ }
                mapRef.current = null;
            }
            markerRef.current = null;
            pendingMarkerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vietmapTileKey]); // Chỉ khởi tạo lại khi key thay đổi; adminLocation đọc qua ref

    // Đồng bộ marker xác nhận + camera
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

    // Xác nhận pin hợp lệ → ghi vào form
    const handleConfirmPin = useCallback(() => {
        if (!pendingPin) return;
        const { lat, lng, addressText } = pendingPin;
        setValue('pickupLat', lat.toFixed(6));
        setValue('pickupLng', lng.toFixed(6));
        const admin = adminLocationRef.current;
        const fromAdmin = buildPickupLocationNameFromAdmin(admin);
        // DB: location_name = 3 cấp đã chọn; ghim chỉ cần lat/lng (không đổ reverse vào location_name)
        const locationName = fromAdmin
            ? truncateUtf(fromAdmin, 200)
            : truncateUtf(addressText, 200);
        setValue('pickupLocationName', locationName);
        setValue('pickupAddressText', '');
        if (admin) {
            setValue('pickupProvince', admin.province?.name || '');
            setValue('pickupDistrict', admin.district?.name || '');
            setValue('pickupWard', admin.ward?.name || '');
        }
        clearErrors(['pickupLocationName', 'pickupLat']);
        // Chuyển marker pending → marker đỏ xác nhận
        if (pendingMarkerRef.current) {
            pendingMarkerRef.current.remove();
            pendingMarkerRef.current = null;
        }
        if (mapRef.current && window.vietmapgl) {
            if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
            else markerRef.current = new window.vietmapgl.Marker().setLngLat([lng, lat]).addTo(mapRef.current);
        }
        setPendingPin(null);
        setPinStatus('idle');
    }, [pendingPin, setValue, clearErrors]);

    const handleRetryPin = useCallback(() => {
        setPendingPin(null);
        setPinStatus('idle');
        if (pendingMarkerRef.current) {
            pendingMarkerRef.current.remove();
            pendingMarkerRef.current = null;
        }
    }, []);

    // GPS: lấy vị trí thiết bị → chạy qua validation giống map click
    const [gpsLoading, setGpsLoading] = useState(false);
    const handleGpsClick = useCallback(async () => {
        if (!navigator.geolocation) { alert('Trình duyệt không hỗ trợ GPS.'); return; }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setGpsLoading(false);
                mapRef.current?.flyTo({ center: [lng, lat], zoom: 17, essential: true });
                if (pendingMarkerRef.current) {
                    pendingMarkerRef.current.setLngLat([lng, lat]);
                } else if (mapRef.current && window.vietmapgl) {
                    pendingMarkerRef.current = new window.vietmapgl.Marker({
                        element: createPinElement(), anchor: 'bottom',
                    }).setLngLat([lng, lat]).addTo(mapRef.current);
                }
                setPendingPin(null); setPinStatus('idle');
                let addressText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                let reverseProvince = '';
                let reverseDistrict = '';
                let reverseWard = '';
                try {
                    const res = await reverseGeocode({ lat, lng });
                    const data = res?.data?.data ?? res?.data;
                    if (data && typeof data === 'object') {
                        const line = buildFullAddressLine((data.locationName || '').trim(), (data.addressText || '').trim());
                        if (line) addressText = line;
                        reverseProvince = (data.province || data.city || '').trim();
                        reverseDistrict = (data.district || '').trim();
                        reverseWard = (data.ward || '').trim();
                    }
                } catch { /* ignore */ }

                if (!reverseProvince) {
                    const osm = await fetchOsmReverse(lat, lng);
                    if (osm) {
                        reverseProvince = osm.province;
                        reverseDistrict = osm.district;
                        reverseWard = osm.ward || '';
                        if (addressText === `${lat.toFixed(5)}, ${lng.toFixed(5)}` && osm.addressText) {
                            addressText = osm.addressText;
                        }
                    }
                } else {
                    const admPeek = adminLocationRef.current;
                    if (admPeek?.ward?.name) {
                        const osm = await fetchOsmReverse(lat, lng);
                        if (osm?.ward) reverseWard = osm.ward;
                    }
                }
                const currentAdmin = adminLocationRef.current;
                if (!currentAdmin) { setPendingPin({ lat, lng, addressText }); setPinStatus('valid'); return; }

                const {
                    isValid,
                    provinceMatch,
                    districtMatch,
                    wardMatch,
                    bboxInside,
                } = computePinValidity({
                    lat,
                    lng,
                    addressText,
                    reverseProvince,
                    reverseDistrict,
                    reverseWard,
                    admin: currentAdmin,
                    adminBbox: adminBboxRef.current,
                });

                if (import.meta.env.DEV) {
                    // eslint-disable-next-line no-console
                    console.log('===== DEBUG GPS VALIDATION =====', {
                        chosen: `${normalize(currentAdmin.province?.name || '')} | ${normalize(currentAdmin.district?.name || '')} | ${normalize(currentAdmin.ward?.name || '')}`,
                        reverse: `${normalize(reverseProvince)} | ${normalize(reverseDistrict)} | ${normalize(reverseWard)}`,
                        address: normalize(addressText),
                        provinceMatch,
                        districtMatch,
                        wardMatch,
                        bboxInside,
                        isValid,
                    });
                }

                setPendingPin({ lat, lng, addressText, districtHint: isValid ? null : currentAdmin.district?.name });
                setPinStatus(isValid ? 'valid' : 'invalid');
            },
            (err) => { setGpsLoading(false); alert(`Không lấy được GPS: ${err.message}`); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    const outerFormSx = isStudioLayout
        ? {
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            width: '100%',
            maxWidth: '100%',
            mx: 0,
            mt: { xs: 2, md: 3 },
            mb: 6,
            px: { xs: 1, md: 2 },
            alignItems: 'flex-start',
            bgcolor: 'transparent',
            color: '#f8fafc',
            border: 'none',
            boxShadow: 'none',
            p: 0,
        }
        : {
            maxWidth: '680px',
            width: '100%',
            mx: 'auto',
            mt: 4,
            mb: 6,
            p: 3.5,
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            backgroundColor: '#201D26',
            color: '#FFFFFF',
            '& .MuiInputBase-root': { backgroundColor: '#312F37', color: '#fff' },
            '& .MuiInputBase-input': { color: '#fff' },
        };

    /** Cùng palette form tin đăng mặc định (#201D26 / #312F37) — khớp MainLayout #141225 */
    const innerPanelSx = isStudioLayout
        ? {
            flex: 1,
            minWidth: 0,
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
            bgcolor: '#201D26',
            p: { xs: 2.5, md: 3.5 },
            '& .MuiInputBase-root': { backgroundColor: '#312F37', color: '#fff' },
            '& .MuiInputBase-input': { color: '#fff' },
            '& input:-webkit-autofill, & textarea:-webkit-autofill': {
                WebkitBoxShadow: '0 0 0 1000px #312F37 inset',
                WebkitTextFillColor: '#fff',
                caretColor: '#fff',
            },
        }
        : {};

    const stepDone = (ok) => (
        ok
            ? <CheckCircleIcon sx={{ color: '#9D6EED', fontSize: 22, flexShrink: 0 }} />
            : (
                <Box
                    sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: '2px solid rgba(148,163,184,0.35)',
                        flexShrink: 0,
                    }}
                />
            )
    );

    return (
        <Box component="form" onSubmit={onFormSubmit} sx={outerFormSx}>
            {isStudioLayout ? (
                <Box
                    sx={{
                        width: { xs: '100%', md: 272 },
                        flexShrink: 0,
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        bgcolor: '#201D26',
                        p: 2.5,
                        position: { md: 'sticky' },
                        top: { md: 24 },
                        alignSelf: 'flex-start',
                    }}
                >
                    <Typography fontWeight={800} fontSize={20} color="#f8fafc" mb={2.5} letterSpacing="-0.03em">
                        {studioHeading}
                    </Typography>
                    <Stack spacing={2} sx={{ mb: 3 }}>
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                            {stepDone(hasListingImages)}
                            <Box>
                                <Typography fontWeight={700} fontSize={13} color="#e2e8f0">01 · Ảnh sản phẩm</Typography>
                                <Typography fontSize={11} color="rgba(248,250,252,0.38)">Tải hình minh họa</Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                            {stepDone(productDetailsStepComplete)}
                            <Box>
                                <Typography fontWeight={700} fontSize={13} color="#e2e8f0">02 · Chi tiết sản phẩm</Typography>
                                <Typography fontSize={11} color="rgba(248,250,252,0.38)">Tiêu đề, danh mục, giá, mô tả</Typography>
                            </Box>
                        </Stack>
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                            {stepDone(!!pickupLat && !!pickupLng)}
                            <Box>
                                <Typography fontWeight={700} fontSize={13} color="#e2e8f0">03 · Địa điểm giao dịch</Typography>
                                <Typography fontSize={11} color="rgba(248,250,252,0.38)">Khu vực · bản đồ</Typography>
                            </Box>
                        </Stack>
                    </Stack>
                    <Box
                        sx={{
                            borderRadius: '12px',
                            border: '1px solid rgba(157,110,237,0.25)',
                            bgcolor: 'rgba(157,110,237,0.06)',
                            p: 1.75,
                        }}
                    >
                        <Typography fontSize={10} fontWeight={700} color="rgba(199,183,246,0.85)" letterSpacing="0.12em" mb={1}>
                            BẢN NHÁP
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
                            <Typography fontSize={12} color="rgba(248,250,252,0.65)">Độ đầy đủ</Typography>
                            <Typography fontSize={13} fontWeight={800} color="#c4b5fd">{draftListingScore}%</Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={draftListingScore}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(148,163,184,0.15)',
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    background: 'linear-gradient(90deg, #9D6EED, #7c3aed)',
                                },
                            }}
                        />
                        <Typography fontSize={11} color="rgba(248,250,252,0.4)" sx={{ mt: 1, fontStyle: 'italic' }}>
                            Hoàn thành các mục để tin dễ được xem hơn.
                        </Typography>
                    </Box>
                </Box>
            ) : null}

            <Box sx={{ width: '100%', ...innerPanelSx }}>
                <Box sx={{ width: '100%', ...(isStudioLayout ? { display: 'flex', flexDirection: 'column', gap: 3 } : {}) }}>
                    <Box
                        ref={formTopRef}
                        sx={{ mb: serverSubmitError && serverSubmitErrorPlacement === 'top' ? 2 : 0, order: isStudioLayout ? 0 : 0 }}
                    >
                        {serverSubmitError && serverSubmitErrorPlacement === 'top' ? (
                            <Alert
                                severity="error"
                                onClose={() => onDismissServerSubmitError?.()}
                                sx={{
                                    mb: 0,
                                    bgcolor: 'rgba(211,47,47,0.12)',
                                    color: '#ffcdd2',
                                    border: '1px solid rgba(244,67,54,0.35)',
                                    '& .MuiAlert-icon': { color: '#ef5350' },
                                }}
                            >
                                {serverSubmitError}
                            </Alert>
                        ) : null}
                    </Box>

                    {/* 1. HÌNH ẢNH */}
                    <Box ref={imageSectionRef} sx={{ order: isStudioLayout ? 1 : 0 }}>
                        {isStudioLayout ? (
                            <CreateStudioSectionTitle
                                title="Thư viện ảnh"
                                subtitle="Ảnh đầu tiên là ảnh bìa"
                                right={(
                                    <Typography fontSize={13} color="rgba(248,250,252,0.45)" fontWeight={600}>
                                        Tối đa {maxImagesPerPost} ảnh
                                    </Typography>
                                )}
                            />
                        ) : (
                            <Typography fontWeight={600} fontSize={16} mb={2}>
                                Hình ảnh sản phẩm <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                            </Typography>
                        )}
                        {serverSubmitError && serverSubmitErrorPlacement === 'images' ? (
                            <Alert
                                severity="error"
                                onClose={() => onDismissServerSubmitError?.()}
                                sx={{
                                    mb: 2,
                                    bgcolor: 'rgba(211,47,47,0.12)',
                                    color: '#ffcdd2',
                                    border: '1px solid rgba(244,67,54,0.35)',
                                    '& .MuiAlert-icon': { color: '#ef5350' },
                                }}
                            >
                                {serverSubmitError}
                            </Alert>
                        ) : null}
                        <Box mb={isStudioLayout ? 0 : 4}>
                            <ImageUploader
                                onFilesChange={handleFilesChange}
                                maxFiles={Math.max(0, maxImagesPerPost - (existingImageUrls?.length || 0))}
                                existingImageUrls={mode === 'edit' ? (existingImageUrls || []) : []}
                                variant={isStudioLayout ? 'studioHero' : 'default'}
                            />

                            {imageError && (
                                <Typography color="error" sx={{ mt: 1, fontSize: "13px" }}>
                                    {imageError}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    {/* 2. MÔ TẢ */}
                    <Box sx={{ order: isStudioLayout ? 4 : 0 }}>
                        {isStudioLayout ? (
                            <CreateStudioSectionTitle
                                title="Mô tả chi tiết"
                                subtitle="Tình trạng, thời gian dùng, lý do bán…"
                                right={<Box component="span" sx={{ color: 'error.main', fontSize: 18 }}>*</Box>}
                            />
                        ) : (
                            <Typography fontWeight={600} fontSize={16} mb={2.5}>
                                Mô tả chi tiết <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                            </Typography>
                        )}
                        <Box sx={{ mb: isStudioLayout ? 0 : 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                multiline
                                rows={5}
                                placeholder="Ví dụ: Máy còn mới 95%, đầy đủ phụ kiện, bảo hành 3 tháng..."
                                {...register("description", {
                                    required: "Vui lòng nhập mô tả",
                                    validate: (v) => {
                                        const words = (v || "").trim().split(/\s+/).filter(Boolean);
                                        if (words.length < 10) return "Mô tả tối thiểu 10 từ";
                                        if (words.length > 1500) return "Mô tả tối đa 1500 từ";
                                        return true;
                                    }
                                })}
                                error={!!errors.description}
                                helperText={errors.description?.message}
                                sx={{
                                    "& .MuiInputBase-input": {
                                        fontSize: "14px"
                                    }
                                }}
                            />
                            <Typography
                                fontSize={12}
                                sx={{
                                    mt: 0.5,
                                    textAlign: 'right',
                                    color: descriptionValue.trim().split(/\s+/).filter(Boolean).length > 1500 ? 'error.main' : 'rgba(255,255,255,0.5)',
                                }}
                            >
                                {(descriptionValue.trim().split(/\s+/).filter(Boolean).length)} / 1500 từ
                            </Typography>
                        </Box>
                    </Box>

                    {/* 3. TIÊU ĐỀ & DANH MỤC */}
                    <Box sx={{
                        order: isStudioLayout ? 2 : 0,
                        borderRadius: isStudioLayout ? '14px' : 0,
                        border: isStudioLayout ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        bgcolor: isStudioLayout ? 'rgba(255,255,255,0.04)' : 'transparent',
                        p: isStudioLayout ? 2.5 : 0,
                        mb: isStudioLayout ? 0 : 0,
                    }}
                    >
                        {isStudioLayout ? (
                            <CreateStudioSectionTitle title="Chi tiết sản phẩm" subtitle="Thông tin · giá" />
                        ) : null}
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={600} fontSize={16} mb={1.5}>
                                    Tiêu đề <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                                </Typography>
                                <Box>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Tên sản phẩm của bạn"
                                        inputProps={{ maxLength: 50 }}
                                        {...register("title", {
                                            required: "Nhập tiêu đề",
                                            minLength: { value: 2, message: "Tối thiểu 2 ký tự" },
                                            maxLength: { value: 50, message: "Tối đa 50 ký tự" }
                                        })}
                                        error={!!errors.title}
                                        helperText={errors.title?.message}
                                        sx={{
                                            "& .MuiInputBase-input": {
                                                fontSize: "14px"
                                            }
                                        }}
                                    />
                                    <Typography fontSize={12} color="rgba(255,255,255,0.5)" sx={{ mt: 0.5, textAlign: 'right' }}>
                                        {titleValue.length} / 50 ký tự
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={600} fontSize={16} mb={1.5}>
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
                                        borderRadius: "8px",
                                        px: 1.5, py: 0.75,
                                        cursor: "pointer",
                                        fontSize: "13px",
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
                                    <ChevronRightIcon sx={{ fontSize: 18 }} />
                                </Box>
                                {errors.categoryId && (
                                    <Typography color="error" variant="caption" sx={{ ml: 2 }}>
                                        Vui lòng chọn danh mục
                                    </Typography>
                                )}
                            </Grid>
                        </Grid>

                        {/* 4. GIÁ & TÌNH TRẠNG */}
                        <Grid container spacing={2} mt={1}>
                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={600} fontSize={16} mb={1.5}>
                                    Giá bán <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    {...register("price", {
                                        validate: (v) => {
                                            if (isGiveaway) return true;
                                            const num = Number(String(v || "").replace(/\D/g, ""));
                                            if (!num) return "Vui lòng nhập giá";
                                            if (num < 1000) return "Giá tối thiểu 1.000đ";
                                            if (num >= 1000000000) return "Giá tối đa dưới 1 tỉ";
                                            return true;
                                        }
                                    })}
                                    value={formatPrice(watch('price'))}
                                    disabled={isGiveaway}
                                    onChange={(e) => setValue('price', e.target.value.replace(/\D/g, ""), { shouldValidate: true })}
                                    error={!!errors.price}
                                    helperText={errors.price?.message}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end"><Box sx={{ fontSize: 14, fontWeight: 700, ml: 0.5, color: "#fff" }}>đ</Box></InputAdornment>
                                    }}
                                    sx={{
                                        "& .MuiInputBase-input": {
                                            fontSize: "14px"
                                        },
                                        "& .MuiInputBase-input.Mui-disabled": {
                                            WebkitTextFillColor: "#fff"
                                        }
                                    }}
                                />
                                <FormControlLabel
                                    control={(() => {
                                        const { ref, onChange, ...rest } = register('isGiveaway');
                                        return (
                                            <Checkbox
                                                {...rest}
                                                inputRef={ref}
                                                checked={!!isGiveaway}
                                                onChange={(e) => onChange(e)}
                                            />
                                        );
                                    })()}
                                    label="Tôi muốn trao tặng miễn phí"
                                    sx={{
                                        mt: 1,
                                        "& .MuiFormControlLabel-label": {
                                            fontSize: "14px",
                                            fontWeight: 500
                                        }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography fontWeight={600} fontSize={16} mb={1.5}>
                                    Tình trạng sản phẩm <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                                </Typography>
                                <ToggleButtonGroup
                                    exclusive
                                    value={currentCondition}
                                    onChange={(_, val) => val && setValue('condition', val)}
                                    fullWidth
                                    sx={{ width: '100%' }}
                                >
                                    <ToggleButton
                                        value="USED_GOOD"
                                        sx={{
                                            px: 2.5,
                                            py: 0.8,
                                            fontSize: "13px",
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
                                            px: 2.5,
                                            py: 0.8,
                                            fontSize: "13px",
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
                        </Grid>
                    </Box>

                    {/* 5. ĐỊA ĐIỂM GIAO DỊCH */}
                    <Box mt={isStudioLayout ? 0 : 3} sx={{ order: isStudioLayout ? 5 : 0 }}>
                        {isStudioLayout ? (
                            <CreateStudioSectionTitle
                                title="Địa điểm giao dịch"
                                subtitle="Khu vực · ghim trên bản đồ"
                                right={<Box component="span" sx={{ color: 'error.main', fontSize: 18 }}>*</Box>}
                            />
                        ) : (
                            <Typography fontWeight={600} fontSize={16} mb={1.5}>
                                Địa điểm giao dịch <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                            </Typography>
                        )}

                        {/* hidden fields */}
                        <input type="hidden" {...register('pickupLat', { required: 'Vui lòng chọn địa điểm giao dịch trên bản đồ' })} />
                        <input type="hidden" {...register('pickupLng')} />
                        <input type="hidden" {...register('pickupAddressText')} />
                        <input type="hidden" {...register('pickupProvince')} />
                        <input type="hidden" {...register('pickupDistrict')} />
                        <input type="hidden" {...register('pickupWard')} />

                        {/* ── Sequential location picker (Tỉnh → Huyện → Xã) ── */}
                        <LocationPicker
                            onConfirm={(loc) => setAdminLocation(loc)}
                            value={adminLocation ? {
                                province: adminLocation.province,
                                district: adminLocation.district,
                                ward: adminLocation.ward,
                            } : undefined}
                        />

                        {/* ── Địa chỉ đã xác nhận (khu vực 3 cấp; tọa độ lưu riêng) ── */}
                        {pickupLat && pickupLng && (pickupLocationNameW?.trim() || pickupAddressText?.trim()) && (
                            <Box
                                sx={{
                                    mt: 2,
                                    px: 2, py: 1.25,
                                    borderRadius: 1.5,
                                    border: '1px solid rgba(157,110,237,0.4)',
                                    bgcolor: 'rgba(157,110,237,0.08)',
                                    display: 'flex', alignItems: 'flex-start', gap: 1,
                                }}
                            >
                                <CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#9D6EED', mt: 0.2, flexShrink: 0 }} />
                                <Box>
                                    <Typography fontSize={12} color="#B794F6" fontWeight={600} mb={0.3}>
                                        Vị trí đã xác nhận
                                    </Typography>
                                    <Typography fontSize={13} color="#e5e7eb" sx={{ lineHeight: 1.4 }}>
                                        {pickupLocationNameW?.trim() || pickupAddressText}
                                    </Typography>
                                    <Typography fontSize={11} color="rgba(255,255,255,0.45)" sx={{ mt: 0.5 }}>
                                        Tọa độ ghim: {pickupLat}, {pickupLng}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* ── Pending pin: xác nhận / từ chối ── */}
                        {pendingPin && pinStatus === 'valid' && (
                            <Alert
                                severity="success"
                                sx={{
                                    mt: 1.5,
                                    bgcolor: 'rgba(157,110,237,0.1)',
                                    color: '#B794F6',
                                    border: '1px solid rgba(157,110,237,0.4)',
                                    borderRadius: 1.5,
                                    '& .MuiAlert-message': { width: '100%' },
                                    '& .MuiAlert-icon': { color: '#9D6EED' },
                                }}
                                action={
                                    <Stack direction="row" gap={1} alignItems="center">
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={handleRetryPin}
                                            sx={{
                                                color: '#9D6EED',
                                                borderColor: 'rgba(157,110,237,0.5)',
                                                fontSize: 12,
                                                py: 0.5,
                                                '&:hover': {
                                                    borderColor: '#9D6EED',
                                                    bgcolor: 'rgba(157,110,237,0.1)',
                                                },
                                            }}
                                        >
                                            Bỏ
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={handleConfirmPin}
                                            sx={{
                                                bgcolor: '#9D6EED',
                                                color: '#fff',
                                                fontWeight: 700,
                                                fontSize: 12,
                                                py: 0.5,
                                                px: 2,
                                                minWidth: 90,
                                                whiteSpace: 'nowrap',
                                                '&:hover': { bgcolor: '#B794F6' },
                                            }}
                                        >
                                            Xác nhận
                                        </Button>
                                    </Stack>
                                }
                            >
                                Vị trí hợp lệ. Bấm <strong>Xác nhận</strong> để lưu.
                            </Alert>
                        )}
                        {pendingPin && pinStatus === 'invalid' && (
                            <Alert
                                severity="error"
                                sx={{
                                    mt: 1.5,
                                    bgcolor: 'rgba(248,113,113,0.1)',
                                    color: '#f87171',
                                    border: '1px solid rgba(248,113,113,0.3)',
                                    borderRadius: 1.5,
                                }}
                                action={
                                    <Button size="small" onClick={handleRetryPin}
                                            sx={{ color: '#f87171', fontSize: 12, fontWeight: 700 }}>Chọn lại</Button>
                                }
                            >
                                Vị trí không thuộc khu vực đã chọn
                                {pendingPin.districtHint ? ` (${pendingPin.districtHint})` : ''}.
                                Vui lòng gim lại trong đúng khu vực.
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            size="small"
                            label="Ghi chú thêm (tuỳ chọn)"
                            margin="normal"
                            placeholder="VD: Phòng 102, tầng 3, toà nhà..."
                            {...register('pickupAddressSupplement')}
                            sx={{
                                "& .MuiInputBase-input": { fontSize: "14px" }
                            }}
                        />

                        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                            <Typography fontSize={13} color="rgba(255,255,255,0.45)">
                                Chọn khu vực → bản đồ bay về → bấm trên bản đồ để ghim vị trí → xác nhận.
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={handleGpsClick}
                                disabled={gpsLoading}
                                sx={{
                                    color: '#9D6EED', borderColor: 'rgba(157,110,237,0.5)',
                                    fontSize: 12, textTransform: 'none', py: 0.2, px: 1,
                                    '&:hover': { bgcolor: 'rgba(157,110,237,0.1)', borderColor: '#9D6EED' }
                                }}
                            >
                                {gpsLoading ? 'Đang lấy...' : 'Vị trí của tôi'}
                            </Button>
                        </Stack>

                        <Box
                            id="vietmap-container"
                            sx={{
                                mt: 1.5,
                                width: '100%',
                                height: 340,
                                borderRadius: 2,
                                overflow: 'hidden',
                                border: '1px solid rgba(148, 163, 184, 0.35)',
                                bgcolor: '#1A1721',
                            }}
                        />
                        {errors.pickupLat && (
                            <Typography color="error" sx={{ mt: 1, fontSize: "13px" }}>
                                {errors.pickupLat.message}
                            </Typography>
                        )}
                        {/* <Typography fontSize={12} mt={0.5} color="#9ca3af">
                    Nếu bản đồ không hiển thị: kiểm tra VITE_VIETMAP_TILE_KEY hoặc kết nối mạng.
                </Typography> */}
                    </Box>

                    {/* 6. SUBMIT */}
                    <Grid container spacing={3} mt={isStudioLayout ? 3 : 2} alignItems="center" sx={{ order: isStudioLayout ? 6 : 0 }}>
                        <Grid item xs={12}>
                            {isStudioLayout ? (
                                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={3} flexWrap="wrap" useFlexGap>
                                    {mode === 'create' && (
                                        <Button
                                            type="button"
                                            onClick={handleSaveDraftClick}
                                            disabled={savingDraft || submitting}
                                            sx={{
                                                color: 'rgba(248,250,252,0.55)',
                                                textTransform: 'none',
                                                fontSize: 15,
                                                fontWeight: 600,
                                                '&:hover': { color: '#f8fafc', bgcolor: 'rgba(148,163,184,0.08)' },
                                            }}
                                        >
                                            {savingDraft ? 'Đang lưu...' : 'Lưu nháp'}
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        sx={{
                                            px: 4,
                                            py: 1.35,
                                            borderRadius: '12px',
                                            textTransform: 'none',
                                            fontSize: 16,
                                            fontWeight: 800,
                                            color: '#fff',
                                            background: 'linear-gradient(135deg, #9D6EED 0%, #6d28d9 100%)',
                                            boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #B794F6 0%, #7c3aed 100%)',
                                            },
                                            '&.Mui-disabled': { opacity: 0.55 },
                                        }}
                                    >
                                        {studioSubmitPrimaryText}
                                    </Button>
                                </Stack>
                            ) : (
                                <Stack direction="row" gap={2}>
                                    {mode === 'create' && (
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            onClick={handleSaveDraftClick}
                                            disabled={savingDraft || submitting}
                                            sx={{
                                                backgroundColor: "#E0E0E0",
                                                color: "#201D26",
                                                py: 1.1,
                                                fontSize: "14px",
                                                fontWeight: 600,
                                                borderRadius: "10px",
                                                border: "none",
                                                "&:hover": { backgroundColor: "#d5d5d5" },
                                                "&.Mui-disabled": { opacity: 0.6 },
                                            }}
                                        >
                                            {savingDraft ? 'ĐANG LƯU...' : 'LƯU NHÁP'}
                                        </Button>
                                    )}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        disabled={submitting}
                                        sx={{
                                            backgroundColor: "#9D6EED",
                                            py: 1.1,
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            borderRadius: "10px",
                                            "&:hover": { backgroundColor: "#B794F6" },
                                        }}
                                    >
                                        {submitting ? 'ĐANG XỬ LÝ...' : (submitLabel || (mode === 'create' ? 'ĐĂNG TIN' : 'CẬP NHẬT'))}
                                    </Button>
                                </Stack>
                            )}
                        </Grid>
                    </Grid>

                </Box>
            </Box>

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