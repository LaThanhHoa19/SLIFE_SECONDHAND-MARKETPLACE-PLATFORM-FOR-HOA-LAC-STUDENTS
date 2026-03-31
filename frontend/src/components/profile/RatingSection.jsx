import { Box, Chip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

const PURPLE = '#6366f1';

export default function RatingSection({ reputationScore, ratingCount, sx = {} }) {
  return (
    <Box sx={sx}>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2, color: 'white', letterSpacing: '0.5px' }}>
        Đánh giá từ người bán
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
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>{ratingCount} đánh giá • Rất hài lòng</Typography>
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
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: 600,
              fontSize: 11,
              '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.15)', borderColor: PURPLE, color: 'white' }
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
