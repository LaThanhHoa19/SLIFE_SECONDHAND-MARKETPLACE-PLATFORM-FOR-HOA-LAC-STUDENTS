import React from 'react';
import {
    Box,
    Container,
    Typography,
    Stack,
    Grid,
    Paper,
    Divider,
    alpha
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import PaymentsIcon from '@mui/icons-material/Payments';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

const SafetySection = ({ icon: Icon, title, content }) => {
    const accentColor = '#A78BFA';
    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 3, md: 4 },
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 4,
                mb: 4
            }}
        >
            <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 3 }}>
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: alpha(accentColor, 0.12),
                        color: accentColor,
                    }}
                >
                    <Icon sx={{ fontSize: 28 }} />
                </Box>
                <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 800 }}>
                    {title}
                </Typography>
            </Stack>
            
            <Box sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.8 }}>
                {content}
            </Box>
        </Paper>
    );
};

export default function SafetyGuidePage() {
    const accentColor = '#A78BFA';

    return (
        <Box
            sx={{
                minHeight: '80vh',
                py: { xs: 4, md: 6 },
                background: 'linear-gradient(180deg, rgba(23,21,34,0.3) 0%, rgba(20,18,37,0.6) 100%)',
            }}
        >
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 850, color: '#FFFFFF', mb: 2 }}>
                        An toàn mua bán
                    </Typography>
                    <Box
                        sx={{
                            width: 60,
                            height: 4,
                            background: accentColor,
                            borderRadius: 10,
                            mx: 'auto',
                            mb: 3
                        }}
                    />
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: 700, mx: 'auto', fontSize: '1.1rem' }}>
                        Tại SLife, sự an toàn của cộng đồng sinh viên là ưu tiên hàng đầu. Hãy trang bị cho mình những kiến thức cơ bản để mọi giao dịch đều diễn ra suôn sẻ.
                    </Typography>
                </Box>

                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} md={10}>
                        <SafetySection 
                            icon={SecurityIcon}
                            title="1. Quy tắc 3 KHÔNG khi giao dịch"
                            content={
                                <Stack spacing={2.5}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={4}>
                                            <Paper sx={{ p: 2, bgcolor: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.1)', height: '100%' }}>
                                                <Typography variant="subtitle1" sx={{ color: accentColor, fontWeight: 700, mb: 1 }}>KHÔNG cọc tiền</Typography>
                                                <Typography variant="body2">Tuyệt đối không chuyển khoản đặt cọc dưới mọi hình thức trước khi cầm tận tay sản phẩm.</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Paper sx={{ p: 2, bgcolor: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.1)', height: '100%' }}>
                                                <Typography variant="subtitle1" sx={{ color: accentColor, fontWeight: 700, mb: 1 }}>KHÔNG đi một mình</Typography>
                                                <Typography variant="body2">Nên đi cùng bạn bè khi giao dịch các món đồ có giá trị lớn hoặc gặp người lạ lần đầu.</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Paper sx={{ p: 2, bgcolor: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.1)', height: '100%' }}>
                                                <Typography variant="subtitle1" sx={{ color: accentColor, fontWeight: 700, mb: 1 }}>KHÔNG vội vàng</Typography>
                                                <Typography variant="body2">Hãy dành thời gian kiểm tra kỹ sản phẩm, đừng để sự hối thúc của người bán làm bạn lơ là.</Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Stack>
                            }
                        />

                        <SafetySection 
                            icon={LocationOnIcon}
                            title="2. Địa điểm giao dịch khuyến nghị tại Hòa Lạc"
                            content={
                                <Stack spacing={2.5}>
                                    <Typography variant="body1">
                                        Chúng tôi khuyến khích sinh viên gặp mặt tại các khu vực đông người, có camera an ninh hoặc có sự quản lý của trường:
                                    </Typography>
                                    <Box sx={{ pl: 2, borderLeft: `2px solid ${accentColor}` }}>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • <b>Khu vực 7-Eleven / VinMart:</b> Nơi đông người qua lại và có đầy đủ ánh sáng ban đêm.
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • <b>Sảnh các tòa Dom (Ký túc xá):</b> Có camera an ninh và sự giám sát của bảo vệ tòa nhà.
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • <b>Thư viện / Khu vực tự học:</b> Không gian yên tĩnh phù hợp để kiểm tra kỹ các món đồ như Laptop, iPad.
                                        </Typography>
                                        <Typography variant="body2">
                                            • <b>Quán Cafe trong trường:</b> Phù hợp để ngồi lại thương lượng và kiểm tra hàng hóa thoải mái.
                                        </Typography>
                                    </Box>
                                </Stack>
                            }
                        />

                        <SafetySection 
                            icon={PaymentsIcon}
                            title="3. Thanh toán và Bàn giao"
                            content={
                                <Stack spacing={2.5}>
                                    <Typography variant="body1">
                                        Đảm bảo quy trình "Tiền trao cháo múc" diễn ra công bằng:
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {[
                                            'Kiểm tra tình trạng vật lý của hàng hóa.',
                                            'Thử nghiệm đầy đủ các tính năng (đối với đồ điện tử).',
                                            'Xác nhận thông tin bảo hành (nếu có).',
                                            'Chỉ thanh toán khi đã hài lòng 100% với sản phẩm.',
                                            'Ưu tiên chuyển khoản ngân hàng để có bằng chứng giao dịch.',
                                            'Giữ lại thông liên lạc của người bán trong ít nhất 3 ngày.'
                                        ].map((item, idx) => (
                                            <Grid item xs={12} sm={6} key={idx}>
                                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, mt: 1.2 }} />
                                                    <Typography variant="body2">{item}</Typography>
                                                </Stack>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Stack>
                            }
                        />

                        <SafetySection 
                            icon={ReportProblemIcon}
                            title="4. Cảnh báo và Báo cáo vi phạm"
                            content={
                                <Stack spacing={2.5}>
                                    <Typography variant="body1">
                                        Hãy nhấn nút <b>"Báo cáo"</b> ngay khi bạn gặp phải:
                                    </Typography>
                                    <Box sx={{ pl: 2, borderLeft: '2px solid #F87171' }}>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • Tin đăng có hình ảnh ảo, thông tin mập mờ hoặc giá rẻ bất thường (dấu hiệu lừa đảo).
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • Người bán yêu cầu chuyển khoản đặt cọc hoặc liên lạc qua nền tảng khác ngoài SLife.
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • Sản phẩm nhận được khác xa so với mô tả trên tin đăng.
                                        </Typography>
                                        <Typography variant="body2">
                                            • Thái độ người bán/người mua thiếu văn minh, đe dọa hoặc quấy rối.
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>
                                        * Đội ngũ Admin SLife sẽ rà soát và xử lý các báo cáo trong vòng 24h. Tài khoản vi phạm nghiêm trọng sẽ bị khóa vĩnh viễn.
                                    </Typography>
                                </Stack>
                            }
                        />

                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                background: alpha(accentColor, 0.04),
                                border: `1px solid ${alpha(accentColor, 0.15)}`,
                                borderRadius: 4,
                                textAlign: 'center'
                            }}
                        >
                            <VerifiedUserIcon sx={{ fontSize: 48, color: accentColor, mb: 2 }} />
                            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1 }}>
                                Chung tay xây dựng cộng đồng an toàn
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: 600, mx: 'auto' }}>
                                Mọi phản hồi của bạn đều góp phần giúp SLife trở thành điểm đến tin cậy nhất cho sinh viên FPT Hòa Lạc. Cảm ơn bạn đã đồng hành cùng chúng tôi!
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
