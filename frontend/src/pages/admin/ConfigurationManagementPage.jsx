/** Mục đích: Cấu hình hệ thống. API: GET/PATCH /api/admin/settings. */
import { Box, Typography } from '@mui/material';

export default function ConfigurationManagementPage() {
    return (
        <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff', mb: 2 }}>
                Cấu hình hệ thống
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                TODO: System configuration
            </Typography>
        </Box>
    );
}
