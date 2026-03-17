/** Mục đích: Panel filter — khu vực, sắp xếp giá, tình trạng, danh mục. */
import {
    Box,
    Typography,
    Divider,
    List,
    ListItemButton,
    Skeleton,
    ToggleButton,
    ToggleButtonGroup,
    Popper,
    Paper,
    Fade,
} from '@mui/material';
import {
    LocationOn as LocationOnIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon,
    CheckCircle as CheckCircleIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getLocations } from '../../api/locationApi';
import { getCategories } from '../../api/categoryApi';


/** Hard-coded subcategories — sẽ thay bằng API sau */
const HARDCODED_SUBCATEGORIES = {
    Electronics: [
        { id: 'phones-tablets',    name: 'Điện thoại & Máy tính bảng' },
        { id: 'laptops-computers', name: 'Laptop & Máy tính' },
        { id: 'audio',             name: 'Thiết bị âm thanh' },
        { id: 'cameras',           name: 'Máy ảnh & Camera' },
        { id: 'wearables',         name: 'Đồng hồ thông minh' },
        { id: 'accessories-elec',  name: 'Phụ kiện điện tử' },
    ],
};

const SectionLabel = ({ children }) => (
    <Typography sx={{
        fontSize: '11px', fontWeight: 700, color: '#9D6EED',
        textTransform: 'uppercase', letterSpacing: '0.8px', px: 2, pt: 1.5, pb: 0.5,
    }}>
        {children}
    </Typography>
);

export default function FilterPanel() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [catLoading, setCatLoading] = useState(true);

    /** Flyout submenu state */
    const [anchorEl, setAnchorEl] = useState(null);
    const [hoveredCatName, setHoveredCatName] = useState(null);
    const closeTimer = useRef(null);

    const selectedLocation = searchParams.get('location') || '';
    const selectedSort = searchParams.get('sort') || '';
    const selectedCondition = searchParams.get('condition') || '';
    const selectedCategory = searchParams.get('category') || '';
    const selectedSubcategory = searchParams.get('subcategory') || '';

    useEffect(() => {
        getLocations()
            .then(({ data: res }) => {
                const list = res?.data ?? res ?? [];
                const arr = Array.isArray(list) && list.length > 0 ? list : FALLBACK_LOCATIONS;
                setLocations(arr);
            })
            .catch(() => setLocations(FALLBACK_LOCATIONS));
    }, []);

    useEffect(() => {
        setCatLoading(true);
        getCategories()
            .then(({ data: res }) => {
                const list = res?.data ?? res ?? [];
                setCategories(Array.isArray(list) ? list : []);
            })
            .catch(() => setCategories([]))
            .finally(() => setCatLoading(false));
    }, []);

    const setParam = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete('page');
        navigate(`/?${params.toString()}`);
    };

    const handleCategoryClick = (catId) => {
        const params = new URLSearchParams(searchParams);
        params.set('category', catId);
        params.delete('subcategory');
        params.delete('page');
        navigate(`/?${params.toString()}`);
    };

    const handleSubcategoryClick = (catId, subId) => {
        const params = new URLSearchParams(searchParams);
        params.set('category', catId);
        params.set('subcategory', subId);
        params.delete('page');
        navigate(`/?${params.toString()}`);
        closeFlyout();
    };

    /** Mở flyout với delay-cancel để chuột di chuyển sang submenu không bị đóng */
    const openFlyout = (event, catName) => {
        clearTimeout(closeTimer.current);
        setAnchorEl(event.currentTarget);
        setHoveredCatName(catName);
    };

    const closeFlyout = () => {
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => {
            setAnchorEl(null);
            setHoveredCatName(null);
        }, 120);
    };

    const keepFlyout = () => {
        clearTimeout(closeTimer.current);
    };

    const handleReset = () => {
        navigate('/');
    };

    const flyoutSubs = hoveredCatName ? (HARDCODED_SUBCATEGORIES[hoveredCatName] ?? []) : [];
    const flyoutOpen = Boolean(anchorEl) && flyoutSubs.length > 0;

    return (
        <Box sx={{
            width: 260,
            minWidth: 260,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            position: 'sticky',
            top: '76px',
            height: 'calc(100vh - 76px)',
            overflowY: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
        }}>

            {/* Header */}
            <Box sx={{ px: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                    Bộ lọc
                </Typography>
                <Typography
                    onClick={handleReset}
                    sx={{
                        fontSize: '16px',
                        fontWeight: 500,
                        color: '#9D6EED',
                        cursor: 'pointer',
                        '&:hover': { color: '#B794F6', textDecoration: 'underline' },
                    }}
                >
                    Xóa lọc
                </Typography>
            </Box>

            {/* ── KHU VỰC ── */}
            <Box sx={{ bgcolor: '#2A2733', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <LocationOnIcon sx={{ fontSize: 14, color: '#9D6EED' }} />
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                        Khu vực
                    </Typography>
                </Box>
                <List dense disablePadding sx={{ pb: 0.5 }}>
                    <ListItemButton
                        selected={!selectedLocation}
                        onClick={() => setParam('location', '')}
                        sx={{ px: 2, py: 0.8,
                            '&.Mui-selected': { bgcolor: 'rgba(157,110,237,0.15)' },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                    >
                        <Typography sx={{ fontSize: '13px',
                            fontWeight: !selectedLocation ? 600 : 400,
                            color: !selectedLocation ? '#9D6EED' : 'rgba(255,255,255,0.7)' }}>
                            Tất cả khu vực
                        </Typography>
                        {!selectedLocation && <CheckCircleIcon sx={{ fontSize: 14, color: '#9D6EED', ml: 'auto' }} />}
                    </ListItemButton>
                    <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.07)' }} />
                    {locations.map((loc) => (
                        <ListItemButton
                            key={loc}
                            selected={selectedLocation === loc}
                            onClick={() => setParam('location', loc)}
                            sx={{ px: 2, py: 0.8,
                                '&.Mui-selected': { bgcolor: 'rgba(157,110,237,0.15)' },
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                        >
                            <Typography sx={{ fontSize: '13px',
                                fontWeight: selectedLocation === loc ? 600 : 400,
                                color: selectedLocation === loc ? '#9D6EED' : 'rgba(255,255,255,0.7)' }}>
                                {loc}
                            </Typography>
                            {selectedLocation === loc && <CheckCircleIcon sx={{ fontSize: 14, color: '#9D6EED', ml: 'auto' }} />}
                        </ListItemButton>
                    ))}
                </List>
            </Box>

            {/* ── GIÁ ── */}
            <Box sx={{ bgcolor: '#2A2733', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                        Sắp xếp theo giá
                    </Typography>
                </Box>
                <Box sx={{ px: 2, py: 1.5 }}>
                    <ToggleButtonGroup
                        exclusive
                        fullWidth
                        value={selectedSort}
                        onChange={(_, val) => setParam('sort', val ?? '')}
                        sx={{ gap: 1 }}
                    >
                        <ToggleButton
                            value="price_asc"
                            sx={{
                                flex: 1, py: 0.8, borderRadius: '8px !important',
                                border: '1px solid rgba(255,255,255,0.1) !important',
                                color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600,
                                display: 'flex', gap: 0.5, textTransform: 'none',
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(157,110,237,0.2)',
                                    color: '#9D6EED',
                                    borderColor: '#9D6EED !important',
                                },
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                            }}
                        >
                            <ArrowUpIcon sx={{ fontSize: 14 }} /> Thấp → Cao
                        </ToggleButton>
                        <ToggleButton
                            value="price_desc"
                            sx={{
                                flex: 1, py: 0.8, borderRadius: '8px !important',
                                border: '1px solid rgba(255,255,255,0.1) !important',
                                color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600,
                                display: 'flex', gap: 0.5, textTransform: 'none',
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(157,110,237,0.2)',
                                    color: '#9D6EED',
                                    borderColor: '#9D6EED !important',
                                },
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                            }}
                        >
                            <ArrowDownIcon sx={{ fontSize: 14 }} /> Cao → Thấp
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {/* ── TÌNH TRẠNG ── */}
            <Box sx={{ bgcolor: '#2A2733', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                        Tình trạng
                    </Typography>
                </Box>
                <Box sx={{ px: 2, py: 1.5 }}>
                    <ToggleButtonGroup
                        exclusive
                        fullWidth
                        value={selectedCondition}
                        onChange={(_, val) => setParam('condition', val ?? '')}
                        sx={{ gap: 1 }}
                    >
                        <ToggleButton
                            value="USED"
                            sx={{
                                flex: 1, py: 0.8, borderRadius: '8px !important',
                                border: '1px solid rgba(255,255,255,0.1) !important',
                                color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600,
                                textTransform: 'none',
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(157,110,237,0.2)',
                                    color: '#9D6EED',
                                    borderColor: '#9D6EED !important',
                                },
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                            }}
                        >
                            Đã sử dụng
                        </ToggleButton>
                        <ToggleButton
                            value="NEW"
                            sx={{
                                flex: 1, py: 0.8, borderRadius: '8px !important',
                                border: '1px solid rgba(255,255,255,0.1) !important',
                                color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600,
                                textTransform: 'none',
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(157,110,237,0.2)',
                                    color: '#9D6EED',
                                    borderColor: '#9D6EED !important',
                                },
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                            }}
                        >
                            Mới
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            {/* ── DANH MỤC ── */}
            <Box sx={{ bgcolor: '#2A2733', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                        Danh mục
                    </Typography>
                </Box>
                <List dense disablePadding sx={{ pb: 0.5 }}>
                    <ListItemButton
                        selected={!selectedCategory}
                        onClick={() => { setParam('category', ''); setParam('subcategory', ''); }}
                        sx={{ px: 2, py: 0.8,
                            '&.Mui-selected': { bgcolor: 'rgba(157,110,237,0.15)' },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                    >
                        <Typography sx={{ fontSize: '12px',
                            fontWeight: !selectedCategory ? 600 : 400,
                            color: !selectedCategory ? '#9D6EED' : 'rgba(255,255,255,0.7)', flex: 1 }}>
                            Tất cả danh mục
                        </Typography>
                        {!selectedCategory && <CheckCircleIcon sx={{ fontSize: 14, color: '#9D6EED' }} />}
                    </ListItemButton>
                    <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.07)' }} />
                    {catLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <Box key={i} sx={{ px: 2, py: 1 }}>
                                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
                            </Box>
                        ))
                        : categories.map((cat, idx) => {
                            const catId = String(cat.id ?? cat.categoryId ?? cat.name);
                            const isSelected = selectedCategory === catId;
                            const hasSubs = (HARDCODED_SUBCATEGORIES[cat.name] ?? []).length > 0;
                            const isHovered = hoveredCatName === cat.name;
                            return (
                                <Box key={catId}>
                                    <ListItemButton
                                        selected={isSelected}
                                        onClick={() => handleCategoryClick(catId)}
                                        onMouseEnter={(e) => hasSubs ? openFlyout(e, cat.name) : closeFlyout()}
                                        onMouseLeave={closeFlyout}
                                        sx={{
                                            px: 2, py: 0.8,
                                            bgcolor: isHovered ? 'rgba(157,110,237,0.08)' : 'transparent',
                                            '&.Mui-selected': { bgcolor: 'rgba(157,110,237,0.15)' },
                                            '&:hover': { bgcolor: isSelected ? 'rgba(157,110,237,0.15)' : 'rgba(157,110,237,0.08)' },
                                        }}
                                    >
                                        <Typography sx={{ fontSize: '12px',
                                            fontWeight: isSelected ? 600 : 400,
                                            color: isSelected ? '#9D6EED' : isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)',
                                            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {cat.name}
                                        </Typography>
                                        {isSelected
                                            ? <CheckCircleIcon sx={{ fontSize: 14, color: '#9D6EED', flexShrink: 0 }} />
                                            : <ChevronRightIcon sx={{ fontSize: 14,
                                                color: hasSubs && isHovered ? '#9D6EED' : 'rgba(255,255,255,0.3)',
                                                flexShrink: 0 }} />
                                        }
                                    </ListItemButton>
                                    {idx < categories.length - 1 && (
                                        <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.07)' }} />
                                    )}
                                </Box>
                            );
                        })
                    }
                </List>
            </Box>

            {/* ── FLYOUT SUBMENU ── */}
            <Popper
                open={flyoutOpen}
                anchorEl={anchorEl}
                placement="right-start"
                transition
                disablePortal={false}
                modifiers={[
                    { name: 'offset', options: { offset: [0, 8] } },
                    { name: 'preventOverflow', options: { boundary: 'viewport', padding: 12 } },
                ]}
                sx={{ zIndex: 1300 }}
            >
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={150}>
                        <Paper
                            elevation={8}
                            onMouseEnter={keepFlyout}
                            onMouseLeave={closeFlyout}
                            sx={{
                                bgcolor: '#2A2733',
                                border: '1px solid rgba(157,110,237,0.3)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                minWidth: 210,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(157,110,237,0.15)',
                            }}
                        >
                            {/* Tiêu đề flyout */}
                            <Box sx={{
                                px: 2, py: 1.2,
                                borderBottom: '1px solid rgba(255,255,255,0.07)',
                                background: 'linear-gradient(135deg, rgba(157,110,237,0.15) 0%, rgba(157,110,237,0.05) 100%)',
                            }}>
                                <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#9D6EED', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                    {hoveredCatName}
                                </Typography>
                            </Box>
                            <List dense disablePadding sx={{ py: 0.5 }}>
                                {flyoutSubs.map((sub, sIdx) => {
                                    const parentCatId = categories.find(c => c.name === hoveredCatName);
                                    const parentId = parentCatId
                                        ? String(parentCatId.id ?? parentCatId.categoryId ?? parentCatId.name)
                                        : hoveredCatName;
                                    const isSubSelected = selectedSubcategory === sub.id && selectedCategory === parentId;
                                    return (
                                        <Box key={sub.id}>
                                            <ListItemButton
                                                selected={isSubSelected}
                                                onClick={() => handleSubcategoryClick(parentId, sub.id)}
                                                sx={{
                                                    px: 2, py: 0.9,
                                                    '&.Mui-selected': { bgcolor: 'rgba(157,110,237,0.15)' },
                                                    '&:hover': { bgcolor: 'rgba(157,110,237,0.1)' },
                                                }}
                                            >
                                                <Typography sx={{
                                                    fontSize: '12.5px',
                                                    fontWeight: isSubSelected ? 600 : 400,
                                                    color: isSubSelected ? '#C49DFF' : 'rgba(255,255,255,0.75)',
                                                    flex: 1,
                                                }}>
                                                    {sub.name}
                                                </Typography>
                                                {isSubSelected && (
                                                    <CheckCircleIcon sx={{ fontSize: 13, color: '#C49DFF', flexShrink: 0 }} />
                                                )}
                                            </ListItemButton>
                                            {sIdx < flyoutSubs.length - 1 && (
                                                <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
                                            )}
                                        </Box>
                                    );
                                })}
                            </List>
                        </Paper>
                    </Fade>
                )}
            </Popper>
        </Box>
    );
}
