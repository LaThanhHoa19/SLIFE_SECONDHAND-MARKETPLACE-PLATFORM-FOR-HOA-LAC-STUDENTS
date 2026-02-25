/** Mục đích: Hộp thoại xác nhận thao tác nguy hiểm (hide/sold/block/report). */
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
export default function ConfirmDialog({open,title,content,onConfirm,onClose}){ return <Dialog open={open} onClose={onClose}><DialogTitle>{title || 'Xác nhận'}</DialogTitle><DialogContent>{content || 'TODO nội dung'}</DialogContent><DialogActions><Button onClick={onClose}>Hủy</Button><Button color='error' onClick={onConfirm}>Xác nhận</Button></DialogActions></Dialog>; }
