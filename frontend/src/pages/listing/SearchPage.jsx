import {
    Box,
    Chip,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Popover,
    Button,
    IconButton,
} from '@mui/material';
import {
    ViewList as ViewListIcon,
    GridView as GridViewIcon,
    Tune as TuneIcon,
    AttachMoney as AttachMoneyIcon,
    LocationOn as LocationOnIcon,
    Category as CategoryIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    FlashOn as FlashOnIcon,
    Lightbulb as LightbulbIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ListingsFeed from '../../components/listing/ListingsFeed';
import useListings from '../../hooks/useListings';
import { getLocations } from '../../api/locationApi';
import { getCategories } from '../../api/categoryApi';
import { useAuth } from '../../hooks/useAuth';

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
    const { isAuthenticated } = useAuth();

    const [locations, setLocations] = useState([]);
    const [categories, setCategories] = useState([]);
    const [priceAnchorEl, setPriceAnchorEl] = useState(null);
    const [locationAnchorEl, setLocationAnchorEl] = useState(null);
    const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
    const [draftMinPrice, setDraftMinPrice] = useState('');
    const [draftMaxPrice, setDraftMaxPrice] = useState('');
    const [advancedAnchorEl, setAdvancedAnchorEl] = useState(null);

    const getEmptyDraft = useCallback(() => ({
        q: '',
        category: '',
        location: '',
        sort: 'createdAt,desc',
        condition: '',
        hasVideo: false,
        minPrice: '',
        maxPrice: '',
    }), []);

    const [draft, setDraft] = useState(getEmptyDraft);

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

    useEffect(() => {
        setDraft({
            q,
            category,
            location,
            sort,
            condition,
            hasVideo,
            minPrice,
            maxPrice,
        });
    }, [q, category, location, sort, condition, hasVideo, minPrice, maxPrice]);

    const applyDraft = useCallback((d) => {
        const params = new URLSearchParams();
        if (d.q) params.set('q', d.q);
        if (d.category) params.set('category', d.category);
        if (d.location) params.set('location', d.location);
        if (d.sort && d.sort !== 'createdAt,desc') params.set('sort', d.sort);
        if (d.condition) params.set('condition', d.condition);
        if (d.hasVideo) params.set('hasVideo', 'true');
        if (d.minPrice) params.set('minPrice', d.minPrice);
        if (d.maxPrice) params.set('maxPrice', d.maxPrice);
        navigate(`/search?${params.toString()}`);
    }, [navigate]);

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
                    maxWidth: 1220, // 868 (left như cũ) + 320 (right mới) + ~32px gap
                    mx: 'auto',
                    display: 'grid',
                    gridTemplateColumns: '868px 320px',
                    columnGap: 4,
                    alignItems: 'flex-start',
                }}
            >
                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Search header */}
                    <Box
                        sx={{
                            borderRadius: 4,
                            px: 3,
                            py: 2.5,
                            bgcolor: 'transparent',
                            border: '1px solid rgba(55,65,81,0.7)',
                            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.75,
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
                                    onClick={() => {
                                        const empty = getEmptyDraft();
                                        setDraft(empty);
                                        applyDraft(empty);
                                    }}
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
                                    onDelete={() => {
                                        const next = { ...draft, q: '' };
                                        setDraft(next);
                                        applyDraft(next);
                                    }}
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
                                    onDelete={() => {
                                        const next = { ...draft, location: '' };
                                        setDraft(next);
                                        applyDraft(next);
                                    }}
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
                                    onDelete={() => {
                                        const next = { ...draft, category: '' };
                                        setDraft(next);
                                        applyDraft(next);
                                    }}
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
                                    onDelete={() => {
                                        const next = { ...draft, condition: '' };
                                        setDraft(next);
                                        applyDraft(next);
                                    }}
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
                                    <TuneIcon sx={{ fontSize: 16, mr: 0.5 }} />
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
                                        setDraftMinPrice(draft.minPrice);
                                        setDraftMaxPrice(draft.maxPrice);
                                        setPriceAnchorEl(e.currentTarget);
                                    }}
                                    sx={{
                                        justifyContent: 'flex-start',
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
                                    <AttachMoneyIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.9 }} />
                                    {!draft.minPrice && !draft.maxPrice
                                        ? 'Chọn khoảng giá'
                                        : draft.minPrice && draft.maxPrice
                                            ? `₫${draft.minPrice} - ₫${draft.maxPrice}`
                                            : draft.minPrice
                                                ? `≥ ₫${draft.minPrice}`
                                                : `≤ ₫${draft.maxPrice}`}
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
                                        justifyContent: 'flex-start',
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
                                    <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.9 }} />
                                    {draft.location || 'Tất cả khu vực'}
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
                                        justifyContent: 'flex-start',
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
                                    <CategoryIcon sx={{ fontSize: 16, mr: 0.5, opacity: 0.9 }} />
                                    {draft.category ? (flatCategories.find((c) => String(c.id ?? c.categoryId ?? c.name) === draft.category)?.name || 'Đã chọn danh mục') : 'Tất cả danh mục'}
                                </Button>
                            </Box>

                            <Box sx={{ flexGrow: 1 }} />

                            <Button
                                variant="contained"
                                onClick={() => applyDraft(draft)}
                                startIcon={<SearchIcon />}
                                sx={{
                                    alignSelf: 'flex-end',
                                    textTransform: 'none',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    px: 2.5,
                                    py: 1,
                                    borderRadius: 2,
                                    bgcolor: '#9D6EED',
                                    '&:hover': { bgcolor: '#8A5BDF' },
                                }}
                            >
                                Áp dụng bộ lọc
                            </Button>
                        </Box>

                    </Box>

                    {/* Sort & view bar – nằm ngoài khung header, phía trên danh sách */}
                    <Box
                        sx={{
                            mt: 1.5,
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1.5,
                        }}
                    >
                        {/* Nhóm sắp xếp bên trái */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <ToggleButtonGroup
                                exclusive
                                value={draft.sort}
                                onChange={(_, val) => setDraft((prev) => ({ ...prev, sort: val || 'createdAt,desc' }))}
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
                                            bgcolor: '#9D6EED',
                                            color: '#FFFFFF',
                                            borderColor: '#9D6EED',
                                            boxShadow: '0 0 0 1px rgba(157,110,237,0.6)',
                                        },
                                    },
                                }}
                            >
                                <ToggleButton value="createdAt,desc">
                                    <ArrowUpwardIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                    Mới nhất
                                </ToggleButton>
                                <ToggleButton value="createdAt,asc">
                                    <ArrowDownwardIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                    Cũ nhất
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {/* Nhóm dạng hiển thị bên phải */}
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

                    {/* Results */}
                    <Box sx={{ mt: 0.5, pb: 4 }}>
                        <ListingsFeed
                            listings={data}
                            isLoading={isLoading}
                            viewMode={viewMode}
                            cardVariant="fullWidth"
                            imageAspect={viewMode === 'list' ? 'compactList' : undefined}
                        />
                    </Box>
                </Box>

                {/* Right suggestion column */}
                <Box
                    sx={{
                        width: 320,
                        minWidth: 320,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            borderRadius: 3,
                            px: 2.5,
                            py: 2.2,
                            bgcolor: 'linear-gradient(145deg, #020617 0%, #020617 40%, #111827 70%, #1d2240 100%)',
                            border: '1px solid rgba(56,189,248,0.45)',
                            boxShadow: '0 18px 40px rgba(15,23,42,0.9)',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: '#E5E7EB',
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                            }}
                        >
                            <FlashOnIcon sx={{ fontSize: 18, color: '#60A5FA' }} />
                            Gợi ý nhanh
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: 'rgba(148,163,184,0.95)', mb: 1.5 }}>
                            Thử một số từ khóa và danh mục phổ biến bên dưới.
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.1 }}>
                            {['Giáo trình', 'Đồ điện tử', 'Đồ dùng KTX', 'Đồ gia dụng'].map((label) => (
                                <Chip
                                    key={label}
                                    label={label}
                                    size="small"
                                    onClick={() => {
                                        setDraft((prev) => ({ ...prev, q: label }));
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
                            px: 2.5,
                            py: 2.1,
                            bgcolor: 'linear-gradient(145deg, #020617 0%, #020617 40%, #111827 70%, #1d2240 100%)',
                            border: '1px solid rgba(56,189,248,0.45)',
                            boxShadow: '0 18px 40px rgba(15,23,42,0.9)',
                        }}
                    >
                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', mb: 1 }}>
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                                <LightbulbIcon sx={{ fontSize: 18, color: '#FACC15' }} />
                                Mẹo tìm kiếm
                            </Box>
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, m: 0, color: 'rgba(161,161,170,0.95)', fontSize: 13, lineHeight: 1.7 }}>
                            <li>Ưu tiên dùng tên cụ thể: “Logitech G304”, “IKEA bàn học”.</li>
                            <li>Kết hợp với khu vực để thu hẹp kết quả.</li>
                            <li>Dùng sắp xếp theo giá để so sánh nhanh.</li>
                        </Box>
                    </Box>

                    {/* Banner cộng đồng – reuse design from RightPanel */}
                    <Box
                        sx={{
                            background: 'linear-gradient(145deg, #6D28D9 0%, #8B5CF6 50%, #A78BFA 100%)',
                            borderRadius: 3,
                            p: 2.25,
                            mt: 1.5,
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#EDE9FE',
                                lineHeight: 1.45,
                                mb: 1.5,
                                pr: 4,
                            }}
                        >
                            Tham gia cộng đồng mua bán cùng SLIFE!
                        </Typography>
                        <Button
                            onClick={() => {
                                if (!isAuthenticated) {
                                    navigate('/login', {
                                        state: {
                                            from: '/listings/new',
                                            message: 'Bạn cần đăng nhập để đăng tin',
                                        },
                                    });
                                    return;
                                }
                                navigate('/listings/new');
                            }}
                            sx={{
                                bgcolor: '#FFF',
                                color: '#6D28D9',
                                fontSize: 12,
                                fontWeight: 700,
                                px: 2,
                                py: 0.75,
                                borderRadius: '10px',
                                textTransform: 'none',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                                '&:hover': {
                                    bgcolor: '#FFF',
                                    transform: 'translateY(-1px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                },
                            }}
                        >
                            Đăng tin ngay
                        </Button>
                        <Typography
                            sx={{
                                position: 'absolute',
                                right: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: 32,
                                opacity: 0.35,
                                pointerEvents: 'none',
                            }}
                        >
                            📢
                        </Typography>
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
                    selected={!draft.location}
                    onClick={() => {
                        setDraft((prev) => ({ ...prev, location: '' }));
                        setLocationAnchorEl(null);
                    }}
                    sx={{ fontSize: 13, color: '#E5E7EB' }}
                >
                    Tất cả khu vực
                </MenuItem>
                {locations.map((loc) => (
                    <MenuItem
                        key={loc}
                        selected={draft.location === loc}
                        onClick={() => {
                            setDraft((prev) => ({ ...prev, location: loc }));
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
                        selected={!draft.category}
                        onClick={() => {
                            setDraft((prev) => ({ ...prev, category: '' }));
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
                                    selected={draft.category === parentId}
                                    onClick={() => {
                                        setDraft((prev) => ({ ...prev, category: parentId }));
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
                                                selected={draft.category === childId}
                                                onClick={() => {
                                                    setDraft((prev) => ({ ...prev, category: childId }));
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
                            setDraft((prev) => ({ ...prev, minPrice: '', maxPrice: '' }));
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
                            setDraft((prev) => ({ ...prev, minPrice: draftMinPrice, maxPrice: draftMaxPrice }));
                            setPriceAnchorEl(null);
                        }}
                        sx={{
                            textTransform: 'none',
                            fontSize: 13,
                            px: 2,
                            bgcolor: '#9D6EED',
                            '&:hover': { bgcolor: '#8A5BDF' },
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
                        value={draft.condition}
                        onChange={(_, val) => setDraft((prev) => ({ ...prev, condition: val || '' }))}
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
                        value={draft.hasVideo ? 'yes' : ''}
                        onChange={(_, val) => setDraft((prev) => ({ ...prev, hasVideo: val === 'yes' }))}
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
                            setDraft((prev) => ({ ...prev, condition: '', hasVideo: false }));
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
                            bgcolor: '#9D6EED',
                            '&:hover': { bgcolor: '#8A5BDF' },
                        }}
                    >
                        Đóng
                    </Button>
                </Box>
            </Popover>
        </Box>
    );
}

