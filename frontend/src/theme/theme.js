/** Mục đích: MUI theme skeleton (palette, typography, component overrides). */
import { createTheme } from '@mui/material';
const theme = createTheme({ palette: { mode: 'light', primary: { main: '#1976d2' }, secondary: { main: '#9c27b0' } }, typography: { fontFamily: 'Inter, Roboto, Arial, sans-serif' }, components: { MuiButton: { defaultProps: { variant: 'contained' } } } });
export default theme;
