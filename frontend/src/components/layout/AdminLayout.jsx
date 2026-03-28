import { Box, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { CONTENT_MAX_WIDTH } from '../../utils/layoutConstants';
import { ADMIN_THEME as t } from '../../theme/adminTheme';

export default function AdminLayout({ title, subtitle, rightSlot }) {
    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                bgcolor: t.bgApp,
                overflow: 'hidden',
            }}
        >
            <AdminSidebar />

            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: t.bgApp,
                    overflow: 'hidden',
                }}
            >
                <AdminHeader />

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        px: { xs: 2, sm: 3 },
                        py: { xs: 2, md: 3 },
                    }}
                >
                    <Box
                        sx={{
                            maxWidth: CONTENT_MAX_WIDTH,
                            mx: 'auto',
                            width: '100%',
                        }}
                    >
                        {(title || subtitle || rightSlot) && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    alignItems: { xs: 'flex-start', md: 'center' },
                                    justifyContent: 'space-between',
                                    gap: 2,
                                    mb: 3,
                                }}
                            >
                                <Box>
                                    {title && (
                                        <Typography
                                            variant="h4"
                                            fontWeight={800}
                                            sx={{
                                                color: t.text,
                                                mb: 0.5,
                                                letterSpacing: -0.3,
                                                fontSize: { xs: 22, md: 26 },
                                            }}
                                        >
                                            {title}
                                        </Typography>
                                    )}
                                    {subtitle && (
                                        <Typography variant="body2" sx={{ color: t.textMuted }}>
                                            {subtitle}
                                        </Typography>
                                    )}
                                </Box>
                                {rightSlot && <Box>{rightSlot}</Box>}
                            </Box>
                        )}

                        <Outlet />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
