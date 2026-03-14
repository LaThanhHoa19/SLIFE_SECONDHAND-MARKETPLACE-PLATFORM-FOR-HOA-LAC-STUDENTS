/** Mục đích: Panel phải — location selector, banner, danh mục hàng đầu, tải app. */
import {
    Box,
    Typography,
    IconButton,
    Button,
    Divider,
    List,
    ListItemButton,
    Popover,
    Skeleton,
} from '@mui/material';
import {
    LocationOn as LocationOnIcon,
    KeyboardArrowDown as ArrowDownIcon,
    Refresh as RefreshIcon,
    ChevronRight as ChevronRightIcon,
    PhoneAndroid as PhoneIcon,
    Computer as ComputerIcon,
    Tv as TvIcon,
    Checkroom as CheckroomIcon,
    Kitchen as KitchenIcon,
    DirectionsCar as CarIcon,
    SportsEsports as GameIcon,
    MenuBook as BookIcon,
    Category as DefaultCategoryIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getLocations } from '../../api/locationApi';
import { getCategories } from '../../api/categoryApi';

const CATEGORY_ICONS = {
    'điện thoại': PhoneIcon,
    'máy tính': ComputerIcon,
    'thiết bị điện tử': TvIcon,
    'đồ điện tử': TvIcon,
    'quần áo': CheckroomIcon,
    'quần áo & phụ kiện': CheckroomIcon,
    'đồ dùng cá nhân': CheckroomIcon,
    'đồ dùng cá nhân & phòng trọ': KitchenIcon,
    'đồ gia dụng': KitchenIcon,
    'xe cộ': CarIcon,
    'phương tiện': CarIcon,
    'phương tiện & thể thao': CarIcon,
    'giải trí': GameIcon,
    'giải trí & sở thích': GameIcon,
    'đồ dùng học tập': BookIcon,
    'sách': BookIcon,
};

const getCategoryIcon = (name = '') => {
    const key = name.toLowerCase().trim();
    for (const [k, Icon] of Object.entries(CATEGORY_ICONS)) {
        if (key.includes(k) || k.includes(key)) return Icon;
    }
    return DefaultCategoryIcon;
};

export default function RightPanel() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [catLoading, setCatLoading] = useState(true);
    const [locAnchorEl, setLocAnchorEl] = useState(null);
    const locOpen = Boolean(locAnchorEl);

    const selectedLocation = searchParams.get('location') || '';
    const locationLabel = selectedLocation || 'Tất cả xã';

    useEffect(() => {
        getLocations()
            .then(({ data: res }) => {
                const list = res?.data ?? res ?? [];
                setLocations(Array.isArray(list) ? list : []);
            })
            .catch(() => setLocations([]));
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

    const handleSelectLocation = (loc) => {
        const params = new URLSearchParams(searchParams);
        if (loc) {
            params.set('location', loc);
        } else {
            params.delete('location');
        }
        params.delete('page');
        navigate(`/?${params.toString()}`);
        setLocAnchorEl(null);
    };

    const handleReset = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('location');
        params.delete('page');
        navigate(`/?${params.toString()}`);
    };

    return (
        <Box
            sx={{
                width: 320,
                minWidth: 320,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                position: 'sticky',
                top: '76px', // Header + padding
                height: 'calc(100vh - 76px)',
                overflowY: 'auto',
                '&::-webkit-scrollbar': { display: 'none' },
            }}
        >
            {/* Location selector + refresh */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                    onClick={(e) => setLocAnchorEl(e.currentTarget)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: '#2A2733',
                        border: `1px solid ${locOpen || selectedLocation ? '#9D6EED' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '8px',
                        px: 1.5,
                        py: 0.75,
                        cursor: 'pointer',
                        flex: 1,
                        overflow: 'hidden',
                        '&:hover': { borderColor: '#9D6EED' },
                    }}
                >
                    <LocationOnIcon sx={{ fontSize: 14, color: '#9D6EED', flexShrink: 0 }} />
                    <Box sx={{ flex: 1, mx: 0.5, overflow: 'hidden' }}>
                        <Typography sx={{ fontSize: '10px', color: '#9D6EED', fontWeight: 600, lineHeight: 1.2 }}>
                            Hòa Lạc
                        </Typography>
                        <Typography sx={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.3,
                            color: selectedLocation ? '#9D6EED' : 'rgba(255,255,255,0.75)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {locationLabel}
                        </Typography>
                    </Box>
                    <ArrowDownIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', flexShrink: 0,
                        transform: locOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </Box>
                <IconButton
                    size="small"
                    onClick={handleReset}
                    sx={{
                        bgcolor: '#2A2733',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        p: 0.75,
                        color: 'rgba(255,255,255,0.6)',
                        '&:hover': { borderColor: '#9D6EED', color: '#9D6EED' },
                    }}
                >
                    <RefreshIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {/* Location Popover */}
            <Popover
                open={locOpen}
                anchorEl={locAnchorEl}
                onClose={() => setLocAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{ paper: { sx: { mt: 1, minWidth: 210, maxHeight: 300, overflowY: 'auto',
                            borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                            bgcolor: '#2A2733', border: '1px solid rgba(255,255,255,0.1)' } } }}
            >
                <Box sx={{ px: 2, py: 1.5, background: 'rgba(157,110,237,0.15)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: '#9D6EED' }} />
                    <Box>
                        <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#9D6EED' }}>Hòa Lạc</Typography>
                        <Typography sx={{ fontSize: '11px', color: 'rgba(157,110,237,0.8)' }}>Thạch Thất, Hà Nội</Typography>
                    </Box>
                </Box>
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#9D6EED',
                        textTransform: 'uppercase', letterSpacing: '0.8px' }}>Chọn xã</Typography>
                </Box>
                <List dense disablePadding sx={{ pb: 0.5 }}>
                    <ListItemButton selected={!selectedLocation} onClick={() => handleSelectLocation('')}
                                    sx={{ px: 2, py: 1, '&.Mui-selected': { bgcolor: 'rgba(157,110,237,0.2)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: !selectedLocation ? 600 : 400,
                            color: !selectedLocation ? '#9D6EED' : 'rgba(255,255,255,0.75)' }}>Tất cả xã</Typography>
                    </ListItemButton>
                    <Divider sx={{ mx: 2, my: 0.5, borderColor: 'rgba(255,255,255,0.08)' }} />
                    {locations.map((loc) => (
                        <ListItemButton key={loc} selected={selectedLocation === loc}
                                        onClick={() => handleSelectLocation(loc)}
                                        sx={{ px: 2, py: 1, '&.Mui-selected': { bgcolor: 'rgba(157,110,237,0.2)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
                            <Typography sx={{ fontSize: '13px', fontWeight: selectedLocation === loc ? 600 : 400,
                                color: selectedLocation === loc ? '#9D6EED' : 'rgba(255,255,255,0.75)' }}>{loc}</Typography>
                        </ListItemButton>
                    ))}
                </List>
            </Popover>

            {/* Banner cộng đồng */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #9D6EED 100%)',
                    borderRadius: '12px',
                    p: 2,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4, mb: 1.5 }}>
                    Tham gia cộng đồng mua bán cùng SLIFE!
                </Typography>
                <Button
                    onClick={() => navigate('/listings/new')}
                    sx={{
                        bgcolor: '#FFFFFF',
                        color: '#7C3AED',
                        fontSize: '11px',
                        fontWeight: 700,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '6px',
                        textTransform: 'none',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                    }}
                >
                    ĐĂNG TIN NGAY!!
                </Button>
                {/* Decorative megaphone emoji */}
                <Typography
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '32px',
                        opacity: 0.5,
                        pointerEvents: 'none',
                    }}
                >
                    📢
                </Typography>
            </Box>

            {/* Danh mục hàng đầu */}
            <Box sx={{ bgcolor: '#2A2733', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                        Danh mục hàng đầu
                    </Typography>
                </Box>
                {catLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Box key={i} sx={{ px: 2, py: 1.2 }}>
                            <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
                        </Box>
                    ))
                ) : categories.length === 0 ? (
                    <Box sx={{ px: 2, py: 2 }}>
                        <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                            Không có danh mục
                        </Typography>
                    </Box>
                ) : (
                    categories.map((cat, idx) => {
                        const Icon = getCategoryIcon(cat.name);
                        const count = cat.listingCount ?? cat.count ?? null;
                        return (
                            <Box key={cat.id ?? cat.name}>
                                <Box
                                    onClick={() => navigate(`/?category=${cat.id ?? encodeURIComponent(cat.name)}`)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: 2,
                                        py: 1,
                                        cursor: 'pointer',
                                        gap: 1.5,
                                        '&:hover': { bgcolor: 'rgba(157,110,237,0.1)' },
                                    }}
                                >
                                    <Icon sx={{ fontSize: 16, color: '#9D6EED', flexShrink: 0 }} />
                                    <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', flex: 1,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {cat.name}
                                    </Typography>
                                    {count != null && (
                                        <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', mr: 0.5, flexShrink: 0 }}>
                                            {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                                        </Typography>
                                    )}
                                    <ChevronRightIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                                </Box>
                                {idx < categories.length - 1 && (
                                    <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.07)' }} />
                                )}
                            </Box>
                        );
                    })
                )}
            </Box>

        </Box>
    );
}
