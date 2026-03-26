import { Box, Button, Chip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

const PURPLE = '#6366f1';

export default function ReviewList({ reviews, showAll, setShowAll }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {reviews.map((review) => (
        <Box
          key={review.id}
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { 
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              transform: 'translateY(-4px)', 
              boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'white' }}>{review.reviewer}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>{review.time}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 2, gap: 0.5 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon key={s} sx={{ fontSize: 18, color: s <= review.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </Box>
          <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.7, letterSpacing: '0.3px' }}>
            {review.content}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: review.product ? 3 : 0 }}>
            {review.tags?.map(tag => (
              <Chip 
                key={tag} 
                label={tag} 
                size="small" 
                sx={{ 
                  height: 22, 
                  fontSize: 11, 
                  bgcolor: 'rgba(255, 255, 255, 0.05)', 
                  color: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontWeight: 700
                }} 
              />
            ))}
          </Box>

          {review.product && (
            <Box sx={{ 
              p: 2, 
              bgcolor: 'rgba(255, 255, 255, 0.03)', 
              borderRadius: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(255, 255, 255, 0.45)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Sản phẩm: <Box component="span" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{review.product}</Box>
              </Typography>
            </Box>
          )}
        </Box>
      ))}

      {reviews.length >= 5 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="text"
            onClick={() => setShowAll(!showAll)}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1,
              textTransform: 'none',
              fontWeight: 800,
              color: PURPLE,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.08)', transform: 'scale(1.05)' }
            }}
          >
            {showAll ? 'Thu gọn' : 'Xem thêm 28 đánh giá nữa'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
