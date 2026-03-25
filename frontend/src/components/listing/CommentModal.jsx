import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
    Box,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import ListingComments from './ListingComments';

export default function CommentModal({ open, onClose, listingId, listingTitle }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

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
                }
            }}
        >
            <DialogTitle sx={{ 
                m: 0, 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <Typography variant="h6" fontWeight={600} color="#FFF">
                    Bình luận
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', mb: 1 }}>
                    <Typography fontSize={14} color="rgba(255,255,255,0.6)">
                        Đang xem bình luận cho:
                    </Typography>
                    <Typography fontSize={15} fontWeight={600} color="#9D6EED" noWrap>
                        {listingTitle}
                    </Typography>
                </Box>
                <Box sx={{ height: fullScreen ? 'calc(100vh - 120px)' : '500px', overflow: 'auto' }}>
                    <ListingComments listingId={listingId} />
                </Box>
            </DialogContent>
        </Dialog>
    );
}
