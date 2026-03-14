/** Mục đích: Sidebar compact nền tối — Feed, Tin đã lưu, Đăng tin, Cộng đồng. */
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import {
    Home as HomeIcon,
    Bookmark as BookmarkIcon,
    CampaignOutlined as CampaignIcon,
    PeopleAlt as PeopleIcon,
    Add as AddIcon,
    ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const SIDEBAR_WIDTH = 148;

const NAV_ITEMS = [
    { label: 'Feed', icon: HomeIcon, path: '/' },
    { label: 'Tin đã lưu', icon: BookmarkIcon, path: '/saved' },
    { label: 'Tin của tôi', icon: ListAltIcon, path: '/my-listings' },
    { label: 'Đăng tin', icon: CampaignIcon, path: '/listings/new' },
];

export default function Sidebar({ open = true }) {
    const navigate = useNavigate();
    const location = useLocation();

    if (!open) return null;

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <Box
            data-sidebar="main"
            sx={{
                width: SIDEBAR_WIDTH,
                minWidth: SIDEBAR_WIDTH,
                height: 'calc(100vh - 56px)',
                backgroundColor: '#201D26',
                borderRight: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: '56px',
                zIndex: 1200,
                pt: 1.5,
                pb: 2,
                overflowY: 'auto',
                overflowX: 'hidden',
                '&::-webkit-scrollbar': { display: 'none' },
            }}
        >
            {/* Nav items — nằm ngang icon + text */}
            {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
                const active = isActive(path);
                return (
                    <Box
                        key={path}
                        onClick={() => navigate(path)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 1.25,
                            px: 2,
                            cursor: 'pointer',
                            borderRadius: '10px',
                            mx: 1,
                            mb: 0.25,
                            backgroundColor: active ? 'rgba(157,110,237,0.15)' : 'transparent',
                            transition: 'background 0.15s',
                            '&:hover': {
                                backgroundColor: active
                                    ? 'rgba(157,110,237,0.2)'
                                    : 'rgba(255,255,255,0.06)',
                            },
                        }}
                    >
                        <Icon
                            sx={{
                                fontSize: 20,
                                color: active ? '#9D6EED' : 'rgba(255,255,255,0.65)',
                                flexShrink: 0,
                            }}
                        />
                        <Typography
                            sx={{
                                fontSize: '13px',
                                fontWeight: active ? 600 : 400,
                                color: active ? '#9D6EED' : 'rgba(255,255,255,0.65)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {label}
                        </Typography>
                    </Box>
                );
            })}

            {/* Divider */}
            <Box sx={{ mx: 2, my: 1.25, height: '1px', bgcolor: 'rgba(255,255,255,0.08)' }} />

            {/* Cộng đồng */}
            <Box
                onClick={() => navigate('/community')}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.25,
                    px: 2,
                    cursor: 'pointer',
                    borderRadius: '10px',
                    mx: 1,
                    mb: 0.25,
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                }}
            >
                <PeopleIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.65)', flexShrink: 0 }} />
                <Typography
                    sx={{
                        fontSize: '13px',
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.65)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Cộng đồng
                </Typography>
            </Box>

            {/* Nút + tạo nhóm */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                <Tooltip title="Tạo nhóm" placement="right" arrow>
                    <IconButton
                        size="small"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.6)',
                            width: 28,
                            height: 28,
                            '&:hover': { bgcolor: '#9D6EED', color: '#fff' },
                        }}
                    >
                        <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}
