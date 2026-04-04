import { Dialog, DialogContent, DialogTitle, IconButton, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import CommunityPostComments from './CommunityPostComments';
import { fullImageUrl } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';

const PURPLE = '#9D6EED';

/**
 * Modal bình luận — cùng pattern CommentModal (listing), dùng cho bài cộng đồng.
 */
export default function CommunityCommentModal({ open, onClose, postId, post, onThreadDelta }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const { showToast } = useToast();

    const thumb = fullImageUrl(post?.thumbUrl || post?.images?.[0]);
    const title = post?.title || 'Bài cộng đồng';

    const onNotify = (msg, variant = 'success') => {
        if (variant === 'error') showToast(msg, 'error');
        else showToast(msg, 'success');
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#1A161F',
                    backgroundImage: 'none',
                    borderRadius: fullScreen ? 0 : '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
            }}
        >
            <DialogTitle
                component="div"
                sx={{
                    m: 0,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <Typography variant="h6" fontWeight={800} color="#FFF" sx={{ letterSpacing: 0.5 }}>
                    Bình luận
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: 'rgba(255,255,255,0.5)',
                        '&:hover': { color: '#FFF', bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <Box
                    sx={{
                        p: 2,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        bgcolor: 'rgba(157,110,237,0.05)',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}
                >
                    {thumb ? (
                        <Box
                            component="img"
                            src={thumb}
                            alt=""
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '10px',
                                objectFit: 'cover',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        />
                    ) : (
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '10px',
                                bgcolor: 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography variant="caption" color="rgba(255,255,255,0.2)">
                                No Img
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontSize={15} fontWeight={700} color="#FFF" noWrap sx={{ mb: 0.2 }}>
                            {title}
                        </Typography>
                        <Typography fontSize={13} fontWeight={600} color={PURPLE}>
                            Bài cộng đồng
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ height: fullScreen ? 'calc(100vh - 120px)' : '500px', overflow: 'auto' }}>
                    {postId ? (
                        <CommunityPostComments postId={postId} onNotify={onNotify} onThreadDelta={onThreadDelta} />
                    ) : null}
                </Box>
            </DialogContent>
        </Dialog>
    );
}
