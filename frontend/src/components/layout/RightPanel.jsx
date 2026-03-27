/** Mục đích: Panel phải — location selector, banner, danh mục hàng đầu, tải app. */
import {
    Box,
    Typography,
    IconButton,
    Button,
    List,
    ListItemButton,
    Popover,
    Skeleton,
} from '@mui/material';
import {
    LocationOn as LocationOnIcon,
    KeyboardArrowDown as ArrowDownIcon,
    KeyboardArrowRight as ArrowRightIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    PhoneAndroid as PhoneIcon,
    Computer as ComputerIcon,
    Tv as TvIcon,
    Checkroom as CheckroomIcon,
    Kitchen as KitchenIcon,
    DirectionsCar as CarIcon,
    SportsEsports as GameIcon,
    MenuBook as BookIcon,
    Category as DefaultCategoryIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getCategories } from '../../api/categoryApi';
import { buildCategoryTree } from '../../utils/categoryTree';
import CategoryTree from '../common/CategoryTree';
import CommunityCtaCard from '../common/CommunityCtaCard';
import { uiTokens } from '../../theme/uiTokens';

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

const HOA_LAC_THACH_THAT_LOCATIONS = [
    'Thạch Hòa',
    'Tân Xã',
    'Bình Yên',
    'Hạ Bằng',
    'Đồng Trúc',
];

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
    const { isAuthenticated } = useAuth();
    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [catLoading, setCatLoading] = useState(true);
    const [expandedParents, setExpandedParents] = useState(new Set());
    const [locAnchorEl, setLocAnchorEl] = useState(null);
    const locOpen = Boolean(locAnchorEl);

    const selectedCategory = searchParams.get('category') || '';
    const selectedSubcategory = searchParams.get('subcategory') || '';

    const categoryTree = buildCategoryTree(categories);

    const toggleCategoryExpand = (id) => {
        setExpandedParents((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectedLocation = searchParams.get('location') || '';
    const locationLabel = selectedLocation || 'Tất cả xã';

    useEffect(() => {
        // Chỉ dùng danh sách xã chuẩn trong phạm vi Hòa Lạc/Thạch Thất.
        setLocations(HOA_LAC_THACH_THAT_LOCATIONS);
    }, []);

    useEffect(() => {
        setCatLoading(true);
        getCategories()
            .then(({ data: res }) => {
                const list = res?.data ?? res ?? [];
                const arr = Array.isArray(list) ? list : [];
                setCategories(arr);
                // Không tự động mở sẵn danh mục nào — để người dùng tự tương tác
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
        navigate(`/feed?${params.toString()}`);
        setLocAnchorEl(null);
    };

    const handleReset = () => {
        navigate('/feed');
    };

    return (
        <Box
            sx={{
                width: 320,
                minWidth: 320,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                position: 'sticky',
                top: '76px',
                height: 'calc(100vh - 76px)',
                overflowY: 'auto',
                py: 0.5,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 3 },
            }}
        >
            {/* Location selector + refresh */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                    onClick={(e) => setLocAnchorEl(e.currentTarget)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        flex: 1,
                        minWidth: 0,
                        bgcolor: 'rgba(30,27,36,0.9)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px',
                        px: 2,
                        py: 1.25,
                        cursor: 'pointer',
                        transition: 'border-color 0.2s, background-color 0.2s',
                        '&:hover': { bgcolor: 'rgba(40,37,48,0.95)', borderColor: 'rgba(157,110,237,0.25)' },
                        ...((locOpen || selectedLocation) && { borderColor: 'rgba(157,110,237,0.4)', bgcolor: 'rgba(40,37,48,0.98)' }),
                    }}
                >
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(157,110,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <LocationOnIcon sx={{ fontSize: 18, color: '#9D6EED' }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, lineHeight: 1.2 }}>
                            Hòa Lạc
                        </Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: selectedLocation ? '#B794F6' : 'rgba(255,255,255,0.9)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {locationLabel}
                        </Typography>
                    </Box>
                    <ArrowDownIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.35)', flexShrink: 0,
                        transform: locOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }} />
                </Box>
                <IconButton
                    onClick={handleReset}
                    sx={{
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                        bgcolor: 'rgba(30,27,36,0.9)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        color: 'rgba(255,255,255,0.5)',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'rgba(157,110,237,0.3)', color: '#9D6EED', bgcolor: 'rgba(157,110,237,0.08)' },
                    }}
                >
                    <RefreshIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>

            {/* Location Popover */}
            <Popover
                open={locOpen}
                anchorEl={locAnchorEl}
                onClose={() => setLocAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            width: locAnchorEl?.clientWidth ? `${locAnchorEl.clientWidth}px` : 320,
                            minWidth: 280,
                            maxWidth: 340,
                            maxHeight: 320,
                            overflow: 'hidden',
                            borderRadius: '14px',
                            boxShadow: '0 20px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
                            bgcolor: 'rgba(20,18,30,0.9)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        },
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: 600, mb: 0.25, letterSpacing: '0.01em' }}>
                        Chọn xã hiển thị tin (khu vực Hòa Lạc)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        Hòa Lạc · Thạch Thất, Hà Nội
                    </Typography>
                </Box>
                <List
                    disablePadding
                    sx={{
                        py: 0.75,
                        maxHeight: 240,
                        overflowY: 'auto',
                        px: 0.75,
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(196,181,253,0.55) rgba(255,255,255,0.04)',
                        '&::-webkit-scrollbar': { width: 6 },
                        '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.04)', borderRadius: 8 },
                        '&::-webkit-scrollbar-thumb': { background: 'rgba(196,181,253,0.55)', borderRadius: 8 },
                    }}
                >
                    <ListItemButton
                        selected={!selectedLocation}
                        onClick={() => handleSelectLocation('')}
                        sx={{
                            borderRadius: '10px',
                            py: 1,
                            px: 1.5,
                            mb: 0.25,
                            transition: 'all 0.2s',
                            '&.Mui-selected': {
                                bgcolor: 'rgba(167,139,250,0.2)',
                                '&:hover': { bgcolor: 'rgba(167,139,250,0.26)' },
                            },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        <Typography sx={{ fontSize: '14px', fontWeight: !selectedLocation ? 700 : 500, color: !selectedLocation ? '#D8B4FE' : 'rgba(255,255,255,0.88)' }}>
                            Tất cả xã
                        </Typography>
                        {!selectedLocation && <CheckCircleIcon sx={{ ml: 'auto', fontSize: 16, color: '#C4B5FD' }} />}
                    </ListItemButton>
                    {locations.map((loc) => (
                        <ListItemButton
                            key={loc}
                            selected={selectedLocation === loc}
                            onClick={() => handleSelectLocation(loc)}
                            sx={{
                                borderRadius: '10px',
                                py: 1,
                                px: 1.5,
                                mb: 0.25,
                                transition: 'all 0.2s',
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(167,139,250,0.2)',
                                    '&:hover': { bgcolor: 'rgba(167,139,250,0.26)' },
                                },
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                            }}
                        >
                            <Typography sx={{ fontSize: '14px', fontWeight: selectedLocation === loc ? 700 : 500, color: selectedLocation === loc ? '#D8B4FE' : 'rgba(255,255,255,0.88)' }}>
                                {loc}
                            </Typography>
                            {selectedLocation === loc && <CheckCircleIcon sx={{ ml: 'auto', fontSize: 16, color: '#C4B5FD' }} />}
                        </ListItemButton>
                    ))}
                </List>
            </Popover>

            {/* Danh mục hàng đầu */}
            <Box sx={{ bgcolor: uiTokens.colors.surface.panel, borderRadius: '16px', overflow: 'hidden', border: `1px solid ${uiTokens.colors.surface.borderSoft}` }}>
                <Box sx={{ px: 2, py: 1.75, borderBottom: `1px solid ${uiTokens.colors.surface.borderSoft}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DefaultCategoryIcon sx={{ fontSize: 20, color: uiTokens.colors.brand.primary, opacity: 0.9 }} />
                    <Typography sx={{ ...uiTokens.typography.sectionTitle, color: uiTokens.colors.surface.textPrimary }}>
                        Danh mục hàng đầu
                    </Typography>
                </Box>
                {catLoading ? (
                    <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} variant="rounded" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '10px' }} />
                        ))}
                    </Box>
                ) : categoryTree.length === 0 ? (
                    <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                        <DefaultCategoryIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.15)', mb: 1 }} />
                        <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                            Chưa có danh mục
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {categoryTree.length === categories.length && categories.length > 1 && (
                            <Box sx={{ px: 2, py: 0.75, bgcolor: 'rgba(157,110,237,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <Typography sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                                    API chưa trả parentId, đang hiển thị phẳng. Cấu hình parent_id trong DB và trả parentId từ backend để xem cây cha-con.
                                </Typography>
                            </Box>
                        )}
                        <CategoryTree
                            items={categoryTree}
                            expandedParents={expandedParents}
                            selectedCategory={selectedCategory}
                            selectedSubcategory={selectedSubcategory}
                            getCategoryIcon={getCategoryIcon}
                            onToggleParent={toggleCategoryExpand}
                            onSelectCategory={(cat) => {
                                const catId = cat.id ?? cat.categoryId ?? encodeURIComponent(cat.name);
                                const params = new URLSearchParams(searchParams);
                                params.set('category', catId);
                                params.delete('subcategory');
                                params.delete('page');
                                navigate(`/feed?${params.toString()}`);
                            }}
                            onSelectSubcategory={(parent, child) => {
                                const parentId = parent.id ?? parent.categoryId ?? parent.name;
                                const subId = child.id ?? child.categoryId ?? encodeURIComponent(child.name);
                                const params = new URLSearchParams(searchParams);
                                params.set('category', parentId);
                                params.set('subcategory', subId);
                                params.delete('page');
                                navigate(`/feed?${params.toString()}`);
                            }}
                        />
                    </>
                )}
            </Box>

            <CommunityCtaCard
                sx={{ mt: 2 }}
                onAction={() => {
                    if (!isAuthenticated) {
                        navigate('/login', { state: { from: '/listings/new', message: 'Bạn cần đăng nhập để đăng tin' } });
                        return;
                    }
                    navigate('/listings/new');
                }}
            />

        </Box>
    );
}
