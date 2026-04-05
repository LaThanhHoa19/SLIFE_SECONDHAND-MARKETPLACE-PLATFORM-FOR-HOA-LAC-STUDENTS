import { Avatar, Box, Button, CircularProgress, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BlockIcon from '@mui/icons-material/Block';
import { useState } from 'react';
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
                                              showBlock = false,
                                              onBlockClick,
                                          }) {
    const navigate = useNavigate();
    const [menuAnchor, setMenuAnchor] = useState(null);

    const handleNavigateProfile = () => {
        const targetId = sellerId ?? seller?.id;
        if (!targetId) return;
        const currentUserData = localStorage.getItem('user');
        const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
        if (String(targetId) === String(currentUser?.id)) navigate('/profile');
        else navigate(`/profile/${targetId}`);
    };

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
                            bgcolor: PURPLE, // Đổi sang màu Tím đồng bộ
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            fontSize: '1.2rem',
                            fontWeight: 700
                        }}
                        onClick={handleNavigateProfile}
                    >
                        <PersonIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.85)' }} />
                    </Avatar>
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
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            fontSize={16}
                            fontWeight={700}
                            color={TEXT_PRI}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { color: PURPLE },
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            onClick={handleNavigateProfile}
                        >
                            {seller?.fullName || 'Người bán'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            {/* Followers */}
                            {(seller?.followerCount != null || seller?.follower_count != null) && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography fontSize={13} fontWeight={700} color={TEXT_PRI}>
                                        {Number(seller?.followerCount ?? seller?.follower_count ?? 0)}
                                    </Typography>
                                    <Typography fontSize={13} color={TEXT_SEC}>người theo dõi</Typography>
                                </Box>
                            )}
                            
                            {/* Sold */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography fontSize={13} fontWeight={700} color={TEXT_PRI}>
                                    {Number(seller?.totalSold ?? seller?.total_sold ?? 0)}
                                </Typography>
                                <Typography fontSize={13} color={TEXT_SEC}>đã bán</Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* View Profile Button - Compact pill like Cho Tot */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleNavigateProfile}
                            sx={{
                                color: TEXT_PRI,
                                borderColor: 'rgba(255,255,255,0.15)',
                                textTransform: 'none',
                                fontSize: 13,
                                fontWeight: 800,
                                borderRadius: '24px',
                                px: 2.5,
                                height: 34,
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.08)',
                                    borderColor: PURPLE,
                                    color: PURPLE,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    transform: 'translateY(-1px)'
                                },
                                '&:active': {
                                    transform: 'translateY(0)'
                                }
                            }}
                        >
                            Xem trang
                        </Button>
                        {showBlock && typeof onBlockClick === 'function' && (
                            <>
                                <Tooltip title="Thêm tùy chọn">
                                    <IconButton
                                        size="small"
                                        aria-label="Tùy chọn người bán"
                                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                                        sx={{ color: TEXT_SEC }}
                                    >
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Menu
                                    anchorEl={menuAnchor}
                                    open={Boolean(menuAnchor)}
                                    onClose={() => setMenuAnchor(null)}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                    PaperProps={{
                                        sx: {
                                            bgcolor: CARD_BG2,
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            '& .MuiMenuItem-root': { fontSize: 14 },
                                        },
                                    }}
                                >
                                    <MenuItem
                                        onClick={() => {
                                            setMenuAnchor(null);
                                            onBlockClick();
                                        }}
                                        sx={{ color: 'rgba(255,255,255,0.9)', gap: 1 }}
                                    >
                                        <BlockIcon fontSize="small" />
                                        Chặn người bán
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
