/**
 * Trang chỉnh sửa tin đăng — đường dẫn: /listings/:id/edit
 * (Form load + PUT sẽ bổ sung sau.)
 */
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function EditListingPage() {
    const { id } = useParams();

    return (
        <Box sx={{ maxWidth: 680, mx: 'auto', mt: 4, px: 2 }}>
            <Typography variant="h6" fontWeight={600} color="rgba(255,255,255,0.92)" gutterBottom>
                Chỉnh sửa tin đăng
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.55)">
                ID tin: {id}
            </Typography>
        </Box>
    );
}
