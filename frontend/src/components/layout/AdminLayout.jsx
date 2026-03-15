import { Box, Typography, Paper } from '@mui/material';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { CONTENT_MAX_WIDTH } from '../../utils/layoutConstants';

export default function AdminLayout({ title, subtitle, children, rightSlot }) {
    return (
        <Box
            sx={{
                display: 'flex',
                minHeight: '100vh',
                bgcolor: '#f3f4f6',
                overflow: 'hidden',
            }}
        >
            <AdminSidebar />

            <Box
                sx={{
                    flex: 1,
                    bgcolor: '#f9fafb',
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
                            background: '#ffffff',
                            borderRadius: 2,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
                            p: { xs: 2, md: 2.5 },
                        }}
                    >
                        {children}
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}

