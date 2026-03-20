import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, TextField, MenuItem, CircularProgress,
    Chip, IconButton, Divider, Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { getProvinces, getDistricts, getWards } from '../../api/vnAddressApi';
import { searchPlaces, getPlaceByRefId } from '../../api/geoApi';
import useDebounce from '../../hooks/useDebounce';

const FPT_LAT = 21.0135;
const FPT_LNG = 105.5257;

function normalize(str = '') {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

// ——— Sub-component: single row dropdown ————————————————————————————————
function AdminDropdown({ label, options, value, onChange, disabled, loading }) {
    const [inputVal, setInputVal] = useState('');
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        setInputVal(value ? value.name : '');
    }, [value]);

    const filtered = options.filter((o) =>
        !inputVal || normalize(o.name).includes(normalize(inputVal))
    );

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setOpen(false);
                setInputVal(value ? value.name : '');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [value]);

    const handleSelect = (option) => {
        onChange(option);
        setInputVal(option.name);
        setOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(null);
        setInputVal('');
        setOpen(false);
    };

    return (
        <Box ref={wrapRef} sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <TextField
                fullWidth
                size="small"
                label={label}
                value={inputVal}
                onFocus={() => { if (!disabled) setOpen(true); }}
                onChange={(e) => {
                    setInputVal(e.target.value);
                    setOpen(true);
                }}
                disabled={disabled}
                placeholder={disabled ? '' : `Chọn ${label.toLowerCase()}`}
                InputProps={{
                    endAdornment: loading
                        ? <CircularProgress size={14} sx={{ color: '#9D6EED' }} />
                        : value
                            ? <IconButton size="small" onClick={handleClear} sx={{ p: 0.3, color: 'rgba(255,255,255,0.4)' }}><CloseIcon sx={{ fontSize: 14 }} /></IconButton>
                            : null,
                }}
                sx={{
                    '& .MuiInputBase-root': {
                        bgcolor: disabled ? 'rgba(255,255,255,0.04)' : '#312F37',
                        color: '#fff',
                        fontSize: 14,
                        borderRadius: 1,
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255,255,255,0.15)',
                    },
                    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: disabled ? 'rgba(255,255,255,0.15)' : '#9D6EED',
                    },
                    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#9D6EED',
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: 'rgba(255,255,255,0.35)',
                    },
                }}
            />
            {open && !disabled && filtered.length > 0 && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1400,
                        mt: 0.5,
                        maxHeight: 240,
                        overflowY: 'auto',
                        bgcolor: '#23202A',
                        border: '1px solid rgba(157,110,237,0.4)',
                        borderRadius: 1.5,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                >
                    {filtered.map((opt) => (
                        <Box
                            key={opt.code}
                            onMouseDown={() => handleSelect(opt)}
                            sx={{
                                px: 2,
                                py: 1.2,
                                cursor: 'pointer',
                                fontSize: 14,
                                color: opt.code === value?.code ? '#B794F6' : 'rgba(255,255,255,0.85)',
                                fontWeight: opt.code === value?.code ? 600 : 400,
                                bgcolor: opt.code === value?.code ? 'rgba(157,110,237,0.15)' : 'transparent',
                                '&:hover': { bgcolor: 'rgba(157,110,237,0.12)' },
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                            }}
                        >
                            {opt.name}
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

// ——— Main Component ———————————————————————————————————————————————————
/**
 * Props:
 *   onConfirm({ province, district, ward, searchText }) — gọi khi user xác nhận khu vực
 *   onSuggestionSelect({ lat, lng, addressText }) — gọi khi chọn gợi ý Vietmap (di chuyển bản đồ nhưng chưa xác nhận khu vực địa chính)
 *   value — giá trị hiện tại { province, district, ward }
 */
export default function LocationPicker({ onConfirm, onSuggestionSelect, value }) {
    // VN admin data
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingWards, setLoadingWards] = useState(false);

    const [province, setProvince] = useState(value?.province || null);
    const [district, setDistrict] = useState(value?.district || null);
    const [ward, setWard] = useState(value?.ward || null);

    // Vietmap search
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 400);
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchRef = useRef(null);
    const [searchOpen, setSearchOpen] = useState(false);

    // Load provinces on mount
    useEffect(() => {
        setLoadingProvinces(true);
        getProvinces()
            .then((data) => setProvinces(Array.isArray(data) ? data : []))
            .catch(() => setProvinces([]))
            .finally(() => setLoadingProvinces(false));
    }, []);

    // Load districts when province changes
    useEffect(() => {
        if (!province) { setDistricts([]); setDistrict(null); setWards([]); setWard(null); return; }
        setLoadingDistricts(true);
        setDistrict(null);
        setWards([]);
        setWard(null);
        getDistricts(province.code)
            .then((data) => setDistricts(data?.districts || []))
            .catch(() => setDistricts([]))
            .finally(() => setLoadingDistricts(false));
    }, [province]);

    // Load wards when district changes
    useEffect(() => {
        if (!district) { setWards([]); setWard(null); return; }
        setLoadingWards(true);
        setWard(null);
        getWards(district.code)
            .then((data) => setWards(data?.wards || []))
            .catch(() => setWards([]))
            .finally(() => setLoadingWards(false));
    }, [district]);

    // Notify parent when all 3 levels are selected
    useEffect(() => {
        if (province && district && ward) {
            const searchText = `${ward.name}, ${district.name}, ${province.name}`;
            onConfirm?.({ province, district, ward, searchText });
        }
    }, [ward]);

    // Vietmap search suggestions
    useEffect(() => {
        const q = debouncedQuery.trim();
        if (!q) { setSuggestions([]); return; }
        setIsSearching(true);
        searchPlaces({ q, lat: FPT_LAT, lng: FPT_LNG })
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                setSuggestions(Array.isArray(data) ? data.slice(0, 7) : []);
            })
            .catch(() => setSuggestions([]))
            .finally(() => setIsSearching(false));
    }, [debouncedQuery]);

    // Click outside search dropdown
    useEffect(() => {
        const handler = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSuggestionClick = async (sugg) => {
        const refId = sugg.ref_id ?? sugg.refId ?? null;
        let lat = Number(sugg.lat ?? sugg.latitude);
        let lng = Number(sugg.lng ?? sugg.longitude);

        if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && refId) {
            try {
                const res = await getPlaceByRefId(refId);
                const pl = res?.data?.data ?? res?.data ?? {};
                lat = Number(pl.lat); lng = Number(pl.lng);
            } catch { /* ignore */ }
        }

        const name = sugg.name || sugg.locationName || '';
        const addr = sugg.address || sugg.addressText || '';
        const text = addr || name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        setSearchQuery(text);
        setSuggestions([]);
        setSearchOpen(false);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            onSuggestionSelect?.({ lat, lng, addressText: text });
        }
    };

    const handleReset = () => {
        setProvince(null);
        setDistrict(null);
        setWard(null);
        setSearchQuery('');
        setSuggestions([]);
        onConfirm?.(null);
    };

    const confirmed = province && district && ward;

    return (
        <Box>
            {/* ── Confirmed summary strip ── */}
            {confirmed && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid rgba(157,110,237,0.4)',
                        bgcolor: 'rgba(157,110,237,0.08)',
                    }}
                >
                    <Box>
                        <Typography fontSize={11} color="rgba(255,255,255,0.5)" mb={0.5}>
                            Khu vực được chọn
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                            <RadioButtonCheckedIcon sx={{ fontSize: 16, color: '#9D6EED' }} />
                            <Typography fontSize={14} fontWeight={700} color="#B794F6">
                                {province.name}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3, pl: 0.5 }}>
                            <RadioButtonUncheckedIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
                            <Typography fontSize={13} color="rgba(255,255,255,0.75)">
                                {district.name}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 0.5 }}>
                            <RadioButtonUncheckedIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
                            <Typography fontSize={13} color="rgba(255,255,255,0.75)">
                                {ward.name}
                            </Typography>
                        </Box>
                    </Box>
                    <Box
                        onClick={handleReset}
                        sx={{ cursor: 'pointer', color: '#9D6EED', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', ml: 2, mt: 0.5, '&:hover': { color: '#B794F6' } }}
                    >
                        Thiết lập lại
                    </Box>
                </Box>
            )}

            {/* ── Vietmap search ── */}
            <Box ref={searchRef} sx={{ position: 'relative', mb: 1.5 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Tìm kiếm địa điểm trên bản đồ (VD: KTX FPT, tòa Alpha…)"
                    value={searchQuery}
                    onFocus={() => { if (suggestions.length > 0) setSearchOpen(true); }}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />,
                        endAdornment: isSearching ? <CircularProgress size={14} sx={{ color: '#9D6EED' }} /> : null,
                    }}
                    sx={{
                        '& .MuiInputBase-root': { bgcolor: '#312F37', color: '#fff', fontSize: 14, borderRadius: 1 },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                        '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9D6EED' },
                        '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#9D6EED' },
                    }}
                />
                {searchOpen && (searchQuery.trim()) && (suggestions.length > 0 || isSearching) && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1400,
                            mt: 0.5,
                            bgcolor: '#23202A',
                            border: '1px solid rgba(157,110,237,0.4)',
                            borderRadius: 1.5,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            maxHeight: 220,
                            overflowY: 'auto',
                        }}
                    >
                        {suggestions.map((sugg, idx) => (
                            <Box
                                key={`${sugg.id || idx}-${sugg.name || ''}`}
                                onMouseDown={() => handleSuggestionClick(sugg)}
                                sx={{
                                    px: 2, py: 1.1,
                                    cursor: 'pointer',
                                    borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    '&:hover': { bgcolor: 'rgba(157,110,237,0.12)' },
                                    display: 'flex',
                                    gap: 1.2,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <LocationOnIcon sx={{ fontSize: 16, color: '#9D6EED', mt: 0.2, flexShrink: 0 }} />
                                <Box>
                                    <Typography fontSize={13} fontWeight={600} color="rgba(255,255,255,0.9)">
                                        {sugg.name || sugg.locationName || 'Điểm gợi ý'}
                                    </Typography>
                                    {sugg.address && (
                                        <Typography fontSize={12} color="rgba(255,255,255,0.5)">
                                            {sugg.address}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        ))}
                        {isSearching && (
                            <Box sx={{ px: 2, py: 1 }}>
                                <Typography fontSize={12} color="rgba(255,255,255,0.4)">Đang tìm kiếm…</Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* ── 3-level dropdowns ── */}
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5 }}>
                <AdminDropdown
                    label="Tỉnh / Thành phố"
                    options={provinces}
                    value={province}
                    onChange={setProvince}
                    disabled={false}
                    loading={loadingProvinces}
                />
                <AdminDropdown
                    label="Quận / Huyện"
                    options={districts}
                    value={district}
                    onChange={setDistrict}
                    disabled={!province || loadingDistricts}
                    loading={loadingDistricts}
                />
                <AdminDropdown
                    label="Phường / Xã"
                    options={wards}
                    value={ward}
                    onChange={setWard}
                    disabled={!district || loadingWards}
                    loading={loadingWards}
                />
            </Box>

            {province && !district && !loadingDistricts && (
                <Typography fontSize={12} color="rgba(255,255,255,0.4)" mt={1}>
                    👆 Chọn quận/huyện để tiếp tục
                </Typography>
            )}
            {district && !ward && !loadingWards && (
                <Typography fontSize={12} color="rgba(255,255,255,0.4)" mt={1}>
                    👆 Chọn phường/xã để xác nhận khu vực
                </Typography>
            )}
            {confirmed && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 1 }}>
                    <CheckCircleIcon sx={{ fontSize: 15, color: '#4ade80' }} />
                    <Typography fontSize={12} color="#4ade80">
                        Đã chọn khu vực — bấm trên bản đồ để gim vị trí chính xác
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
