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
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarRateIcon from '@mui/icons-material/StarRate';
import SecurityIcon from '@mui/icons-material/Security';

const GuideSection = ({ icon: Icon, title, content }) => {
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

export default function BuyerGuidePage() {
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
                        Tôi là người mua
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
                        Khám phá hàng ngàn món đồ hời tại Hòa Lạc một cách an toàn nhất. Hãy tham khảo hướng dẫn dưới đây để có trải nghiệm mua sắm tuyệt vời.
                    </Typography>
                </Box>

                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} md={10}>
                        <GuideSection 
                            icon={SearchIcon}
                            title="1. Tìm kiếm và Lọc sản phẩm"
                            content={
                                <Stack spacing={2.5}>
                                    <Typography variant="body1">
                                        Tìm thấy món đồ ưng ý giữa hàng ngàn tin đăng nhờ sự hỗ trợ của các công cụ lọc:
                                    </Typography>
                                    <Box sx={{ pl: 2, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • <b>Lọc theo danh mục:</b> Thu hẹp phạm vi tìm kiếm theo Giáo trình, Đồ gia dụng, Điện tử, v.v.
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • <b>Sắp xếp:</b> Ưu tiên "Tin mới nhất" để không bỏ lỡ các sản phẩm vừa đăng bán.
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • <b>Kiểm tra uy tín người bán:</b> Xem số sao và các nhận xét từ người mua trước đó trên trang cá nhân của họ.
                                        </Typography>
                                    </Box>
                                </Stack>
                            }
                        />

                        <GuideSection 
                            icon={ChatIcon}
                            title="2. Giao tiếp và Thương lượng"
                            content={
                                <Stack spacing={2.5}>
                                    <Typography variant="body1">
                                        Sử dụng tính năng Chat để làm rõ thông tin sản phẩm và chốt giá hời:
                                    </Typography>
                                    <Box component="ul" sx={{ pl: 3, m: 0 }}>
                                        <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                                            Hỏi thêm về tình trạng thực tế của món đồ (còn dùng tốt không, có lỗi gì ẩn không).
                                        </Typography>
                                        <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                                            <b>Nhấn Trả giá:</b> Nếu bạn thấy giá chưa phù hợp, hãy đưa ra mức giá đề nghị lịch sự.
                                        </Typography>
                                        <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                                            <b>Xác nhận thỏa thuận:</b> Khi đã đồng ý giá, hãy nhấn xác nhận để hệ thống lưu lại làm bằng chứng giao dịch.
                                        </Typography>
                                    </Box>
                                </Stack>
                            }
                        />

                        <GuideSection 
                            icon={LocationOnIcon}
                            title="3. Gặp mặt và Kiểm tra hàng"
                            content={
                                <Stack spacing={2.5}>
                                    <Typography variant="body1">
                                        Vì SLife không hỗ trợ vận chuyển, việc gặp mặt trực tiếp là bước quan trọng nhất:
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                                                <Typography variant="subtitle2" sx={{ color: accentColor, mb: 1 }}>Địa điểm an toàn</Typography>
                                                <Typography variant="body2">Hẹn gặp tại các khu vực công cộng trong campus hoặc ký túc xá (7-Eleven, Dom, v.v.).</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                                                <Typography variant="subtitle2" sx={{ color: accentColor, mb: 1 }}>Kiểm tra kỹ thuật</Typography>
                                                <Typography variant="body2">Dành thời gian kiểm tra kỹ món hàng trước khi thanh toán. Không nên vội vàng.</Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Stack>
                            }
                        />

                        <Paper
                            elevation={0}
                            sx={{
                                p: 4,
                                background: 'linear-gradient(135deg, rgba(167,139,250,0.1) 0%, rgba(167,139,250,0.02) 100%)',
                                border: `1px solid ${alpha(accentColor, 0.2)}`,
                                borderRadius: 4,
                            }}
                        >
                            <Stack direction="row" spacing={3} alignItems="center">
                                <SecurityIcon sx={{ fontSize: 48, color: accentColor }} />
                                <Box>
                                    <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 0.5 }}>
                                        Nguyên tắc "Tiền trao - Cháo múc"
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Chỉ thanh toán sau khi đã nhận tận tay sản phẩm và hài lòng với chất lượng. Tuyệt đối không chuyển khoản đặt cọc trước cho bất kỳ ai.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        <GuideSection 
                            icon={StarRateIcon}
                            title="4. Đánh giá sau giao dịch"
                            content={
                                <Typography variant="body2">
                                    Sau khi hoàn tất, hãy quay lại trang tin hoặc chat để đánh giá người bán. Điều này không chỉ giúp người bán có thêm uy tín mà còn giúp những người mua khác có căn cứ để tin tưởng giao dịch.
                                </Typography>
                            }
                        />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}
