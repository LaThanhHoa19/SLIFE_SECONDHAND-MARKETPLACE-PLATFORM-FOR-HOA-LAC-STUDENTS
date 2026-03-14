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
    KeyboardArrowRight as ArrowRightIcon,
    Refresh as RefreshIcon,
    ChevronRight as ChevronRightIcon,
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
                // Khi API trả cây cha-con: mở sẵn danh mục cha đầu tiên có con để dễ thấy cấu trúc
                const tree = buildCategoryTree(arr);
                const firstWithChildren = tree.find((n) => n.children?.length > 0);
                if (firstWithChildren?.id != null) {
                    setExpandedParents((prev) => (prev.size ? prev : new Set([firstWithChildren.id])));
                }
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
                    onClick={() => {
                        if (!isAuthenticated) {
                            navigate('/login', { state: { from: '/listings/new', message: 'Bạn cần đăng nhập để đăng tin' } });
                            return;
                        }
                        navigate('/listings/new');
                    }}
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

            {/* Danh mục cha-con: chỉ hiện danh mục GỐC (cha); bấm mũi tên để xem danh mục con */}
            <Box sx={{ bgcolor: '#2A2733', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                        Danh mục hàng đầu
                    </Typography>
                    <Typography sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>
                        Bấm mũi tên để mở danh mục con
                    </Typography>
                </Box>
                {catLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Box key={i} sx={{ px: 2, py: 1.2 }}>
                            <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 1 }} />
                        </Box>
                    ))
                ) : categoryTree.length === 0 ? (
                    <Box sx={{ px: 2, py: 2 }}>
                        <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                            Không có danh mục
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
                            return (
                                <Box key={catId ?? cat.name}>
                                    {/* Hàng danh mục CHA: icon thư mục + mũi tên mở/đóng */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            px: 2,
                                            py: 1,
                                            gap: 1,
                                            cursor: 'pointer',
                                            bgcolor: hasChildren ? 'rgba(255,255,255,0.02)' : 'transparent',
                                            '&:hover': { bgcolor: 'rgba(157,110,237,0.1)' },
                                        }}
                                    >
                                        <Box
                                            sx={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (hasChildren) toggleCategoryExpand(catId);
                                            }}
                                        >
                                            {hasChildren ? (
                                                <IconButton size="small" sx={{ p: 0, color: '#9D6EED' }} aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}>
                                                    {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 18 }} /> : <ArrowRightIcon sx={{ fontSize: 18 }} />}
                                                </IconButton>
                                            ) : (
                                                <Box sx={{ width: 18, height: 18 }} />
                                            )}
                                        </Box>
                                        <Box
                                            onClick={() => navigate(`/?category=${catId ?? encodeURIComponent(cat.name)}`)}
                                            sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1, minWidth: 0 }}
                                        >
                                            {hasChildren ? (
                                                isExpanded ? <FolderOpenIcon sx={{ fontSize: 18, color: '#9D6EED', flexShrink: 0 }} /> : <FolderIcon sx={{ fontSize: 18, color: '#9D6EED', flexShrink: 0 }} />
                                            ) : (
                                                <Icon sx={{ fontSize: 16, color: '#9D6EED', flexShrink: 0 }} />
                                            )}
                                            <Typography sx={{ fontSize: '12px', fontWeight: hasChildren ? 600 : 400, color: 'rgba(255,255,255,0.85)', flex: 1,
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
                                    </Box>
                                    {/* Danh mục CON: chỉ hiện khi mở rộng cha, thụt vào + gạch nối */}
                                    {hasChildren && isExpanded && (
                                        <Box sx={{ pl: 3, borderLeft: '2px solid rgba(157,110,237,0.35)', ml: 2, mr: 0, py: 0.5 }}>
                                            {cat.children.map((child) => {
                                                const childId = child.id ?? child.categoryId;
                                                const ChildIcon = getCategoryIcon(child.name);
                                                const childCount = child.listingCount ?? child.count ?? null;
                                                return (
                                                    <Box
                                                        key={childId ?? child.name}
                                                        onClick={() => navigate(`/?category=${childId ?? encodeURIComponent(child.name)}`)}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            px: 1.5,
                                                            py: 0.75,
                                                            gap: 1,
                                                            cursor: 'pointer',
                                                            borderLeft: '2px solid transparent',
                                                            '&:hover': { bgcolor: 'rgba(157,110,237,0.08)' },
                                                        }}
                                                    >
                                                        <Typography component="span" sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>└</Typography>
                                                        <ChildIcon sx={{ fontSize: 14, color: 'rgba(157,110,237,0.9)', flexShrink: 0 }} />
                                                        <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', flex: 1,
                                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {child.name}
                                                        </Typography>
                                                        {childCount != null && (
                                                            <Typography sx={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                                                                {childCount >= 1000 ? `${(childCount / 1000).toFixed(1)}k` : childCount}
                                                            </Typography>
                                                        )}
                                                        <ChevronRightIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    )}
                                    {idx < categoryTree.length - 1 && (
                                        <Divider sx={{ mx: 2, borderColor: 'rgba(255,255,255,0.07)' }} />
                                    )}
                                </Box>
                            );
                        })}
                    </>
                )}
            </Box>

        </Box>
    );
}
