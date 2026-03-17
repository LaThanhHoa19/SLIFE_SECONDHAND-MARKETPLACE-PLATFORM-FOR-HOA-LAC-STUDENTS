import { Box, Chip, Typography, ToggleButton, ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem, TextField, Popover, Button, IconButton } from '@mui/material';
import { ViewList as ViewListIcon, GridView as GridViewIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ListingsFeed from '../../components/listing/ListingsFeed';
import useListings from '../../hooks/useListings';
import { getLocations } from '../../api/locationApi';
import { getCategories } from '../../api/categoryApi';

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

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [priceAnchorEl, setPriceAnchorEl] = useState(null);
    const [locationAnchorEl, setLocationAnchorEl] = useState(null);
    const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
    const [draftMinPrice, setDraftMinPrice] = useState('');
    const [draftMaxPrice, setDraftMaxPrice] = useState('');
    const [advancedAnchorEl, setAdvancedAnchorEl] = useState(null);

    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const location = searchParams.get('location') || '';
    const sort = searchParams.get('sort') || 'createdAt,desc';
    const condition = searchParams.get('condition') || '';
    const hasVideo = searchParams.get('hasVideo') === 'true';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const page = Number(searchParams.get('page') || 0);
    const size = Number(searchParams.get('size') || 20);

    const { data, isLoading, meta } = useListings({
        q,
        category,
        location,
        sort,
        condition,
        hasVideo,
        minPrice,
        maxPrice,
        page,
        size,
    });

    useEffect(() => {
        getLocations()
            .then(({ data: res }) => {
                const list = res?.data ?? res ?? [];
                setLocations(Array.isArray(list) ? list : []);
            })
            .catch(() => setLocations([]));

        getCategories()
            .then(({ data: res }) => {
                const list = res?.data ?? res ?? [];
                setCategories(Array.isArray(list) ? list : []);
            })
            .catch(() => setCategories([]));
    }, []);

    const setParam = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete('page');
        navigate(`/search?${params.toString()}`);
    };

    const hasFilter = !!(category || location || condition || hasVideo || q || minPrice || maxPrice);

    const categoryTree = buildCategoryTree(categories);
    const flatCategories = categoryTree.flatMap((parent) => [
        parent,
        ...(Array.isArray(parent.children) ? parent.children : []),
    ]);
    const selectedCategoryLabel =
        flatCategories.find((c) => String(c.id ?? c.categoryId ?? c.name) === category)?.name || '';
    const [viewMode, setViewMode] = useState('list');

    return (
        <Box sx={{ px: 3, py: 2 }}>
            <Box
                sx={{
                    maxWidth: 1160,
                    mx: 'auto',
                    display: 'flex',
                    gap: 2.5,
                    alignItems: 'flex-start',
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Search header */}
                    <Box
                        sx={{
                            borderRadius: 3,
                            px: 3,
                            py: 2.25,
                            bgcolor: 'linear-gradient(135deg, rgba(30,64,175,0.32), rgba(76,29,149,0.55))',
                            border: '1px solid rgba(129,140,248,0.55)',
                            boxShadow: '0 18px 45px rgba(15,23,42,0.75)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                        }}
                    >
                        {/* Title row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB' }}>
                                {isLoading ? 'Đang tìm kiếm...' : 'Kết quả tìm kiếm'}
                            </Typography>
                            {q && (
                                <Typography sx={{ fontSize: 14, color: 'rgba(226,232,240,0.9)' }}>
                                    cho&nbsp;
                                    <Box component="span" sx={{ fontWeight: 600, color: '#E0E7FF' }}>
                                        “{q}”
                                    </Box>
                                </Typography>
                            )}
                            {!isLoading && (
                                <Typography sx={{ fontSize: 12, color: 'rgba(209,213,219,0.9)' }}>
                                    · {meta.totalElements ?? 0} tin phù hợp
                                </Typography>
                            )}
                            <Box sx={{ flexGrow: 1 }} />
                            {hasFilter && (
                                <Chip
                                    label="Xóa tất cả"
                                    size="small"
                                    onClick={() => navigate('/search')}
                                    sx={{
                                        bgcolor: 'transparent',
                                        color: '#E5E7EB',
                                        borderRadius: '999px',
                                        border: '1px solid rgba(148,163,184,0.65)',
                                        fontSize: 12,
                                        '&:hover': {
                                            bgcolor: 'rgba(15,23,42,0.35)',
                                        },
                                    }}
                                />
                            )}
                        </Box>

                        {/* Active filter chips */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {q && (
                                <Chip
                                    label={`Từ khóa: ${q}`}
                                    size="small"
                                    onDelete={() => setParam('q', '')}
                                    sx={{
                                        bgcolor: 'rgba(129,140,248,0.28)',
                                        color: '#F5F3FF',
                                        borderRadius: '999px',
                                        '& .MuiChip-deleteIcon': { color: 'rgba(248,250,252,0.85)' },
                                    }}
                                />
                            )}
                            {location && (
                                <Chip
                                    label={`Khu vực: ${location}`}
                                    size="small"
                                    onDelete={() => setParam('location', '')}
                                    sx={{
                                        bgcolor: 'rgba(56,189,248,0.24)',
                                        color: '#ECFEFF',
                                        borderRadius: '999px',
                                    }}
                                />
                            )}
                            {category && (
                                <Chip
                                    label={`Danh mục: ${selectedCategoryLabel || category}`}
                                    size="small"
                                    onDelete={() => setParam('category', '')}
                                    sx={{
                                        bgcolor: 'rgba(45,212,191,0.24)',
                                        color: '#CCFBF1',
                                        borderRadius: '999px',
                                    }}
                                />
                            )}
                            {condition && (
                                <Chip
                                    label={condition === 'NEW' ? 'Tình trạng: Mới' : 'Tình trạng: Đã sử dụng'}
                                    size="small"
                                    onDelete={() => setParam('condition', '')}
                                    sx={{
                                        bgcolor: 'rgba(248,250,252,0.12)',
                                        color: '#F9FAFB',
                                        borderRadius: '999px',
                                    }}
                                />
                            )}
                        </Box>

                        {/* Inline filters (lọc nâng cao, giá, khu vực, danh mục) */}
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2.5,
                                flexWrap: 'wrap',
                                alignItems: 'center',
                            }}
                        >
                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        color: 'rgba(226,232,240,0.9)',
                                        mb: 0.75,
                                        letterSpacing: 0.12,
                                    }}
                                >
                                    Lọc nâng cao
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={(e) => setAdvancedAnchorEl(e.currentTarget)}
                                    sx={{
                                        textTransform: 'none',
                                        fontSize: 12,
                                        borderRadius: 999,
                                        borderColor: 'rgba(148,163,184,0.7)',
                                        color: '#E5E7EB',
                                        px: 1.8,
                                        bgcolor: 'rgba(15,23,42,0.7)',
                                        '&:hover': {
                                            borderColor: 'rgba(129,140,248,0.9)',
                                            bgcolor: 'rgba(30,64,175,0.5)',
                                        },
                                    }}
                                >
                                    Mở lọc nâng cao
                                </Button>
                            </Box>

                            <Box sx={{ minWidth: 180 }}>
                                <Typography
                                    sx={{
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        color: 'rgba(226,232,240,0.9)',
                                        mb: 0.75,
                                        letterSpacing: 0.12,
                                    }}
                                >
                                    Giá
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={(e) => {
                                        setDraftMinPrice(minPrice);
                                        setDraftMaxPrice(maxPrice);
                                        setPriceAnchorEl(e.currentTarget);
                                    }}
                                    sx={{
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        borderRadius: 999,
                                        borderColor: 'rgba(148,163,184,0.55)',
                                        color: '#E5E7EB',
                                        textTransform: 'none',
                                        fontSize: 13,
                                        px: 1.75,
                                        bgcolor: 'rgba(15,23,42,0.55)',
                                        '&:hover': {
                                            borderColor: 'rgba(129,140,248,0.9)',
                                            bgcolor: 'rgba(30,64,175,0.4)',
                                        },
                                    }}
                                >
                                    {!minPrice && !maxPrice
                                        ? 'Chọn khoảng giá'
                                        : minPrice && maxPrice
                                            ? `₫${minPrice} - ₫${maxPrice}`
                                            : minPrice
                                                ? `≥ ₫${minPrice}`
                                                : `≤ ₫${maxPrice}`}
                                </Button>
                            </Box>

                            <Box sx={{ minWidth: 180 }}>
                                <Typography
                                    sx={{
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        color: 'rgba(226,232,240,0.9)',
                                        mb: 0.75,
                                        letterSpacing: 0.12,
                                    }}
                                >
                                    Khu vực
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={(e) => setLocationAnchorEl(e.currentTarget)}
                                    sx={{
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        borderRadius: 999,
                                        borderColor: 'rgba(148,163,184,0.55)',
                                        color: '#E5E7EB',
                                        textTransform: 'none',
                                        fontSize: 13,
                                        px: 1.75,
                                        bgcolor: 'rgba(15,23,42,0.55)',
                                        '&:hover': {
                                            borderColor: 'rgba(129,140,248,0.9)',
                                            bgcolor: 'rgba(30,64,175,0.4)',
                                        },
                                    }}
                                >
                                    {location || 'Tất cả khu vực'}
                                </Button>
                            </Box>

                            <Box sx={{ minWidth: 200 }}>
                                <Typography
                                    sx={{
                                        fontSize: 11,
                                        textTransform: 'uppercase',
                                        color: 'rgba(226,232,240,0.9)',
                                        mb: 0.75,
                                        letterSpacing: 0.12,
                                    }}
                                >
                                    Danh mục
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={(e) => setCategoryAnchorEl(e.currentTarget)}
                                    sx={{
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        borderRadius: 999,
                                        borderColor: 'rgba(148,163,184,0.55)',
                                        color: '#E5E7EB',
                                        textTransform: 'none',
                                        fontSize: 13,
                                        px: 1.75,
                                        bgcolor: 'rgba(15,23,42,0.55)',
                                        '&:hover': {
                                            borderColor: 'rgba(129,140,248,0.9)',
                                            bgcolor: 'rgba(30,64,175,0.4)',
                                        },
                                    }}
                                >
                                    {category ? selectedCategoryLabel || 'Đã chọn danh mục' : 'Tất cả danh mục'}
                                </Button>
                            </Box>

                            <Box sx={{ flexGrow: 1 }} />

                        </Box>

                        {/* Sort & view bar */}
                        <Box
                            sx={{
                                mt: 1,
                                mb: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 1.5,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <ToggleButtonGroup
                                    exclusive
                                    value={sort}
                                    onChange={(_, val) => setParam('sort', val || 'createdAt,desc')}
                                    size="small"
                                    sx={{
                                        '& .MuiToggleButton-root': {
                                            textTransform: 'none',
                                            fontSize: 12,
                                            px: 1.4,
                                            color: 'rgba(226,232,240,0.9)',
                                            borderColor: 'rgba(148,163,184,0.35)',
                                            bgcolor: 'transparent',
                                            '&.Mui-selected': {
                                                bgcolor: 'rgba(129,140,248,0.18)',
                                                color: '#F9FAFB',
                                                borderColor: 'rgba(129,140,248,0.9)',
                                            },
                                        },
                                    }}
                                >
                                    <ToggleButton value="createdAt,desc">Mới nhất</ToggleButton>
                                    <ToggleButton value="createdAt,asc">Cũ nhất</ToggleButton>
                                </ToggleButtonGroup>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontSize: 12, color: 'rgba(148,163,184,0.95)' }}>
                                        Dạng hiển thị:
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setViewMode('list')}
                                        sx={{
                                            color: viewMode === 'list' ? '#E5E7EB' : 'rgba(148,163,184,0.9)',
                                            bgcolor: viewMode === 'list' ? 'rgba(129,140,248,0.25)' : 'transparent',
                                            borderRadius: 2,
                                        }}
                                        title="Dạng danh sách"
                                    >
                                        <ViewListIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => setViewMode('grid')}
                                        sx={{
                                            color: viewMode === 'grid' ? '#E5E7EB' : 'rgba(148,163,184,0.9)',
                                            bgcolor: viewMode === 'grid' ? 'rgba(129,140,248,0.25)' : 'transparent',
                                            borderRadius: 2,
                                        }}
                                        title="Dạng lưới"
                                    >
                                        <GridViewIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Box>

                    </Box>

                    {/* Results */}
                    <Box sx={{ mt: 0.5, pb: 4 }}>
                        <ListingsFeed listings={data} isLoading={isLoading} viewMode={viewMode} />
                    </Box>
                </Box>

                {/* Right suggestion column */}
                <Box
                    sx={{
                        width: 260,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            borderRadius: 3,
                            px: 2,
                            py: 1.75,
                            bgcolor: 'rgba(15,23,42,0.9)',
                            border: '1px solid rgba(148,163,184,0.4)',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#E5E7EB',
                                mb: 1,
                            }}
                        >
                            Gợi ý nhanh
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: 'rgba(148,163,184,0.95)', mb: 1.25 }}>
                            Thử một số từ khóa và danh mục phổ biến bên dưới.
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {['Giáo trình', 'Đồ điện tử', 'Đồ dùng KTX', 'Đồ gia dụng'].map((label) => (
                                <Chip
                                    key={label}
                                    label={label}
                                    size="small"
                                    onClick={() => {
                                        setParam('q', label);
                                    }}
                                    sx={{
                                        borderRadius: '999px',
                                        bgcolor: 'rgba(30,64,175,0.35)',
                                        color: '#E0E7FF',
                                        fontSize: 12,
                                        px: 1.25,
                                        py: 0.25,
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            borderRadius: 3,
                            px: 2,
                            py: 1.75,
                            bgcolor: 'rgba(24,24,27,0.95)',
                            border: '1px solid rgba(63,63,70,0.9)',
                        }}
                    >
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB', mb: 0.75 }}>
                            Mẹo tìm kiếm
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0, color: 'rgba(161,161,170,0.95)', fontSize: 12, lineHeight: 1.6 }}>
                            <li>Ưu tiên dùng tên cụ thể: “Logitech G304”, “IKEA bàn học”.</li>
                            <li>Kết hợp với khu vực để thu hẹp kết quả.</li>
                            <li>Dùng sắp xếp theo giá để so sánh nhanh.</li>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Khu vực Popover */}
            <Popover
                open={Boolean(locationAnchorEl)}
                anchorEl={locationAnchorEl}
                onClose={() => setLocationAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            px: 2,
                            py: 1.75,
                            borderRadius: 2,
                            bgcolor: 'rgba(15,23,42,0.98)',
                            border: '1px solid rgba(148,163,184,0.7)',
                            minWidth: 260,
                            maxHeight: 320,
                            overflowY: 'auto',
                        },
                    },
                }}
            >
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', mb: 1 }}>
                    Chọn khu vực
                </Typography>
                <MenuItem
                    selected={!location}
                    onClick={() => {
                        setParam('location', '');
                        setLocationAnchorEl(null);
                    }}
                    sx={{ fontSize: 13, color: '#E5E7EB' }}
                >
                    Tất cả khu vực
                </MenuItem>
                {locations.map((loc) => (
                    <MenuItem
                        key={loc}
                        selected={location === loc}
                        onClick={() => {
                            setParam('location', loc);
                            setLocationAnchorEl(null);
                        }}
                        sx={{ fontSize: 13, color: '#E5E7EB' }}
                    >
                        {loc}
                    </MenuItem>
                ))}
            </Popover>

            {/* Danh mục Popover */}
            <Popover
                open={Boolean(categoryAnchorEl)}
                anchorEl={categoryAnchorEl}
                onClose={() => setCategoryAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            px: 0,
                            py: 0,
                            borderRadius: 3,
                            bgcolor: 'rgba(15,23,42,0.98)',
                            border: '1px solid rgba(148,163,184,0.7)',
                            minWidth: 300,
                            maxHeight: 360,
                            overflow: 'hidden',
                            boxShadow: '0 18px 45px rgba(15,23,42,0.85)',
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        px: 2,
                        py: 1.75,
                        maxHeight: 360,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': { width: 3 },
                        '&::-webkit-scrollbar-thumb': {
                            bgcolor: 'rgba(148,163,184,0.5)',
                            borderRadius: 999,
                        },
                        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    }}
                >
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', mb: 1 }}>
                        Chọn danh mục
                    </Typography>
                    <MenuItem
                        selected={!category}
                        onClick={() => {
                            setParam('category', '');
                            setCategoryAnchorEl(null);
                        }}
                        sx={{ fontSize: 13, color: '#E5E7EB' }}
                    >
                        Tất cả danh mục
                    </MenuItem>
                    {categoryTree.map((parent, idx) => {
                        const parentId = String(parent.id ?? parent.categoryId ?? parent.name);
                        const hasChildren = Array.isArray(parent.children) && parent.children.length > 0;
                        return (
                            <Box
                                key={parentId}
                                sx={{
                                    pb: 0.5,
                                    borderBottom:
                                        idx < categoryTree.length - 1 ? '1px solid rgba(55,65,81,0.8)' : 'none',
                                    mb: 0.5,
                                }}
                            >
                                <MenuItem
                                    selected={category === parentId}
                                    onClick={() => {
                                        setParam('category', parentId);
                                        setCategoryAnchorEl(null);
                                    }}
                                    sx={{
                                        fontSize: 13,
                                        color: '#E5E7EB',
                                        fontWeight: 600,
                                        borderRadius: 1,
                                    }}
                                >
                                    {parent.name}
                                </MenuItem>
                                {hasChildren &&
                                    parent.children.map((child) => {
                                        const childId = String(child.id ?? child.categoryId ?? child.name);
                                        return (
                                            <MenuItem
                                                key={childId}
                                                selected={category === childId}
                                                onClick={() => {
                                                    setParam('category', childId);
                                                    setCategoryAnchorEl(null);
                                                }}
                                                sx={{
                                                    fontSize: 13,
                                                    color: '#E5E7EB',
                                                    pl: 3.5,
                                                    borderRadius: 1,
                                                }}
                                            >
                                                {child.name}
                                            </MenuItem>
                                        );
                                    })}
                            </Box>
                        );
                    })}
                </Box>
            </Popover>

            {/* Giá Popover */}
            <Popover
                open={Boolean(priceAnchorEl)}
                anchorEl={priceAnchorEl}
                onClose={() => setPriceAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            px: 2,
                            py: 1.75,
                            borderRadius: 2,
                            bgcolor: 'rgba(15,23,42,0.98)',
                            border: '1px solid rgba(148,163,184,0.7)',
                            minWidth: 260,
                        },
                    },
                }}
            >
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#E5E7EB', mb: 1 }}>
                    Chọn khoảng giá (₫)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                    {[
                        { label: '≤ 100k', min: '', max: '100000' },
                        { label: '100k – 300k', min: '100000', max: '300000' },
                        { label: '300k – 1 triệu', min: '300000', max: '1000000' },
                        { label: '≥ 1 triệu', min: '1000000', max: '' },
                    ].map((p) => (
                        <Chip
                            key={p.label}
                            label={p.label}
                            size="small"
                            onClick={() => {
                                setDraftMinPrice(p.min);
                                setDraftMaxPrice(p.max);
                            }}
                            sx={{
                                borderRadius: 999,
                                bgcolor: 'rgba(30,64,175,0.4)',
                                color: '#E0E7FF',
                                fontSize: 12,
                            }}
                        />
                    ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                    <TextField
                        size="small"
                        type="number"
                        placeholder="Từ"
                        value={draftMinPrice}
                        onChange={(e) => setDraftMinPrice(e.target.value)}
                        sx={{
                            '& .MuiInputBase-root': {
                                bgcolor: 'rgba(15,23,42,0.9)',
                                color: '#E5E7EB',
                                fontSize: 13,
                            },
                            '& fieldset': { borderColor: 'rgba(148,163,184,0.7)' },
                        }}
                        inputProps={{ min: 0 }}
                    />
                    <Typography sx={{ fontSize: 12, color: 'rgba(148,163,184,0.9)' }}>—</Typography>
                    <TextField
                        size="small"
                        type="number"
                        placeholder="Đến"
                        value={draftMaxPrice}
                        onChange={(e) => setDraftMaxPrice(e.target.value)}
                        sx={{
                            '& .MuiInputBase-root': {
                                bgcolor: 'rgba(15,23,42,0.9)',
                                color: '#E5E7EB',
                                fontSize: 13,
                            },
                            '& fieldset': { borderColor: 'rgba(148,163,184,0.7)' },
                        }}
                        inputProps={{ min: 0 }}
                    />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Button
                        variant="text"
                        size="small"
                        onClick={() => {
                            setDraftMinPrice('');
                            setDraftMaxPrice('');
                            setParam('minPrice', '');
                            setParam('maxPrice', '');
                            setPriceAnchorEl(null);
                        }}
                        sx={{ color: 'rgba(148,163,184,0.95)', textTransform: 'none', fontSize: 12 }}
                    >
                        Xóa giá
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            if (draftMinPrice) {
                                params.set('minPrice', draftMinPrice);
                            } else {
                                params.delete('minPrice');
                            }
                            if (draftMaxPrice) {
                                params.set('maxPrice', draftMaxPrice);
                            } else {
                                params.delete('maxPrice');
                            }
                            params.delete('page');
                            navigate(`/search?${params.toString()}`);
                            setPriceAnchorEl(null);
                        }}
                        sx={{
                            textTransform: 'none',
                            fontSize: 13,
                            px: 2,
                            bgcolor: '#6366F1',
                            '&:hover': { bgcolor: '#4F46E5' },
                        }}
                    >
                        Áp dụng
                    </Button>
                </Box>
            </Popover>

            {/* Lọc nâng cao Popover */}
            <Popover
                open={Boolean(advancedAnchorEl)}
                anchorEl={advancedAnchorEl}
                onClose={() => setAdvancedAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            px: 2,
                            py: 2,
                            borderRadius: 3,
                            bgcolor: 'rgba(15,23,42,0.98)',
                            border: '1px solid rgba(148,163,184,0.7)',
                            minWidth: 280,
                            boxShadow: '0 18px 45px rgba(15,23,42,0.85)',
                        },
                    },
                }}
            >
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#E5E7EB', mb: 1.5 }}>
                    Lọc nâng cao
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <Typography
                        sx={{
                            fontSize: 11,
                            textTransform: 'uppercase',
                            color: 'rgba(226,232,240,0.9)',
                            mb: 0.75,
                            letterSpacing: 0.12,
                        }}
                    >
                        Tình trạng
                    </Typography>
                    <ToggleButtonGroup
                        exclusive
                        value={condition}
                        onChange={(_, val) => setParam('condition', val || '')}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                textTransform: 'none',
                                fontSize: 12,
                                px: 1.6,
                                color: 'rgba(226,232,240,0.9)',
                                borderColor: 'rgba(148,163,184,0.4)',
                                bgcolor: 'transparent',
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(167,139,250,0.25)',
                                    color: '#F9FAFB',
                                    borderColor: 'rgba(167,139,250,0.95)',
                                },
                            },
                        }}
                    >
                        <ToggleButton value="">Tất cả</ToggleButton>
                        <ToggleButton value="USED">Đã sử dụng</ToggleButton>
                        <ToggleButton value="NEW">Mới</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography
                        sx={{
                            fontSize: 11,
                            textTransform: 'uppercase',
                            color: 'rgba(226,232,240,0.9)',
                            mb: 0.75,
                            letterSpacing: 0.12,
                        }}
                    >
                        Tin có video
                    </Typography>
                    <ToggleButtonGroup
                        exclusive
                        value={hasVideo ? 'yes' : ''}
                        onChange={(_, val) => setParam('hasVideo', val === 'yes' ? 'true' : '')}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                textTransform: 'none',
                                fontSize: 12,
                                px: 1.6,
                                color: 'rgba(226,232,240,0.9)',
                                borderColor: 'rgba(148,163,184,0.4)',
                                bgcolor: 'transparent',
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(34,197,94,0.25)',
                                    color: '#BBF7D0',
                                    borderColor: 'rgba(34,197,94,0.95)',
                                },
                            },
                        }}
                    >
                        <ToggleButton value="">Tất cả</ToggleButton>
                        <ToggleButton value="yes">Chỉ tin có video</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Button
                        variant="text"
                        size="small"
                        onClick={() => {
                            setParam('condition', '');
                            setParam('hasVideo', '');
                            setAdvancedAnchorEl(null);
                        }}
                        sx={{ color: 'rgba(148,163,184,0.95)', textTransform: 'none', fontSize: 12 }}
                    >
                        Xóa lọc nâng cao
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => setAdvancedAnchorEl(null)}
                        sx={{
                            textTransform: 'none',
                            fontSize: 13,
                            px: 2,
                            bgcolor: '#6366F1',
                            '&:hover': { bgcolor: '#4F46E5' },
                        }}
                    >
                        Đóng
                    </Button>
                </Box>
            </Popover>
        </Box>
    );
}

