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
                            bgcolor: '#19191B',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: 'none',
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
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                            Bài đăng
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
                            1,245
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <Paper
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: '#19191B',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: 'none',
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
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                            Danh mục
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
                            32
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <Paper
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: '#19191B',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: 'none',
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
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                            Người dùng
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
                            4,560
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6} lg={3}>
                    <Paper
                        sx={{
                            p: 2.5,
                            borderRadius: 3,
                            bgcolor: '#19191B',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: 'none',
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
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                            Báo cáo
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff' }}>
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
                            bgcolor: '#19191B',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: 'none',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                px: 2.5,
                                py: 2,
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: '#19191B',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: '#ffffff',
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
                                    color: '#60a5fa',
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
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                                        Bài viết đang hiển thị
                                    </Typography>
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff' }}>
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
                                    bgcolor: '#19191B',
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
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                                        Bài viết đang ẩn
                                    </Typography>
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff' }}>
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
                                    bgcolor: '#19191B',
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
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                                        Bài viết chờ duyệt
                                    </Typography>
                                </Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff' }}>
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
                            bgcolor: '#19191B',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: 'none',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                px: 2.5,
                                py: 2,
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: '#19191B',
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    color: '#ffffff',
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
                                            bgcolor: 'rgba(255,255,255,0.06)',
                                            borderColor: 'rgba(255,255,255,0.08)',
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
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff' }}>
                                            Báo cáo vi phạm (3 bài viết)
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            Yêu cầu kiểm tra nội dung phản cảm.
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label="2 giờ trước"
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                            color: 'rgba(255,255,255,0.8)',
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
                                            bgcolor: 'rgba(255,255,255,0.06)',
                                            borderColor: 'rgba(255,255,255,0.08)',
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
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff' }}>
                                            Xác minh tài khoản (12)
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            Người dùng mới đăng ký chờ phê duyệt.
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label="5 giờ trước"
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                            color: 'rgba(255,255,255,0.8)',
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
                                            bgcolor: 'rgba(255,255,255,0.06)',
                                            borderColor: 'rgba(255,255,255,0.08)',
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
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff' }}>
                                            Yêu cầu hỗ trợ (5)
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                            Khách hàng cần trợ giúp cài đặt tài khoản.
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label="Hôm qua"
                                        size="small"
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                            color: 'rgba(255,255,255,0.8)',
                                            borderRadius: 1.5,
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Recent Activity */}
            <Paper
                sx={{
                    borderRadius: 3,
                    bgcolor: '#19191B',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'none',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        px: 2.5,
                        py: 2,
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff' }}>
                        Hoạt động gần đây
                    </Typography>
                </Box>

                <Box sx={{ overflowX: 'auto' }}>
                    <Table
                        size="small"
                        sx={{
                            '& .MuiTableRow-root:hover': {
                                bgcolor: 'rgba(255,255,255,0.04)',
                            },
                            '& .MuiTableCell-root': {
                                borderColor: 'rgba(255,255,255,0.08)',
                            },
                        }}
                    >
                        <TableHead
                            sx={{
                                bgcolor: '#19191B',
                            }}
                        >
                            <TableRow>
                                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Thời gian</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Hành động</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Người thực hiện</TableCell>
                                <TableCell sx={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Trạng thái</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow hover>
                                <TableCell sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>10:45 - 24/05/2024</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                                        Tạo danh mục mới "Công nghệ 4.0"
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: '#ffffff' }}>Admin</TableCell>
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
                                <TableCell sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>09:12 - 24/05/2024</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
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
                                <TableCell sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>23:55 - 23/05/2024</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                                        Cập nhật hệ thống v2.4.1
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: '#ffffff' }}>System</TableCell>
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
                                <TableCell sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>18:30 - 23/05/2024</TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#ffffff' }}>
                                        Thay đổi phân quyền User ID: #1105
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, color: '#ffffff' }}>Admin</TableCell>
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
