import { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, CircularProgress,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { getProvinces, getDistricts, getWards } from '../../api/vnAddressApi';

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
 *   value — giá trị hiện tại { province, district, ward }
 */
const HANOI_HINTS = ['ha noi', 'hanoi'];
const THACH_THAT_HINTS = ['thach that'];
const HOA_LAC_HINTS = ['hoa lac', 'hoalac'];

function matchesAny(name, hints) {
    const normalized = normalize(name);
    return hints.some((hint) => normalized.includes(hint));
}

function findDefaultHoaLacSelection(provinces, districts, wards) {
    const province = provinces.find((item) => matchesAny(item?.name, HANOI_HINTS));
    const district = districts.find((item) => matchesAny(item?.name, THACH_THAT_HINTS))
        || districts.find((item) => matchesAny(item?.name, HOA_LAC_HINTS));
    const ward = wards.find((item) => matchesAny(item?.name, HOA_LAC_HINTS));
    return { province: province || null, district: district || null, ward: ward || null };
}

export default function LocationPicker({ onConfirm, value, defaultToHoaLac = true }) {
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
    const provinceLocked = true;

    // Load provinces on mount
    useEffect(() => {
        setLoadingProvinces(true);
        getProvinces()
            .then((data) => setProvinces(Array.isArray(data) ? data : []))
            .catch(() => setProvinces([]))
            .finally(() => setLoadingProvinces(false));
    }, []);

    useEffect(() => {
        if (!defaultToHoaLac || value) return;
        if (!provinces.length) return;

        const hint = findDefaultHoaLacSelection(provinces, districts, wards);
        if (hint.province && !province) setProvince(hint.province);
        if (hint.district && !district) setDistrict(hint.district);
        if (hint.ward && !ward) setWard(hint.ward);
    }, [defaultToHoaLac, value, provinces, districts, wards, province, district, ward]);

    useEffect(() => {
        if (!provinceLocked || !province) return;
        if (!matchesAny(province.name, HANOI_HINTS) && provinces.length) {
            const hint = findDefaultHoaLacSelection(provinces, districts, wards);
            if (hint.province) setProvince(hint.province);
        }
    }, [provinceLocked, province, provinces, districts, wards]);

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

    useEffect(() => {
        if (!provinceLocked || !province || !districts.length) return;
        const foundDistrict = districts.find((item) => matchesAny(item?.name, THACH_THAT_HINTS) || matchesAny(item?.name, HOA_LAC_HINTS));
        if (foundDistrict && (!district || district.code !== foundDistrict.code)) setDistrict(foundDistrict);
    }, [provinceLocked, province, districts, district]);

    useEffect(() => {
        if (!defaultToHoaLac) return;
        if (!province || !districts.length || district) return;
        const hint = findDefaultHoaLacSelection([province], districts, wards);
        if (hint.district) setDistrict(hint.district);
    }, [defaultToHoaLac, province, districts, wards, district]);

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

    useEffect(() => {
        if (!provinceLocked || !district || !wards.length) return;
        const foundWard = wards.find((item) => matchesAny(item?.name, HOA_LAC_HINTS));
        if (foundWard && (!ward || ward.code !== foundWard.code)) setWard(foundWard);
    }, [provinceLocked, district, wards, ward]);

    useEffect(() => {
        if (!defaultToHoaLac) return;
        if (!district || ward || !wards.length) return;
        const hint = findDefaultHoaLacSelection([province].filter(Boolean), [district], wards);
        if (hint.ward) setWard(hint.ward);
    }, [defaultToHoaLac, district, wards, ward, province]);

    // Notify parent when all 3 levels are selected
    useEffect(() => {
        if (province && district && ward) {
            const searchText = `${ward.name}, ${district.name}, ${province.name}`;
            onConfirm?.({ province, district, ward, searchText });
        }
    }, [ward]);

    const handleReset = () => {
        setProvince(null);
        setDistrict(null);
        setWard(null);
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
                            <Box sx={{ width: 18, minWidth: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                <CheckCircleIcon sx={{ fontSize: 14, color: '#9D6EED' }} />
                            </Box>
                            <Typography fontSize={14} fontWeight={700} color="#B794F6" sx={{ lineHeight: 1.2 }}>
                                {province.name}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                            <Box sx={{ width: 18, minWidth: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                <CheckCircleIcon sx={{ fontSize: 14, color: '#9D6EED' }} />
                            </Box>
                            <Typography fontSize={13} color="rgba(255,255,255,0.75)" sx={{ lineHeight: 1.2 }}>
                                {district.name}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 18, minWidth: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                <CheckCircleIcon sx={{ fontSize: 14, color: '#9D6EED' }} />
                            </Box>
                            <Typography fontSize={13} color="rgba(255,255,255,0.75)" sx={{ lineHeight: 1.2 }}>
                                {ward.name}
                            </Typography>
                        </Box>
                    </Box>
                    <Box
                        onClick={handleReset}
                        sx={{
                            cursor: 'pointer',
                            color: '#9D6EED',
                            fontSize: 13,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            ml: 2,
                            mt: 0.5,
                            visibility: 'hidden',
                            pointerEvents: 'none',
                        }}
                    >
                        Thiết lập lại
                    </Box>
                </Box>
            )}

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
