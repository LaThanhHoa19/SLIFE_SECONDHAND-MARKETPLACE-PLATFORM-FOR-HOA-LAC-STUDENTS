/**
 * Mục đích: Root app + global error boundary.
 * API endpoints: Không gọi trực tiếp.
 * Request/Response: N/A.
 * Props: N/A.
 * Validation: N/A.
 * Accessibility: fallback text rõ ràng cho screen reader.
 * Tests cần viết: render router và fallback khi throw error.
 */
import React from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import AppRouter from './routes/AppRouter';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('Global UI error', error); }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center', p: 3 }}>
          <Stack spacing={2} sx={{ width: '100%', maxWidth: 520 }}>
            <Alert severity="error">
              Đã có lỗi giao diện xảy ra. Hãy thử tải lại trang hoặc quay lại trang đăng nhập.
            </Alert>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => window.location.reload()}>
                Tải lại trang
              </Button>
              <Button variant="outlined" onClick={() => { window.location.href = '/login'; }}>
                Về đăng nhập
              </Button>
            </Stack>
          </Stack>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const location = useLocation();

  return <ErrorBoundary key={`${location.pathname}${location.search}`}><AppRouter /></ErrorBoundary>;
}
