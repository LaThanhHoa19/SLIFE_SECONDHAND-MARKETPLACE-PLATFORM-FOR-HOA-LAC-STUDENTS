import { useState } from 'react';
import { Box, Button, Card, Typography } from '@mui/material';

export const CARD_BG = '#201D26';
export const BORDER = 'rgba(255,255,255,0.07)';
export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';

const MOCK_HTML = `
  <p>Mình cần pass lại món đồ này do không có nhu cầu sử dụng nữa. Ngoại hình <strong>NHƯ MỚI 99%</strong>, chưa qua sửa chữa, pin còn rất trâu (đã test kỹ ở nhiệt độ phòng và dùng các ứng dụng nặng).</p>
  <p>Các tính năng nổi bật:</p>
  <ul>
    <li>Màn hình cực đẹp, độ sáng cao, chống chói tốt ngoài trời.</li>
    <li>Thiết kế mỏng nhẹ, dễ dàng mang đi học ở giảng đường VNU.</li>
    <li>Màu sắc nguyên bản, không trầy xước viền.</li>
  </ul>
  <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w0NzEyNjZ8MHwxfHNlYXJjaHwxfHxzbmVha2Vyc3xlbnwwfDB8fHwxNzAyNTMxMjg0fDA&ixlib=rb-4.0.3&q=80&w=600" alt="product preview" style="max-width: 100%; border-radius: 8px; margin: 12px 0;" />
  <p><em>Lưu ý:</em> Bao test 7 ngày cho các bạn sinh viên yên tâm sử dụng. Fix nhẹ xăng xe cho bạn nào qua xem máy trực tiếp tại KTX Dom E nhé! Gọi điện hoặc nhắn tin trực tiếp để ép giá.</p>
`;

export default function ListingDescription({ description }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Nếu description rỗng thì xài mock để demo UI
  const displayHtml = !description || description.length < 50 ? MOCK_HTML : description;

  return (
    <Card
      sx={{
        bgcolor: CARD_BG,
        border: `1px solid ${BORDER}`,
        borderRadius: '14px',
        p: 2.5,
      }}
    >
      <Typography fontSize={16} fontWeight={700} color={TEXT_PRI} sx={{ mb: 1.5 }}>
        Mô tả chi tiết
      </Typography>

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          maxHeight: isExpanded ? 'none' : '300px',
          color: TEXT_SEC,
          fontSize: 15,
          lineHeight: 1.6,
          '& p': { mb: 1.5, mt: 0 },
          '& ul': { mb: 1.5, pl: 2.5 },
          '& img': { maxWidth: '100%', borderRadius: '8px', mt: 1, mb: 1.5 },
          '& strong': { color: TEXT_PRI, fontWeight: 700 },
          '& em': { color: '#FFC107' },
        }}
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />

      {/* Lớp phủ mờ (gradient) khi chưa mở rộng */}
      {!isExpanded && (
        <Box
          sx={{
            position: 'relative',
            mt: -7,
            height: 54,
            background: `linear-gradient(rgba(32, 29, 38, 0), rgba(32, 29, 38, 1) 90%)`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Nút Xem thêm / Thu gọn */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          disableRipple
          sx={{
            color: '#FFB300', // Amber color for high visibility
            textTransform: 'none',
            fontSize: 14,
            fontWeight: 800,
            transition: 'all 0.2s',
            '&:hover': {
              background: 'transparent',
              color: '#FFD54F',
              textDecoration: 'underline'
            }
          }}
        >
          {isExpanded ? 'Thu gọn' : 'Xem thêm'}
        </Button>
      </Box>
    </Card>
  );
}
