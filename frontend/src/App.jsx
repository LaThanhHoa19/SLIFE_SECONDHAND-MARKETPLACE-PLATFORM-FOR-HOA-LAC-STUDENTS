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
import { Box, Typography } from '@mui/material';
import AppRouter from './routes/AppRouter';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('Global UI error', error); }
  render() {
    if (this.state.hasError) {
      return <Box p={3}><Typography>Đã có lỗi xảy ra. TODO: thêm retry/snackbar.</Typography></Box>;
    }
    return this.props.children;
  }
}

export default function App() {
  return <ErrorBoundary><AppRouter /></ErrorBoundary>;
}
