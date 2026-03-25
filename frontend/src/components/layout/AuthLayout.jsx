/**
 * Layout cho /login, /register — Header + Sidebar + Footer với feed (SCRUM-93).
 * /admin/login không dùng layout này (khai báo riêng trong AppRouter).
 */
import { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1C1B23' }}>
            <Outlet />
        </Box>
    );
}
