/**
 * Mục đích: Root app + global error boundary.
 * API endpoints: Không gọi trực tiếp.
 * Request/Response: N/A.
 * Props: N/A.
 * Validation: N/A.
 * Accessibility: fallback text rõ ràng cho screen reader.
 * Tests cần viết: render router và fallback khi throw error.
 */
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Stack } from '@mui/material';
import { useLocation } from 'react-router-dom';
import AppRouter from './routes/AppRouter';
import ScrollToTop from './components/common/ScrollToTop';

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
  const [mockupMode, setMockupMode] = useState(() => {
    if (typeof window === 'undefined') return 'off';
    const saved = window.localStorage.getItem('figma-mockup-mode');
    return saved === 'mockup' || saved === 'super' ? saved : 'off';
  });

  const isMockupMode = mockupMode !== 'off';
  const isSuperWireframe = mockupMode === 'super';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('figma-mockup-mode', isMockupMode);
    document.body.classList.toggle('figma-wireframe-super', isSuperWireframe);
    window.localStorage.setItem('figma-mockup-mode', mockupMode);
  }, [isMockupMode, isSuperWireframe, mockupMode]);

  useEffect(() => {
    const cycleMode = () => {
      setMockupMode((prev) => {
        if (prev === 'off') return 'mockup';
        if (prev === 'mockup') return 'super';
        return 'off';
      });
    };

    const onKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        cycleMode();
      }

      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'w') {
        event.preventDefault();
        setMockupMode((prev) => (prev === 'super' ? 'off' : 'super'));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
      <ErrorBoundary>
        <ScrollToTop />
        <AppRouter />
      </ErrorBoundary>
  );
}
