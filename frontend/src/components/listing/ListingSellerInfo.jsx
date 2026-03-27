import { Avatar, Box, Chip, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { useNavigate } from 'react-router-dom';
import { fullImageUrl } from '../../utils/constants';

export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';

export default function ListingSellerInfo({
                                              seller,
                                              sellerId,
                                              showFollow,
                                              isFollowed,
                                              followLoading,
                                              onFollowClick,
                                          }) {
    const navigate = useNavigate();

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                    src={fullImageUrl(seller?.avatarUrl)}
                    alt={seller?.fullName}
                    sx={{ width: 52, height: 52, cursor: 'pointer', border: `2px solid ${PURPLE}` }}
                    onClick={() => {
                        const targetId = sellerId ?? seller?.id;
                        if (!targetId) return;
                        const currentUser = JSON.parse(localStorage.getItem('user')); // useAuth context is better but this is a quick fix if context is not passed
                        if (String(targetId) === String(currentUser?.id)) navigate('/profile');
                        else navigate(`/profile/${targetId}`);
                    }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography
                            fontSize={18}
                            fontWeight={800}
                            color={TEXT_PRI}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { color: PURPLE },
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            onClick={() => {
                                const targetId = sellerId ?? seller?.id;
                                if (targetId) navigate(`/profile/${targetId}`);
                            }}
                        >
                            {seller?.fullName || 'Người bán'}
                        </Typography>

                        {showFollow && (
                            <Tooltip title={isFollowed ? 'Bỏ theo dõi' : 'Theo dõi người bán'}>
                                <span>
                                    <IconButton
                                        size="small"
                                        disabled={followLoading}
                                        onClick={() => onFollowClick?.()}
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            color: isFollowed ? PURPLE : TEXT_SEC,
                                            border: `1px solid ${isFollowed ? PURPLE : 'rgba(255,255,255,0.15)'}`,
                                            bgcolor: isFollowed ? `${PURPLE}11` : 'transparent',
                                            '&:hover': { bgcolor: `${PURPLE}22`, color: PURPLE },
                                        }}
                                    >
                                        {followLoading ? (
                                            <CircularProgress size={16} color="inherit" />
                                        ) : isFollowed ? (
                                            <PersonRemoveIcon sx={{ fontSize: 18 }} />
                                        ) : (
                                            <PersonAddIcon sx={{ fontSize: 18 }} />
                                        )}
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {(seller?.followerCount != null || seller?.follower_count != null) && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography fontSize={16} fontWeight={800} color={TEXT_PRI}>
                            {Number(seller?.followerCount ?? seller?.follower_count ?? 0)}
                        </Typography>
                        <Typography fontSize={12} color={TEXT_SEC} sx={{ mt: -0.2 }}>
                            Người theo dõi
                        </Typography>
                    </Box>
                )}
                {/* Đã bán */}
                <Box sx={{ textAlign: 'center' }}>
                    <Typography fontSize={16} fontWeight={800} color={TEXT_PRI}>
                        {Number(seller?.totalSold ?? seller?.total_sold ?? 0)}
                    </Typography>
                    <Typography fontSize={12} color={TEXT_SEC} sx={{ mt: -0.2 }}>Đã bán</Typography>
                </Box>
                {/* Đánh giá */}
                <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
                        <Typography fontSize={16} fontWeight={800} color={TEXT_PRI}>
                            {Number(seller?.reputationScore ?? seller?.reputation_score ?? 0).toFixed(1)}
                        </Typography>
                        <StarIcon sx={{ fontSize: 14, color: '#FFC107', mt: -0.2 }} />
                    </Box>
                    <Typography fontSize={12} color={TEXT_SEC} sx={{ mt: -0.2 }}>
                        {Number(seller?.reviewCount ?? seller?.review_count ?? 0)} đánh giá
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
