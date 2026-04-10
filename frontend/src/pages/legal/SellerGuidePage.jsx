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
import { useNavigate } from 'react-router-dom';
import CreateIcon from '@mui/icons-material/Create';
import ChatIcon from '@mui/icons-material/Chat';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedIcon from '@mui/icons-material/Verified';

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

export default function SellerGuidePage() {
    const navigate = useNavigate();
    const accentColor = '#A78BFA';

    const handlePrivacy = () => navigate('/terms?key=general&item=privacy');

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
                        Tôi là người bán
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
                        Biến những món đồ cũ thành giá trị mới. Hãy tham khảo hướng dẫn dưới đây để bán hàng nhanh chóng và uy tín nhất.
                    </Typography>
                </Box>

                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} md={10}>
                        <GuideSection
                            icon={CreateIcon}
                            title="1. Quy trình đăng tin chuẩn"
                            content={
                                <Stack spacing={2.5}>
                                    <Typography variant="body1">
                                        Để tin đăng của bạn thu hút được nhiều người mua và không vi phạm các chính sách của Slife, hãy tuân thủ các quy tắc sau:
                                    </Typography>
                                    <Box sx={{ pl: 2, borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • <b>Hình ảnh:</b> Cung cấp ít nhất 1 ảnh thực tế, rõ nét. Không dùng ảnh mạng hoặc ảnh có chứa thông tin nhạy cảm.
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • <b>Tiêu đề:</b> Ngắn gọn, súc tích và chứa tên sản phẩm. Ví dụ: "Giáo trình Kinh tế vi mô - Mới 95%".
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1.5 }}>
                                            • <b>Mô tả:</b> Thành thật về tình trạng sản phẩm (có trầy xước không, còn bảo hành không).
                                        </Typography>
                                        <Typography variant="body2">
                                            • <b>Giá cả:</b> Hãy đặt giá hợp lý dựa trên giá trị sử dụng còn lại để chốt đơn nhanh hơn.
                                        </Typography>
                                    </Box>
                                </Stack>
                            }
                        />

                        <GuideSection
                            icon={GavelIcon}
                            title="2. Quy định về hàng hóa"
                            content={
                                <Stack spacing={2.5}>
                                    <Typography variant="body1">
                                        SLife cam kết xây dựng một môi trường giao dịch sạch và lành mạnh. Các mặt hàng sau bị nghiêm cấm:
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {[
                                            'Thuốc và thực phẩm chức năng',
                                            'Vũ khí, hung khí và công cụ hỗ trợ',
                                            'Rượu, bia, thuốc lá và chất kích thích',
                                            'Các dịch vụ (chỉ bán hàng hóa vật lý)',
                                            'Tài liệu phản động, đồi trụy',
                                            'Đồ lót đã qua sử dụng'
                                        ].map((item, idx) => (
                                            <Grid item xs={12} sm={6} key={idx}>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }} />
                                                    <Typography variant="body2">{item}</Typography>
                                                </Stack>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                        * Tài khoản đăng hàng cấm bị cộng đồng báo cáo quá 3 lần sẽ bị khóa vĩnh viễn.
                                    </Typography>
                                </Stack>
                            }
                        />

                        <GuideSection
                            icon={CheckCircleOutlineIcon}
                            title="3. Quy trình chốt đơn an toàn"
                            content={
                                <Stack spacing={2.5}>
                                    <Typography variant="body1">
                                        Sau khi có người mua quan tâm, hãy thực hiện theo các bước sau để đảm bảo quyền lợi:
                                    </Typography>
                                    <Box component="ol" sx={{ pl: 3, m: 0 }}>
                                        <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                                            <b>Thương lượng:</b> Sử dụng tính năng Chat để chốt giá và tình trạng cuối cùng.
                                        </Typography>
                                        <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                                            <b>Xác nhận thỏa thuận:</b> Luôn yêu cầu hoặc chủ động xác nhận thỏa thuận qua hệ thống trước khi gặp mặt.
                                        </Typography>
                                        <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                                            <b>Gặp mặt trực tiếp:</b> Sắp xếp địa điểm công cộng tại khu vực Hòa Lạc (ví dụ: sân trường, quán cafe) để giao hàng.
                                        </Typography>
                                        <Typography component="li" variant="body2">
                                            <b>Thanh toán:</b> Kiểm tra tiền (mặt hoặc chuyển khoản) trước khi bàn giao hoàn toàn sản phẩm.
                                        </Typography>
                                    </Box>
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
                            <VerifiedIcon sx={{ fontSize: 48, color: accentColor, mb: 2 }} />
                            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800, mb: 1 }}>
                                Xây dựng uy tín từ Đánh giá
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: 600, mx: 'auto' }}>
                                Điểm uy tín của bạn được tính dựa trên số sao từ người mua. Hãy trung thực và nhiệt tình để nhận được những đánh giá 5 sao, giúp bạn bán hàng dễ dàng hơn trong tương lai.
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Box
                    sx={{
                        mt: 8,
                        pt: 4,
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: 800,
                        mx: 'auto'
                    }}
                >
                    <Stack
                        direction="row"
                        spacing={2}
                        justifyContent="center"
                        divider={<Typography sx={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</Typography>}
                        sx={{ mb: 3 }}
                    >
                        <Typography
                            onClick={() => navigate('/seller-guide')}
                            sx={{ color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', fontSize: '0.9rem', '&:hover': { color: accentColor } }}
                        >
                            Tôi là người bán
                        </Typography>
                        <Typography
                            onClick={() => navigate('/buyer-guide')}
                            sx={{ color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', fontSize: '0.9rem', '&:hover': { color: accentColor } }}
                        >
                            Tôi là người mua
                        </Typography>
                    </Stack>

                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.85rem' }}>
                        © Bản quyền đã được bảo hộ bởi Cộng đồng Sinh viên SLife - Khu vực Hòa Lạc.
                        <br />
                        Thông tin của bạn sẽ được bảo mật theo <Typography component="span" onClick={handlePrivacy} sx={{ color: accentColor, cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>Chính sách bảo mật</Typography> của chúng tôi.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
