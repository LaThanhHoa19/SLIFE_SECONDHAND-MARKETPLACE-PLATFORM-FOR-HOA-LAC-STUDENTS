import { Box, Container, Divider, Stack, Typography } from '@mui/material';

export default function TermsPage() {
    return (
        <Box
            sx={{
                py: { xs: 4, md: 6 },
                background: 'linear-gradient(180deg, rgba(23,21,34,0.35) 0%, rgba(20,18,37,0.65) 100%)',
            }}
        >
            <Container maxWidth="md">
                <Stack spacing={2.25}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 0.75 }}>
                            Quy chế hoạt động
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                            Trang này mô tả các nguyên tắc và quy định khi sử dụng nền tảng SLIFE. Nội dung có thể được cập nhật
                            định kỳ để phù hợp với vận hành thực tế và quy định liên quan.
                        </Typography>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 750, color: '#FFFFFF', mb: 1 }}>
                            1. Phạm vi áp dụng
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                            Quy chế áp dụng cho tất cả người dùng truy cập, đăng ký tài khoản và thực hiện các hoạt động đăng tin,
                            trao đổi, mua bán trên SLIFE.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 750, color: '#FFFFFF', mb: 1 }}>
                            2. Quy định về nội dung tin đăng
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                            Người dùng chịu trách nhiệm về tính chính xác của thông tin, hình ảnh, giá cả và tình trạng sản phẩm. Không
                            đăng tải nội dung vi phạm pháp luật, lừa đảo, gây hiểu nhầm hoặc xâm phạm quyền lợi của bên thứ ba.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 750, color: '#FFFFFF', mb: 1 }}>
                            3. Quy tắc giao dịch và ứng xử
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                            Người dùng cần tôn trọng lẫn nhau, giao tiếp văn minh, không quấy rối hoặc đe doạ. Khi giao dịch, hai bên
                            tự thỏa thuận phương thức thanh toán/nhận hàng và chủ động kiểm tra sản phẩm.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 750, color: '#FFFFFF', mb: 1 }}>
                            4. Xử lý vi phạm
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                            SLIFE có thể áp dụng các biện pháp như cảnh báo, ẩn/xóa tin đăng, hạn chế tính năng hoặc khóa tài khoản đối
                            với hành vi vi phạm quy chế.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 750, color: '#FFFFFF', mb: 1 }}>
                            5. Liên hệ
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                            Nếu bạn có thắc mắc về quy chế hoạt động, vui lòng liên hệ mục “Liên hệ hỗ trợ” trong footer hoặc kênh hỗ
                            trợ của hệ thống.
                        </Typography>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}

