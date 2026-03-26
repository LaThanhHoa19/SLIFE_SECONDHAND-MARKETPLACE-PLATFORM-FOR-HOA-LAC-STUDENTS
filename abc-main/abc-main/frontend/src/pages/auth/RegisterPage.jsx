/** Tạm thời: test FilterPanel tại /register */
import { Box } from '@mui/material';
import FilterPanel from '../../components/layout/FilterPanel';

export default function RegisterPage() {
    return (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', bgcolor: '#1A1625', minHeight: '100vh' }}>
            <FilterPanel />
        </Box>
    );
}
