import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    useTheme,
    Avatar,
    Chip,
    Paper,
    Collapse
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import {
    Home as HomeIcon,
    Category as CategoryIcon,
    LocalOffer as OfferIcon,
    People as CommunityIcon,
    PostAdd as PostAddIcon,
    Favorite as FavoriteIcon,
    Notifications as NotificationsIcon,
    Chat as ChatIcon,
    Settings as SettingsIcon,
    ExpandLess,
    ExpandMore,
    TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

// Styled Components
const StyledSidebar = styled(Box)(({ theme }) => ({
    width: 280,
    height: 'calc(100vh - 56px)', // Full viewport height minus header
    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    position: 'fixed', // Fixed position
    top: '56px', // Start below header
    left: 0,
    zIndex: 1200 // Lower than header but higher than content
}));


const StyledListItem = styled(ListItem, {
    shouldForwardProp: (prop) => prop !== 'active'
})(({ theme, active }) => ({
    borderRadius: '8px',
    margin: '1px 6px',
    padding: '8px 10px',
    backgroundColor: active ? '#9D6EED' : 'transparent',
    color: active ? '#FFFFFF' : '#4a5568',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 'auto',
    '&:hover': {
        backgroundColor: active ? '#8A5BD6' : '#f1f5f9',
        transform: 'translateX(2px)',
        '&::before': {
            transform: 'scaleX(1)'
        }
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        height: '100%',
        width: '2px',
        backgroundColor: '#9D6EED',
        transform: 'scaleX(0)',
        transition: 'transform 0.2s ease',
        transformOrigin: 'left'
    },
    '& .MuiListItemIcon-root': {
        minWidth: '28px',
        color: active ? '#FFFFFF' : '#6b7280',
        transition: 'all 0.2s ease'
    },
    '& .MuiListItemText-primary': {
        fontSize: '13px',
        fontWeight: active ? 600 : 500,
        transition: 'all 0.2s ease'
    }
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
    margin: '3px',
    fontSize: '12px',
    height: '28px',
    backgroundColor: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        backgroundColor: '#9D6EED',
        color: '#FFFFFF',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(157, 110, 237, 0.4)',
        border: '1px solid #9D6EED'
    },
    '&.Mui-clickable': {
        cursor: 'pointer',
    }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '13px',
    fontWeight: 700,
    color: '#64748b',
    marginBottom: '8px',
    padding: '0 16px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
}));

export default function Sidebar({ open = true }) {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [categoriesOpen, setCategoriesOpen] = useState(true);

    // Force single sidebar using DOM manipulation
    useEffect(() => {
        const allSidebars = document.querySelectorAll('[data-sidebar="main"]');
        allSidebars.forEach((sidebar, index) => {
            if (index > 0) {
                sidebar.style.display = 'none';
            }
        });
    }, []);

    if (!open) return null;

    const categories = [
        { name: 'Tất cả danh mục', count: 892, trending: false, icon: <HomeIcon sx={{ fontSize: 18 }} />, special: true },
        { name: 'Đồ dùng học tập', count: 156, trending: true, icon: '📚' },
        { name: 'Thiết bị điện tử', count: 89, trending: false, icon: '💻' },
        { name: 'Quần áo & phụ kiện', count: 234, trending: true, icon: '👕' },
        { name: 'Đồ dùng cá nhân & phòng trọ', count: 67, trending: false, icon: '🏠' },
        { name: 'Phương tiện & thể thao', count: 45, trending: false, icon: '🚲' },
        { name: 'Giải trí & sở thích', count: 78, trending: true, icon: '🎮' },
        { name: 'Sản phẩm khác', count: 123, trending: false, icon: '📦' }
    ];

    const filterOptions = [
        { name: 'Mới nhất', active: false },
        { name: 'Giá thấp đến cao', active: false },
        { name: 'Giá cao đến thấp', active: false },
        { name: 'Gần tôi nhất', active: true },
    ];

    const isActivePath = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname === path || location.pathname.startsWith(path);
    };

    return (
        <StyledSidebar
            data-sidebar="main"
            sx={{
                '&[data-sidebar="main"]': { display: 'flex' },
                '&:not([data-sidebar="main"])': { display: 'none' }
            }}
        >

            <Box
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    pt: 3, // More top padding for better spacing
                    px: 2,
                    pb: 2,
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#c1c1c1',
                        borderRadius: '10px',
                        '&:hover': {
                            background: '#9D6EED',
                        }
                    }
                }}
            >
                {/* Categories Section - Main Focus */}
                <Box sx={{ mb: 2 }}>
                    <SectionTitle>
                        <CategoryIcon sx={{ fontSize: 14 }} />
                        Danh mục sản phẩm
                    </SectionTitle>

                    <List sx={{ px: 0.5 }}>
                        {categories.map((category) => (
                            <StyledListItem
                                key={category.name}
                                button
                                active={location.pathname === '/' && !location.search.includes('category') && category.special}
                                onClick={() => {
                                    if (category.special) {
                                        navigate('/');
                                    } else {
                                        navigate(`/?category=${encodeURIComponent(category.name)}`);
                                    }
                                }}
                                sx={{
                                    mb: 0.5,
                                    backgroundColor: category.special && location.pathname === '/' && !location.search.includes('category') ? '#9D6EED' : 'transparent'
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: '28px' }}>
                                    {category.icon?.props ? category.icon : (
                                        <Box sx={{ fontSize: '16px', textAlign: 'center', width: '18px' }}>
                                            {category.icon}
                                        </Box>
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={category.name}
                                    primaryTypographyProps={{ fontSize: '13px' }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {category.trending && (
                                        <TrendingIcon sx={{ fontSize: 10, color: '#ff4757' }} />
                                    )}
                                    <Typography variant="caption" sx={{
                                        color: 'inherit',
                                        opacity: 0.7,
                                        fontSize: '10px',
                                        fontWeight: 500
                                    }}>
                                        {category.count}
                                    </Typography>
                                </Box>
                            </StyledListItem>
                        ))}
                    </List>
                </Box>

                <Divider sx={{ mx: 1.5, my: 1.5, borderColor: '#e2e8f0' }} />

                {/* Tin nhắn - hiển thị cho mọi user đã đăng nhập */}
                <Box sx={{ mb: 2 }}>
                    <SectionTitle>
                        <ChatIcon sx={{ fontSize: 14 }} />
                        Cá nhân
                    </SectionTitle>
                    <List sx={{ px: 0.5 }}>
                        <StyledListItem
                            button
                            active={location.pathname === '/chat'}
                            onClick={() => navigate('/chat')}
                            sx={{
                                mb: 0.5,
                                backgroundColor: location.pathname === '/chat' ? '#9D6EED' : 'transparent'
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: '28px' }}>
                                <ChatIcon sx={{ fontSize: 18 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Tin nhắn"
                                primaryTypographyProps={{ fontSize: '13px' }}
                            />
                        </StyledListItem>
                    </List>
                </Box>

                <Divider sx={{ mx: 1.5, my: 1.5, borderColor: '#e2e8f0' }} />

                {/* Filter Options */}
                <Box sx={{ mb: 2 }}>
                    <SectionTitle>
                        <TrendingIcon sx={{ fontSize: 14 }} />
                        Sắp xếp & lọc
                    </SectionTitle>
                    <List sx={{ px: 0.5 }}>
                        {filterOptions.map((filter) => (
                            <StyledListItem
                                key={filter.name}
                                button
                                active={filter.active}
                                onClick={() => {
                                    // Handle filter logic here
                                }}
                                sx={{ py: 1 }}
                            >
                                <ListItemText
                                    primary={filter.name}
                                    primaryTypographyProps={{ fontSize: '12px' }}
                                />
                                {filter.active && (
                                    <Box sx={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: '50%',
                                        bgcolor: '#9D6EED'
                                    }} />
                                )}
                            </StyledListItem>
                        ))}
                    </List>
                </Box>

            </Box>

        </StyledSidebar>
    );
}
