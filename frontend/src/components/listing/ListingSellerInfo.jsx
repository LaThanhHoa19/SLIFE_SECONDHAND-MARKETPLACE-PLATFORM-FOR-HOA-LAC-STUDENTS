import { Avatar, Box, Chip, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { fullImageUrl } from '../../utils/constants';

export const TEXT_PRI = 'rgba(255,255,255,0.95)';
export const TEXT_SEC = 'rgba(255,255,255,0.55)';
export const PURPLE = '#9D6EED';
export const CARD_BG2 = '#252230';

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, width: '100%', py: 0.5 }}>
            {/* Left: Avatar with Follow Badge */}
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Tooltip title="Xem hồ sơ người bán">
                    <Avatar
                        src={fullImageUrl(seller?.avatarUrl)}
                        alt={seller?.fullName}
                        sx={{
                            width: 52,
                            height: 52,
                            cursor: 'pointer',
                            border: `2px solid ${PURPLE}`,
                            bgcolor: CARD_BG2,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        onClick={() => {
                            const targetId = sellerId ?? seller?.id;
                            if (!targetId) return;
                            const currentUser = JSON.parse(localStorage.getItem('user'));
                            if (String(targetId) === String(currentUser?.id)) navigate('/profile');
                            else navigate(`/profile/${targetId}`);
                        }}
                    />
                </Tooltip>
                {showFollow && (
                    <Tooltip title={isFollowed ? 'Bỏ theo dõi' : 'Theo dõi người bán'}>
                        <Box
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!followLoading) onFollowClick?.();
                            }}
                            sx={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                bgcolor: isFollowed ? PURPLE : '#FFF',
                                border: '1.5px solid #201D26',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: isFollowed ? '#FFF' : '#201D26',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                '&:hover': { transform: 'scale(1.15)' },
                                zIndex: 2,
                            }}
                        >
                            {followLoading ? (
                                <CircularProgress size={12} color="inherit" />
                            ) : isFollowed ? (
                                <CheckIcon sx={{ fontSize: 16, fontWeight: 900 }} />
                            ) : (
                                <AddIcon sx={{ fontSize: 18, fontWeight: 900 }} />
                            )}
                        </Box>
                    </Tooltip>
                )}
            </Box>

            {/* Right: Name + Stats - ALL IN THE SAME LINE GROUP */}
            <Box sx={{ flex: 1, minWidth: 0, pt: 0.3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: 2 }}>
                    <Typography
                        fontSize={16}
                        fontWeight={800}
                        color={TEXT_PRI}
                        sx={{
                            cursor: 'pointer',
                            '&:hover': { color: PURPLE },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: { xs: 150, sm: 300 }
                        }}
                        onClick={() => {
                            const targetId = sellerId ?? seller?.id;
                            if (targetId) navigate(`/profile/${targetId}`);
                        }}
                    >
                        {seller?.fullName || 'Người bán'}
                    </Typography>

                    {/* Stats Group - Directly next to the name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'nowrap' }}>
                        {/* Followers */}
                        {(seller?.followerCount != null || seller?.follower_count != null) && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography fontSize={14} fontWeight={900} color={TEXT_PRI}>
                                    {Number(seller?.followerCount ?? seller?.follower_count ?? 0)}
                                </Typography>
                                <Typography fontSize={10} color={TEXT_SEC} sx={{ whiteSpace: 'nowrap', mt: -0.5 }}>
                                    người theo dõi
                                </Typography>
                            </Box>
                        )}
                        {/* Sold */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography fontSize={14} fontWeight={900} color={TEXT_PRI}>
                                {Number(seller?.totalSold ?? seller?.total_sold ?? 0)}
                            </Typography>
                            <Typography fontSize={10} color={TEXT_SEC} sx={{ whiteSpace: 'nowrap', mt: -0.5 }}>đã bán</Typography>
                        </Box>

                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
