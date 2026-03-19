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
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import {
    LocationOn as LocationOnIcon,
    KeyboardArrowDown as ArrowDownIcon,
    KeyboardArrowRight as ArrowRightIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
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

/** Chuyển danh sách category phẳng (có parentId) thành cây cha-con. Chỉ danh mục gốc (parentId null) mới là "cha". */
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

    const selectedSort = searchParams.get('sort') || '';
    const selectedCondition = searchParams.get('condition') || '';
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

    const setParam = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete('page');
        navigate(`/feed?${params.toString()}`);
    };

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

            {/* Sort theo giá */}
            <Box
                sx={{
                    bgcolor: 'rgba(42,39,51,0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    px: 2,
                    py: 1.5,
                    mt: 0.5,
                }}
            >
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                    Sắp xếp theo giá
                </Typography>
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
                            flex: 1,
                            py: 0.8,
                            borderRadius: '8px !important',
                            border: '1px solid rgba(255,255,255,0.1) !important',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'none',
                            '&.Mui-selected': {
                                bgcolor: 'rgba(157,110,237,0.2)',
                                color: '#9D6EED',
                                borderColor: '#9D6EED !important',
                            },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                        }}
                    >
                        Giá thấp → cao
                    </ToggleButton>
                    <ToggleButton
                        value="price_desc"
                        sx={{
                            flex: 1,
                            py: 0.8,
                            borderRadius: '8px !important',
                            border: '1px solid rgba(255,255,255,0.1) !important',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'none',
                            '&.Mui-selected': {
                                bgcolor: 'rgba(157,110,237,0.2)',
                                color: '#9D6EED',
                                borderColor: '#9D6EED !important',
                            },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                        }}
                    >
                        Giá cao → thấp
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Tình trạng */}
            <Box
                sx={{
                    bgcolor: 'rgba(42,39,51,0.6)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    px: 2,
                    py: 1.5,
                }}
            >
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                    Tình trạng
                </Typography>
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
                            flex: 1,
                            py: 0.8,
                            borderRadius: '8px !important',
                            border: '1px solid rgba(255,255,255,0.1) !important',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '12px',
                            fontWeight: 600,
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
                            flex: 1,
                            py: 0.8,
                            borderRadius: '8px !important',
                            border: '1px solid rgba(255,255,255,0.1) !important',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '12px',
                            fontWeight: 600,
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
                            mt: 1.5,
                            minWidth: 260,
                            maxWidth: 320,
                            maxHeight: 320,
                            overflow: 'hidden',
                            borderRadius: '16px',
                            boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
                            bgcolor: 'rgba(28,26,34,0.98)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        },
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.75, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 500, mb: 0.25 }}>
                        Chọn xã hiển thị tin (khu vực Hòa Lạc)
                    </Typography>
                    <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                        Hòa Lạc · Thạch Thất, Hà Nội
                    </Typography>
                </Box>
                <List disablePadding sx={{ py: 1, maxHeight: 240, overflowY: 'auto' }}>
                    <ListItemButton
                        selected={!selectedLocation}
                        onClick={() => handleSelectLocation('')}
                        sx={{
                            mx: 1,
                            borderRadius: '10px',
                            py: 1.25,
                            px: 2,
                            '&.Mui-selected': { bgcolor: 'rgba(157,110,237,0.15)', '&:hover': { bgcolor: 'rgba(157,110,237,0.2)' } },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                        }}
                    >
                        <Typography sx={{ fontSize: '14px', fontWeight: !selectedLocation ? 600 : 400, color: !selectedLocation ? '#B794F6' : 'rgba(255,255,255,0.85)' }}>
                            Tất cả xã
                        </Typography>
                    </ListItemButton>
                    {locations.map((loc) => (
                        <ListItemButton
                            key={loc}
                            selected={selectedLocation === loc}
                            onClick={() => handleSelectLocation(loc)}
                            sx={{
                                mx: 1,
                                borderRadius: '10px',
                                py: 1.25,
                                px: 2,
                                '&.Mui-selected': { bgcolor: 'rgba(157,110,237,0.15)', '&:hover': { bgcolor: 'rgba(157,110,237,0.2)' } },
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                            }}
                        >
                            <Typography sx={{ fontSize: '14px', fontWeight: selectedLocation === loc ? 600 : 400, color: selectedLocation === loc ? '#B794F6' : 'rgba(255,255,255,0.85)' }}>
                                {loc}
                            </Typography>
                        </ListItemButton>
                    ))}
                </List>
            </Popover>

            {/* Danh mục hàng đầu */}
            <Box sx={{ bgcolor: 'rgba(42,39,51,0.6)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Box sx={{ px: 2, py: 1.75, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DefaultCategoryIcon sx={{ fontSize: 20, color: '#9D6EED', opacity: 0.9 }} />
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '0.02em' }}>
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
                        {categoryTree.map((cat, idx) => {
                            const catId = cat.id ?? cat.categoryId;
                            const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
                            const isExpanded = expandedParents.has(catId);
                            const Icon = getCategoryIcon(cat.name);
                            const count = cat.listingCount ?? cat.count ?? null;

                            const catIdStr = catId != null ? String(catId) : cat.name;
                            const isCategorySelected =
                                selectedCategory &&
                                String(selectedCategory) === catIdStr &&
                                !selectedSubcategory;

                            const hasSelectedChild =
                                hasChildren &&
                                cat.children.some((child) => {
                                    const childId = child.id ?? child.categoryId ?? child.name;
                                    const parentId =
                                        child.parentId ??
                                        child.parent_id ??
                                        catIdStr;
                                    return (
                                        String(parentId) === String(selectedCategory) &&
                                        String(childId) === String(selectedSubcategory)
                                    );
                                });

                            return (
                                <Box key={catId ?? cat.name}>
                                    {/* Hàng danh mục cha */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            px: 2,
                                            py: 1.25,
                                            gap: 1.25,
                                            cursor: 'pointer',
                                            mx: 0.75,
                                            borderRadius: '10px',
                                            bgcolor: hasChildren ? 'rgba(255,255,255,0.02)' : 'transparent',
                                            transition: 'background-color 0.2s',
                                            '&:hover': { bgcolor: 'rgba(157,110,237,0.12)' },
                                        }}
                                    >
                                        <Box
                                            sx={{ width: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (hasChildren) toggleCategoryExpand(catId);
                                            }}
                                        >
                                            {hasChildren ? (
                                                <IconButton size="small" sx={{ p: 0, color: '#9D6EED' }} aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}>
                                                    {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 20 }} /> : <ArrowRightIcon sx={{ fontSize: 20 }} />}
                                                </IconButton>
                                            ) : (
                                                <Box sx={{ width: 20, height: 20 }} />
                                            )}
                                        </Box>
                                        <Box
                                            onClick={() => {
                                                const id = catId ?? encodeURIComponent(cat.name);
                                                const params = new URLSearchParams(searchParams);
                                                params.set('category', id);
                                                params.delete('subcategory');
                                                params.delete('page');
                                                navigate(`/feed?${params.toString()}`);
                                            }}
                                            sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1.25, minWidth: 0 }}
                                        >
                                            {hasChildren ? (
                                                isExpanded ? <FolderOpenIcon sx={{ fontSize: 20, color: '#9D6EED', flexShrink: 0 }} /> : <FolderIcon sx={{ fontSize: 20, color: '#9D6EED', flexShrink: 0 }} />
                                            ) : (
                                                <Icon sx={{ fontSize: 18, color: '#9D6EED', flexShrink: 0 }} />
                                            )}
                                            <Typography
                                                sx={{
                                                    fontSize: '13px',
                                                    fontWeight: isCategorySelected || hasSelectedChild ? 700 : hasChildren ? 600 : 500,
                                                    color: isCategorySelected || hasSelectedChild
                                                        ? '#B794F6'
                                                        : 'rgba(255,255,255,0.9)',
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {cat.name}
                                            </Typography>
                                            {count != null && (
                                                <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', mr: 0.5, flexShrink: 0 }}>
                                                    {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                                                </Typography>
                                            )}
                                            {(isCategorySelected || hasSelectedChild) && (
                                                <CheckCircleIcon
                                                    sx={{ fontSize: 16, color: '#B794F6', flexShrink: 0, ml: 0.5 }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                    {/* Danh mục con */}
                                    {hasChildren && isExpanded && (
                                        <Box sx={{ pl: 2.5, borderLeft: '2px solid rgba(157,110,237,0.3)', ml: 2.5, mr: 1, py: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                            {cat.children.map((child) => {
                                                const childId = child.id ?? child.categoryId;
                                                const ChildIcon = getCategoryIcon(child.name);
                                                const childCount = child.listingCount ?? child.count ?? null;

                                                const parentId =
                                                    child.parentId ??
                                                    child.parent_id ??
                                                    catIdStr;
                                                const isChildSelected =
                                                    String(parentId) === String(selectedCategory) &&
                                                    String(childId ?? child.name) === String(selectedSubcategory);

                                                return (
                                                    <Box
                                                        key={childId ?? child.name}
                                                        onClick={() => {
                                                            const subId = childId ?? encodeURIComponent(child.name);
                                                            const params = new URLSearchParams(searchParams);
                                                            params.set('category', parentId);
                                                            params.set('subcategory', subId);
                                                            params.delete('page');
                                                            navigate(`/feed?${params.toString()}`);
                                                        }}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            px: 1.5,
                                                            py: 0.875,
                                                            gap: 1.25,
                                                            cursor: 'pointer',
                                                            borderRadius: '8px',
                                                            transition: 'background-color 0.2s',
                                                            bgcolor: isChildSelected ? 'rgba(157,110,237,0.16)' : 'transparent',
                                                            '&:hover': { bgcolor: 'rgba(157,110,237,0.1)' },
                                                        }}
                                                    >
                                                        <ChildIcon
                                                            sx={{
                                                                fontSize: 16,
                                                                color: isChildSelected ? '#C4A1FF' : 'rgba(157,110,237,0.85)',
                                                                flexShrink: 0,
                                                            }}
                                                        />
                                                        <Typography
                                                            sx={{
                                                                fontSize: '12px',
                                                                color: isChildSelected
                                                                    ? '#EDE9FE'
                                                                    : 'rgba(255,255,255,0.8)',
                                                                flex: 1,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {child.name}
                                                        </Typography>
                                                        {childCount != null && (
                                                            <Typography
                                                                sx={{
                                                                    fontSize: '11px',
                                                                    color: isChildSelected
                                                                        ? 'rgba(255,255,255,0.85)'
                                                                        : 'rgba(255,255,255,0.45)',
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                {childCount >= 1000 ? `${(childCount / 1000).toFixed(1)}k` : childCount}
                                                            </Typography>
                                                        )}
                                                        {isChildSelected && (
                                                            <CheckCircleIcon
                                                                sx={{ fontSize: 14, color: '#C4A1FF', flexShrink: 0, ml: 0.5 }}
                                                            />
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}
                                    {idx < categoryTree.length - 1 && (
                                        <Divider sx={{ mx: 1.5, borderColor: 'rgba(255,255,255,0.05)' }} />
                                    )}
                                </Box>
                            );
                        })}
                    </>
                )}
            </Box>

            {/* Banner cộng đồng */}
            <Box
                sx={{
                    background: 'linear-gradient(145deg, #6D28D9 0%, #8B5CF6 50%, #A78BFA 100%)',
                    borderRadius: '16px',
                    p: 2.25,
                    mt: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                }}
            >
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#EDE9FE', lineHeight: 1.45, mb: 1.5, pr: 4 }}>
                    Tham gia cộng đồng mua bán cùng SLIFE!
                </Typography>
                <Button
                    onClick={() => {
                        if (!isAuthenticated) {
                            navigate('/login', { state: { from: '/listings/new', message: 'Bạn cần đăng nhập để đăng tin' } });
                            return;
                        }
                        navigate('/listings/new');
                    }}
                    sx={{
                        bgcolor: '#FFF',
                        color: '#6D28D9',
                        fontSize: '12px',
                        fontWeight: 700,
                        px: 2,
                        py: 0.75,
                        borderRadius: '10px',
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        '&:hover': { bgcolor: '#FFF', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
                    }}
                >
                    Đăng tin ngay
                </Button>
                <Typography sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 32, opacity: 0.35, pointerEvents: 'none' }}>
                    📢
                </Typography>
            </Box>

        </Box>
    );
}
