import { Box, Chip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

const PURPLE = '#9D6EED';

export default function RatingSection({ reputationScore, ratingCount }) {
  return (
    <>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, color: '#1d1d1f' }}>
        Đánh giá từ người mua
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h3" fontWeight={800} color={PURPLE}>{reputationScore}</Typography>
          <Box>
            <Box sx={{ display: 'flex' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <StarIcon key={s} sx={{ fontSize: 18, color: s <= Math.floor(reputationScore) ? '#FFC107' : '#e0e0e0' }} />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">{ratingCount} đánh giá • Rất hài lòng</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {['Giao tiếp lịch sự', 'Phản hồi nhanh', 'Đúng hẹn', 'Giá hợp lý', 'Mô tả đúng'].map(tag => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            sx={{
              bgcolor: 'white',
              border: '1px solid #e0e0e0',
              fontWeight: 500,
              fontSize: 12,
              '&:hover': { bgcolor: 'rgba(157, 110, 237, 0.05)', borderColor: PURPLE }
            }}
          />
        ))}
      </Box>
    </>
  );
}
