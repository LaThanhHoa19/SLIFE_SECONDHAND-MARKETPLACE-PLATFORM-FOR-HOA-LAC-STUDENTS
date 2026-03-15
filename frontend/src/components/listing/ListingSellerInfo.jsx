import { Avatar, Box, Chip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useNavigate } from 'react-router-dom';
import { fullImageUrl } from '../../utils/constants';

export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';

export default function ListingSellerInfo({ seller, sellerId }) {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          src={fullImageUrl(seller?.avatarUrl)}
          alt={seller?.fullName}
          sx={{ width: 52, height: 52, cursor: 'pointer', border: `2px solid ${PURPLE}` }}
          onClick={() => sellerId && navigate(`/profile/${sellerId}`)}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            fontSize={15}
            fontWeight={700}
            color={TEXT_PRI}
            sx={{
              cursor: 'pointer',
              '&:hover': { color: PURPLE },
              mb: 0.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onClick={() => sellerId && navigate(`/profile/${sellerId}`)}
          >
            {seller?.fullName || 'Người bán'}
          </Typography>
          <Chip
            label="Xem trang"
            onClick={() => sellerId && navigate(`/profile/${sellerId}`)}
            sx={{
              height: 22, fontSize: 11, fontWeight: 600,
              bgcolor: `${PURPLE}22`, color: PURPLE,
              '&:hover': { bgcolor: `${PURPLE}44` }, cursor: 'pointer'
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Đã bán */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography fontSize={16} fontWeight={800} color={TEXT_PRI}>
            {seller?.totalSold ?? 10}
          </Typography>
          <Typography fontSize={12} color={TEXT_SEC} sx={{ mt: -0.2 }}>Đã bán</Typography>
        </Box>
        {/* Đánh giá */}
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
            <Typography fontSize={16} fontWeight={800} color={TEXT_PRI}>
              {Number(seller?.reputationScore ?? 5).toFixed(1)}
            </Typography>
            <StarIcon sx={{ fontSize: 14, color: '#FFC107', mt: -0.2 }} />
          </Box>
          <Typography fontSize={12} color={TEXT_SEC} sx={{ mt: -0.2 }}>
            {seller?.reviewCount ?? 34} đánh giá
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
