import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
} from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { DANGER_DARK_DIALOG_PAPER_PROPS } from '../../../components/common/dialogStyles';

export default function DeleteDraftDialog({ open, isDeleting, onClose, onConfirm }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    ...DANGER_DARK_DIALOG_PAPER_PROPS.sx,
                    borderRadius: '16px',
                    px: 0.5,
                    minWidth: 340,
                },
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                <Box sx={{
                    width: 36, height: 36,
                    borderRadius: '10px',
                    bgcolor: 'rgba(255,71,87,0.12)',
                    border: '1px solid rgba(255,71,87,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <DeleteIcon sx={{ fontSize: 18, color: '#ff4757' }} />
                </Box>
                <Typography fontSize={16} fontWeight={700} color="rgba(255,255,255,0.9)">
                    Xóa bản nháp
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 0.5 }}>
                <DialogContentText sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6 }}>
                    Bạn có chắc chắn muốn xóa bản nháp này?{' '}
                    <Box component="span" sx={{ color: '#ff4757', fontWeight: 600 }}>
                        Hành động này không thể hoàn tác.
                    </Box>
                </DialogContentText>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                <Button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    sx={{
                        flex: 1,
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)' },
                    }}
                >
                    Hủy
                </Button>
                <Button
                    type="button"
                    onClick={onConfirm}
                    disabled={isDeleting}
                    sx={{
                        flex: 1,
                        borderRadius: '10px',
                        bgcolor: '#ff4757',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#e03040' },
                        '&:disabled': { bgcolor: 'rgba(255,71,87,0.4)', color: 'rgba(255,255,255,0.5)' },
                    }}
                    variant="contained"
                    disableElevation
                >
                    {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
