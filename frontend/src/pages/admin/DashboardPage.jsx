/** Mục đích: Dashboard admin metrics + quick actions. API: GET /api/admin/metrics, /api/admin/reports. */
import {
    Box,
    Grid,
    Paper,
    Typography,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import PersonAddDisabledIcon from '@mui/icons-material/PersonAddDisabled';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import InsightsIcon from '@mui/icons-material/Insights';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';

export default function DashboardPage() {
    return (
        <Box>
            {/* Statistics Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6} lg={3}>
                    <Paper
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 10px 25px rgba(15,23,42,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box
                                sx={{
                                    p: 1.25,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(59,130,246,0.08)',
                                    color: '#2563eb',
                                    display: 'inline-flex',
                                }}
                            >
                                <DescriptionIcon fontSize="small" />
                            </Box>
                            <Chip
                                label="+12%"
                                size="small"
                                sx={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    bgcolor: 'rgba(16,185,129,0.1)',
                                    color: '#059669',
                                    borderRadius: 1.5,
                                }}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                            Bài đăng
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
                            1,245
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <Paper
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 10px 25px rgba(15,23,42,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box
                                sx={{
                                    p: 1.25,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(147,51,234,0.08)',
                                    color: '#7c3aed',
                                    display: 'inline-flex',
                                }}
                            >
                                <CategoryIcon fontSize="small" />
                            </Box>
                            <Chip
                                label="+2%"
                                size="small"
                                sx={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    bgcolor: 'rgba(16,185,129,0.1)',
                                    color: '#059669',
                                    borderRadius: 1.5,
                                }}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                            Danh mục
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
                            32
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <Paper
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 10px 25px rgba(15,23,42,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box
                                sx={{
                                    p: 1.25,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(249,115,22,0.08)',
                                    color: '#ea580c',
                                    display: 'inline-flex',
                                }}
                            >
                                <ManageAccountsIcon fontSize="small" />
                            </Box>
                            <Chip
                                label="+5%"
                                size="small"
                                sx={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    bgcolor: 'rgba(16,185,129,0.1)',
                                    color: '#059669',
                                    borderRadius: 1.5,
                                }}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                            Người dùng
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
                            4,560
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <Paper
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 10px 25px rgba(15,23,42,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box
                                sx={{
                                    p: 1.25,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(244,63,94,0.08)',
                                    color: '#e11d48',
                                    display: 'inline-flex',
                                }}
                            >
                                <FlagIcon fontSize="small" />
                            </Box>
                            <Chip
                                label="-1%"
                                size="small"
                                sx={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    bgcolor: 'rgba(248,113,113,0.12)',
                                    color: '#dc2626',
                                    borderRadius: 1.5,
                                }}
                            />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                            Báo cáo
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827' }}>
                            18
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Middle Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={6}>
                    <Paper
                        sx={{
                            borderRadius: 3,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 10px 25px rgba(15,23,42,0.04)',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                px: 2.5,
                                py: 2,
                                borderBottom: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: '#f9fafb',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#111827',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        fontSize: { xs: 16, md: 18 },
                                    }}
                                >
                                    Tình trạng nghiệp vụ
                                </Typography>
                            </Box>
                            <Button
                                size="small"
                                sx={{
                                    textTransform: 'none',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#2563eb',
                                }}
                            >
                                Xem chi tiết
                            </Button>
                        </Box>

                        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 1.75,
                                    borderRadius: 2,
                                    bgcolor: '#f3f4f6',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box
                                        sx={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '999px',
                                            bgcolor: '#10b981',
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                                        Bài viết đang hiển thị
                                    </Typography>
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    1,120
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 1.75,
                                    borderRadius: 2,
                                    bgcolor: '#f3f4f6',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box
                                        sx={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '999px',
                                            bgcolor: '#9ca3af',
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                                        Bài viết đang ẩn
                                    </Typography>
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    125
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 1.75,
                                    borderRadius: 2,
                                    bgcolor: '#f3f4f6',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box
                                        sx={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '999px',
                                            bgcolor: '#f59e0b',
                                        }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                                        Bài viết chờ duyệt
                                    </Typography>
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    42
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Paper
                        sx={{
                            borderRadius: 3,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 10px 25px rgba(15,23,42,0.04)',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                px: 2.5,
                                py: 2,
                                borderBottom: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: '#f9fafb',
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: '#111827',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    fontSize: { xs: 16, md: 18 },
                                }}
                            >
                                Công việc cần xử lý
                            </Typography>
                        </Box>

                        <Box sx={{ p: 2.5 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.5,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1.5,
                                        p: 1.5,
                                        borderRadius: 2,
                                        border: '1px solid transparent',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: '#f9fafb',
                                            borderColor: '#e5e7eb',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            mt: 0.5,
                                            width: 32,
                                            height: 32,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(248,113,113,0.12)',
                                            color: '#e11d48',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <FlagIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
                                            Báo cáo vi phạm (3 bài viết)
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                            Yêu cầu kiểm tra nội dung phản cảm.
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label="2 giờ trước"
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: '#f3f4f6',
                                            color: '#4b5563',
                                            borderRadius: 1.5,
                                        }}
                                    />
                                </Box>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1.5,
                                        p: 1.5,
                                        borderRadius: 2,
                                        border: '1px solid transparent',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: '#f9fafb',
                                            borderColor: '#e5e7eb',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            mt: 0.5,
                                            width: 32,
                                            height: 32,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(251,191,36,0.12)',
                                            color: '#d97706',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <PersonAddDisabledIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
                                            Xác minh tài khoản (12)
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                            Người dùng mới đăng ký chờ phê duyệt.
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label="5 giờ trước"
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: '#f3f4f6',
                                            color: '#4b5563',
                                            borderRadius: 1.5,
                                        }}
                                    />
                                </Box>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1.5,
                                        p: 1.5,
                                        borderRadius: 2,
                                        border: '1px solid transparent',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: '#f9fafb',
                                            borderColor: '#e5e7eb',
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            mt: 0.5,
                                            width: 32,
                                            height: 32,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(59,130,246,0.08)',
                                            color: '#2563eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <SupportAgentIcon sx={{ fontSize: 18 }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
                                            Yêu cầu hỗ trợ (5)
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                            Khách hàng cần trợ giúp cài đặt tài khoản.
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label="Hôm qua"
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: '#f3f4f6',
                                            color: '#4b5563',
                                            borderRadius: 1.5,
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        color: '#111827',
                        mb: 1.5,
                        fontSize: { xs: 16, md: 18 },
                    }}
                >
                    Thao tác nhanh
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                        <Paper
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 8px 20px rgba(15,23,42,0.04)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: '#2563eb55',
                                    bgcolor: 'rgba(37,99,235,0.03)',
                                },
                            }}
                        >
                            <CategoryIcon sx={{ fontSize: 30, color: '#9ca3af' }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', textAlign: 'center' }}>
                                Quản lý danh mục
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Paper
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 8px 20px rgba(15,23,42,0.04)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: '#2563eb55',
                                    bgcolor: 'rgba(37,99,235,0.03)',
                                },
                            }}
                        >
                            <ManageAccountsIcon sx={{ fontSize: 30, color: '#9ca3af' }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', textAlign: 'center' }}>
                                Quản lý người dùng
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Paper
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 8px 20px rgba(15,23,42,0.04)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: '#2563eb55',
                                    bgcolor: 'rgba(37,99,235,0.03)',
                                },
                            }}
                        >
                            <InsightsIcon sx={{ fontSize: 30, color: '#9ca3af' }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', textAlign: 'center' }}>
                                Xem báo cáo
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={6} md={3}>
                        <Paper
                            sx={{
                                p: 2.5,
                                borderRadius: 3,
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 8px 20px rgba(15,23,42,0.04)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: '#2563eb55',
                                    bgcolor: 'rgba(37,99,235,0.03)',
                                },
                            }}
                        >
                            <SettingsInputComponentIcon sx={{ fontSize: 30, color: '#9ca3af' }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', textAlign: 'center' }}>
                                Cấu hình hệ thống
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Recent Activity */}
            <Paper
                sx={{
                    borderRadius: 3,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 10px 25px rgba(15,23,42,0.04)',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        px: 2.5,
                        py: 2,
                        borderBottom: '1px solid #e5e7eb',
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
                        Hoạt động gần đây
                    </Typography>
                </Box>

                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                        <TableHead
                            sx={{
                                bgcolor: '#f9fafb',
                            }}
                        >
                            <TableRow>
                                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>Thời gian</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>Hành động</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>Người thực hiện</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>Trạng thái</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow hover>
                                <TableCell sx={{ fontSize: 13, color: '#6b7280' }}>10:45 - 24/05/2024</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                                        Tạo danh mục mới "Công nghệ 4.0"
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: '#111827' }}>Admin</TableCell>
                                <TableCell>
                                    <Chip
                                        label="Thành công"
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: 'rgba(16,185,129,0.12)',
                                            color: '#059669',
                                            borderRadius: 1.5,
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow hover>
                                <TableCell sx={{ fontSize: 13, color: '#6b7280' }}>09:12 - 24/05/2024</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                                        Khóa tài khoản người dùng ID: #4402
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: '#111827' }}>Moderator_01</TableCell>
                                <TableCell>
                                    <Chip
                                        label="Thành công"
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: 'rgba(16,185,129,0.12)',
                                            color: '#059669',
                                            borderRadius: 1.5,
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow hover>
                                <TableCell sx={{ fontSize: 13, color: '#6b7280' }}>23:55 - 23/05/2024</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                                        Cập nhật hệ thống v2.4.1
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: '#111827' }}>System</TableCell>
                                <TableCell>
                                    <Chip
                                        label="Đã hoàn tất"
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: 'rgba(59,130,246,0.12)',
                                            color: '#2563eb',
                                            borderRadius: 1.5,
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow hover>
                                <TableCell sx={{ fontSize: 13, color: '#6b7280' }}>18:30 - 23/05/2024</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>
                                        Thay đổi phân quyền User ID: #1105
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: '#111827' }}>Admin</TableCell>
                                <TableCell>
                                    <Chip
                                        label="Chờ xử lý"
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: 'rgba(251,191,36,0.12)',
                                            color: '#d97706',
                                            borderRadius: 1.5,
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Box>
            </Paper>
        </Box>
    );
}
