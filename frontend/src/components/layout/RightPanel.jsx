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
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePhoneVerification } from '../../context/PhoneVerificationContext';
import { getCategories } from '../../api/categoryApi';
import { buildCategoryTree } from '../../utils/categoryTree';
import CategoryTree from '../common/CategoryTree';
import CommunityCtaCard from '../common/CommunityCtaCard';
import CommunityTrendingSidebar from '../community/CommunityTrendingSidebar';
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
    const { pathname } = useLocation();
    const [searchParams] = useSearchParams();
    const isCommunityArea = pathname === '/community' || pathname.startsWith('/community/');
    const { isAuthenticated } = useAuth();
    const { checkVerification } = usePhoneVerification();
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
                width: 280, // Default width
                minWidth: 260,
                maxWidth: 320,
                flexShrink: 1, // Cho phép RightPanel co lại khi hết không gian
                display: { xs: 'none', md: 'flex' }, // Ẩn trên tablet/mobile để không đè Feed
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
            {isCommunityArea ? <CommunityTrendingSidebar /> : null}

            {/* Location selector + refresh */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                    onClick={(e) => setLocAnchorEl(e.currentTarget)}
                    role="button"
                    tabIndex={0}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        flex: 1,
                        minWidth: 0,
                        bgcolor: 'rgba(30,27,36,0.5)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '20px',
                        px: 2,
                        py: 2, // Standardize to match gap 2 (16px)
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        '&:hover': {
                            bgcolor: 'rgba(40,37,48,0.7)',
                            borderColor: 'rgba(157,110,237,0.4)',
                            boxShadow: '0 6px 24px rgba(157,110,237,0.12)',
                            transform: 'translateY(-1px)'
                        },
                        '&:active': {
                            transform: 'translateY(1px)'
                        },
                        ...((locOpen || selectedLocation) && {
                            borderColor: 'rgba(157,110,237,0.55)',
                            bgcolor: 'rgba(40,37,48,0.85)',
                            boxShadow: '0 8px 32px rgba(157,110,237,0.16)'
                        }),
                    }}
                >
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(157,110,237,0.2) 0%, rgba(157,110,237,0.1) 100%)',
                        border: '1px solid rgba(157,110,237,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <LocationOnIcon sx={{ fontSize: 20, color: '#A78BFA' }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
                            Khu vực
                        </Typography>
                        <Typography sx={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: selectedLocation ? '#B794F6' : 'rgba(255,255,255,0.95)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: 0.5
                        }}>
                            {locationLabel}
                        </Typography>
                    </Box>
                    <ArrowDownIcon sx={{
                        fontSize: 20,
                        color: locOpen ? '#9D6EED' : 'rgba(255,255,255,0.3)',
                        flexShrink: 0,
                        transform: locOpen ? 'rotate(180deg)' : 'none',
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }} />
                </Box>
                <IconButton
                    onClick={handleReset}
                    title="Xóa tất cả bộ lọc"
                    sx={{
                        width: 52,
                        height: 52,
                        flexShrink: 0,
                        bgcolor: 'rgba(30,27,36,0.6)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        color: 'rgba(255,255,255,0.4)',
                        transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        '&:hover': {
                            borderColor: 'rgba(157,110,237,0.4)',
                            color: '#fff',
                            bgcolor: 'rgba(157,110,237,0.12)',
                            transform: 'rotate(180deg) scale(1.05)',
                            boxShadow: '0 8px 24px rgba(157,110,237,0.2)'
                        },
                        '&:active': { transform: 'rotate(180deg) scale(0.95)' }
                    }}
                >
                    <RefreshIcon sx={{ fontSize: 24 }} />
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
            <Box sx={{
                bgcolor: 'rgba(42,39,51,0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
            }}>
                <Box sx={{
                    px: 2,
                    py: 2,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    background: 'linear-gradient(90deg, rgba(157,110,237,0.08) 0%, transparent 100%)'
                }}>
                    <Box sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        bgcolor: 'rgba(157,110,237,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <DefaultCategoryIcon sx={{ fontSize: 18, color: '#A78BFA' }} />
                    </Box>
                    <Typography sx={{
                        fontSize: '15px',
                        fontWeight: 800,
                        letterSpacing: '0.01em',
                        color: 'rgba(255,255,255,0.95)'
                    }}>
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
                    <Box sx={{ pt: 2, pb: 2 }}> {/* Standardized internal padding (p: 2) */}
                        {categoryTree.length === categories.length && categories.length > 1 && (
                            <Box sx={{ mx: 2, mb: 1.5, px: 1.5, py: 1.25, bgcolor: 'rgba(157,110,237,0.06)', borderRadius: '12px', border: '1px solid rgba(157,110,237,0.1)' }}>
                                <Typography sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>
                                    Hiển thị phẳng (Vui lòng kiểm tra parent_id trong DB/API để hiển thị dạng cây).
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
                    </Box>
                )}
            </Box>

            <CommunityCtaCard
                sx={{ mt: 2 }}
                onAction={() => {
                    if (!isAuthenticated) {
                        navigate('/login', { state: { from: '/listings/new', message: 'Bạn cần đăng nhập để đăng tin' } });
                        return;
                    }
                    checkVerification(() => navigate('/listings/new'));
                }}
            />

        </Box>
    );
}
