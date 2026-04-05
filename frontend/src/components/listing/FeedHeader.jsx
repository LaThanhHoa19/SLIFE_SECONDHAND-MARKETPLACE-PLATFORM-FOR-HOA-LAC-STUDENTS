import React, { useState } from 'react';
import { Box, Typography, Popover, IconButton, Avatar, AvatarGroup, InputBase, Button } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';

export default function FeedHeader() {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'feed-dropdown-popover' : undefined;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: 1 }}>
            {/* Top Bar with Dropdown */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                pt: 0.5,
                pb: 1.5,
                position: 'relative',
                zIndex: 10
            }}>
                <Box
                    onClick={handleClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 },
                        userSelect: 'none'
                    }}
                >
                    <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>
                        Mới nhất
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.2)',
                            bgcolor: 'transparent'
                        }}
                    >
                        <KeyboardArrowDownIcon sx={{ fontSize: 14, color: '#fff' }} />
                    </Box>
                </Box>

                <Popover
                    id={id}
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    slotProps={{
                        paper: {
                            sx: {
                                mt: 1.5,
                                backgroundColor: '#222222',
                                color: '#fff',
                                borderRadius: 4,
                                minWidth: 280,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.06)'
                            }
                        }
                    }}
                >
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>

                        <DropdownItem title="Mới nhất" rightIcon={<CheckIcon sx={{ fontSize: 20 }} />} />
                        <DropdownItem title="Nổi bật" />
                        <DropdownItem title="Đang theo dõi" />
                        <DropdownItem title="Trao tặng" />


                    </Box>
                </Popover>
            </Box>
        </Box>
    );
}

function DropdownItem({ title, subtitle, rightIcon, rightContent }) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                px: 1,
                cursor: 'pointer',
                borderRadius: 2,
                transition: 'background 0.2s',
                '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.05)'
                }
            }}
        >
            <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{title}</Typography>
                {subtitle && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mt: 0.25 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {rightIcon && <Box sx={{ color: '#fff', display: 'flex' }}>{rightIcon}</Box>}
                {rightContent && rightContent}
            </Box>
        </Box>
    );
}
