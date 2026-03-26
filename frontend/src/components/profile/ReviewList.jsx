import { Box, Button, Chip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

const PURPLE = '#9D6EED';

export default function ReviewList({ reviews, showAll, setShowAll }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {reviews.map((review) => (
        <Box
          key={review.id}
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: 'white',
            border: '1px solid rgba(0,0,0,0.06)',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography fontWeight={700}>{review.reviewer}</Typography>
            <Typography variant="caption" color="text.secondary">{review.time}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 1.5 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon key={s} sx={{ fontSize: 16, color: s <= review.rating ? '#FFC107' : '#e0e0e0' }} />
            ))}
          </Box>
          <Typography variant="body2" sx={{ mb: 2, color: '#3a3a3c' }}>
            {review.content}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: review.product ? 2 : 0 }}>
            {review.tags?.map(tag => (
              <Chip key={tag} label={tag} size="small" sx={{ height: 20, fontSize: 11, bgcolor: '#f0f0f2', color: 'text.secondary' }} />
            ))}
          </Box>
          {review.product && (
            <Box sx={{ p: 1.5, bgcolor: '#f8f8fa', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: '#e0e0e2' }} />
              <Typography variant="caption" fontWeight={600} color="text.secondary">Sản phẩm: {review.product}</Typography>
            </Box>
          )}
        </Box>
      ))}

      {reviews.length >= 5 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => setShowAll(!showAll)}
            sx={{
              borderRadius: 10,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: PURPLE,
              color: PURPLE,
              '&:hover': { borderColor: '#835cd4', bgcolor: 'rgba(157, 110, 237, 0.05)' }
            }}
          >
            {showAll ? 'Thu gọn' : 'Xem thêm đánh giá'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
