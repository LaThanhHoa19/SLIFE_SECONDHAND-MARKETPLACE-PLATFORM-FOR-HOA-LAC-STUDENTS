import { Box, Typography } from '@mui/material';
import {
    KeyboardArrowRight as ArrowRightIcon,
    ExpandMore as ExpandMoreIcon,
    Folder as FolderIcon,
    FolderOpen as FolderOpenIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

export default function CategoryTree({
                                         items = [],
                                         expandedParents = new Set(),
                                         selectedCategory = '',
                                         selectedSubcategory = '',
                                         onToggleParent,
                                         onSelectCategory,
                                         onSelectSubcategory,
                                         getCategoryIcon,
                                         compact = false,
                                     }) {
    return items.map((cat, idx) => {
        const catId = cat.id ?? cat.categoryId;
        const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
        const isExpanded = expandedParents.has(catId);
        const Icon = getCategoryIcon?.(cat.name);
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
                const parentId = child.parentId ?? child.parent_id ?? catIdStr;
                return (
                    String(parentId) === String(selectedCategory) &&
                    String(childId) === String(selectedSubcategory)
                );
            });

        return (
            <Box key={catId ?? cat.name}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: compact ? 1.25 : 2,
                        py: compact ? 0.9 : 1.25,
                        gap: 1.1,
                        cursor: 'pointer',
                        mx: compact ? 0 : 1,
                        mb: 0.75, // Add margin between items to prevent 'sticking'
                        borderRadius: compact ? '8px' : '12px',
                        bgcolor: hasChildren ? 'rgba(255,255,255,0.03)' : 'transparent',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1px solid transparent',
                        '&:hover': { 
                            bgcolor: 'rgba(157,110,237,0.12)',
                            borderColor: 'rgba(157,110,237,0.15)',
                            transform: 'translateX(2px)'
                        },
                    }}
                >
                    <Box
                        sx={{ width: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (hasChildren) onToggleParent?.(catId);
                        }}
                    >
                        {hasChildren ? (
                            isExpanded ? <ExpandMoreIcon sx={{ fontSize: 18, color: '#9D6EED' }} /> : <ArrowRightIcon sx={{ fontSize: 18, color: '#9D6EED' }} />
                        ) : (
                            <Box sx={{ width: 18, height: 18 }} />
                        )}
                    </Box>

                    <Box onClick={() => onSelectCategory?.(cat)} sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1.1, minWidth: 0 }}>
                        {hasChildren ? (
                            isExpanded ? <FolderOpenIcon sx={{ fontSize: 18, color: '#9D6EED', flexShrink: 0 }} /> : <FolderIcon sx={{ fontSize: 18, color: '#9D6EED', flexShrink: 0 }} />
                        ) : Icon ? (
                            <Icon sx={{ fontSize: 16, color: '#9D6EED', flexShrink: 0 }} />
                        ) : null}

                        <Typography
                            sx={{
                                fontSize: compact ? '12px' : '13px',
                                fontWeight: isCategorySelected || hasSelectedChild ? 700 : hasChildren ? 600 : 500,
                                color: isCategorySelected || hasSelectedChild ? '#B794F6' : 'rgba(255,255,255,0.9)',
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {cat.name}
                        </Typography>

                        {count != null && !compact && (
                            <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', mr: 0.5, flexShrink: 0 }}>
                                {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                            </Typography>
                        )}
                        {(isCategorySelected || hasSelectedChild) && (
                            <CheckCircleIcon sx={{ fontSize: 14, color: '#B794F6', flexShrink: 0 }} />
                        )}
                    </Box>
                </Box>

                {hasChildren && isExpanded && (
                    <Box sx={{ pl: 2, borderLeft: '2px solid rgba(157,110,237,0.3)', ml: 2.5, mr: 1, py: 0.35, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                        {cat.children.map((child) => {
                            const childId = child.id ?? child.categoryId;
                            const ChildIcon = getCategoryIcon?.(child.name);
                            const parentId = child.parentId ?? child.parent_id ?? catIdStr;
                            const isChildSelected =
                                String(parentId) === String(selectedCategory) &&
                                String(childId ?? child.name) === String(selectedSubcategory);

                            return (
                                <Box
                                    key={childId ?? child.name}
                                    onClick={() => onSelectSubcategory?.(cat, child)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: 1.25,
                                        py: 0.75,
                                        gap: 1,
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        transition: 'background-color 0.2s',
                                        bgcolor: isChildSelected ? 'rgba(157,110,237,0.16)' : 'transparent',
                                        '&:hover': { bgcolor: 'rgba(157,110,237,0.1)' },
                                    }}
                                >
                                    {ChildIcon && (
                                        <ChildIcon
                                            sx={{
                                                fontSize: 15,
                                                color: isChildSelected ? '#C4A1FF' : 'rgba(157,110,237,0.85)',
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                    <Typography
                                        sx={{
                                            fontSize: compact ? '11.5px' : '12px',
                                            color: isChildSelected ? '#EDE9FE' : 'rgba(255,255,255,0.8)',
                                            flex: 1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {child.name}
                                    </Typography>
                                    {isChildSelected && (
                                        <CheckCircleIcon sx={{ fontSize: 13, color: '#C4A1FF', flexShrink: 0 }} />
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}
                {/* Removed Divider that was making items feel stuck */}
            </Box>
        );
    });
}
