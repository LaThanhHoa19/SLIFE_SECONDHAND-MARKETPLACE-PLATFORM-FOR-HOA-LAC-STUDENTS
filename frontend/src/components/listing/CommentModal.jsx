import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
    Box,
    useTheme,
    useMediaQuery,
    Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import ListingComments from './ListingComments';
import { fullImageUrl } from '../../utils/constants';
import { getPurposeInfo } from '../../utils/listingFormatUtils';

export default function CommentModal({ open, onClose, listingId, listing }) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const imageUrl = listing?.images?.[0] ? fullImageUrl(listing.images[0]) : null;
    const purposeInfo = getPurposeInfo(listing?.isGiveaway, listing?.price, { fullLabel: true });

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
                    overflow: 'hidden', // Khóa cuộn lớp Paper
                }
            }}
        >
            <DialogTitle component="div" sx={{ 
                m: 0, 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <Typography variant="h6" fontWeight={800} color="#FFF" sx={{ letterSpacing: 0.5 }}>
                    Bình luận
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ 
                        color: 'rgba(255,255,255,0.5)',
                        '&:hover': { color: '#FFF', bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, overflowY: 'auto', maxHeight: fullScreen ? 'none' : '75vh' }}>
                {/* Visual Listing Header Preview */}
                <Box sx={{ 
                    p: 2, 
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'center',
                    bgcolor: 'rgba(157,110,237,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    position: 'sticky', // Tiêu đề tin đăng đứng yên khi cuộn cmt
                    top: 0,
                    zIndex: 10
                }}>
                    {imageUrl ? (
                        <Box
                            component="img"
                            src={imageUrl}
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: '10px',
                                objectFit: 'cover',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        />
                    ) : (
                        <Box sx={{ 
                            width: 56, height: 56, borderRadius: '10px', 
                            bgcolor: 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                             <Typography variant="caption" color="rgba(255,255,255,0.2)">No Img</Typography>
                        </Box>
                    )}
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                            fontSize={15} 
                            fontWeight={700} 
                            color="#FFF" 
                            noWrap 
                            sx={{ mb: 0.2 }}
                        >
                            {listing?.title}
                        </Typography>
                        <Typography 
                            fontSize={16} 
                            fontWeight={800} 
                            color={purposeInfo.color}
                        >
                            {purposeInfo.priceText}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ p: 0, overflow: 'visible' }}>
                    <ListingComments listingId={listingId} />
                </Box>
            </DialogContent>
        </Dialog>
    );
}
