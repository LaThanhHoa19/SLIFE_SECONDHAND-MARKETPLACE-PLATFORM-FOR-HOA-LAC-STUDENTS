import { Box, Button, Chip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

const PAGE_BG = '#1C1B23';
const CARD_BG = '#201D26';
const BORDER = 'rgba(255, 255, 255, 0.07)';
const TEXT_PRI = 'rgba(255, 255, 255, 0.95)';
const TEXT_SEC = 'rgba(255, 255, 255, 0.55)';
const PURPLE = '#9D6EED';

export default function ReviewList({ reviews, showAll, setShowAll }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {reviews.map((review) => (
        <Box
          key={review.id}
          sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: '#252230',
            border: `1px solid ${BORDER}`,
            transition: 'transform 0.2s, background 0.2s',
            '&:hover': { 
              transform: 'translateY(-2px)', 
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              bgcolor: '#2A2736'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography fontWeight={800} color={TEXT_PRI}>{review.reviewer}</Typography>
            <Typography variant="caption" color={TEXT_SEC}>{review.time}</Typography>
          </Box>
          <Box sx={{ display: 'flex', mb: 1.5 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon key={s} sx={{ fontSize: 16, color: s <= review.rating ? '#FFC107' : '#e0e0e0' }} />
            ))}
          </Box>
          <Typography variant="body2" sx={{ mb: 2, color: TEXT_PRI, lineHeight: 1.7 }}>
            {review.content}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: review.product ? 2 : 0 }}>
            {review.tags?.map(tag => (
              <Chip key={tag} label={tag} size="small" sx={{ height: 20, fontSize: 11, bgcolor: '#f0f0f2', color: 'text.secondary' }} />
            ))}
          </Box>
          {review.product && (
            <Box sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2.5, display: 'flex', alignItems: 'center', gap: 2, border: `1px solid ${BORDER}` }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box component="span" sx={{ fontSize: 20, opacity: 0.4 }}>📦</Box>
              </Box>
              <Typography variant="caption" fontWeight={700} color={TEXT_SEC}>Sản phẩm: {review.product}</Typography>
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
              px: 5,
              py: 1,
              textTransform: 'none',
              fontWeight: 700,
              borderColor: PURPLE,
              color: PURPLE,
                  borderColor: 'rgba(157, 110, 237, 0.3)',
                  color: PURPLE,
                  borderWidth: 1.5,
                  '&:hover': { borderColor: PURPLE, bgcolor: 'rgba(157, 110, 237, 0.08)', borderWidth: 1.5 }
            }}
          >
            {showAll ? 'Thu gọn' : 'Xem thêm đánh giá'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
