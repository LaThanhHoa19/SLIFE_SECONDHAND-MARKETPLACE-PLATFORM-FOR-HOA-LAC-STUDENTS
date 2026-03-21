import { Box, Typography, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { CONTENT_MAX_WIDTH } from '../../utils/layoutConstants';

export default function AdminLayout({ title, subtitle, rightSlot }) {
    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                bgcolor: '#1C1B23',
                overflow: 'hidden',
            }}
        >
            <AdminSidebar />

            <Box
                sx={{
                    flex: 1,
                    bgcolor: '#1C1B23',
                    p: { xs: 0, md: 0 },
                    overflow: 'auto',
                }}
            >
                <AdminHeader />
                <Box
                    sx={{
                        maxWidth: CONTENT_MAX_WIDTH,
                        mx: 'auto',
                        px: 3,
                        py: 3,
                    }}
                >
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
                                        color: '#111827',
                                        mb: 0.5,
                                        letterSpacing: -0.3,
                                        fontSize: { xs: 22, md: 26 },
                                    }}
                                >
                                    {title}
                                </Typography>
                            )}
                            {subtitle && (
                                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                                    {subtitle}
                                </Typography>
                            )}
                        </Box>
                        {rightSlot && <Box>{rightSlot}</Box>}
                    </Box>

                    <Paper
                        sx={{
                            background: '#1E1B24',
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: 'none',
                            p: { xs: 2, md: 2.5 },
                        }}
                    >
                        <Outlet />
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}

