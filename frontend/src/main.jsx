/**
 * Mục đích: Entry point, bọc App bằng ThemeProvider, AuthProvider, BrowserRouter.
 * API dùng: gián tiếp qua AuthContext và hooks.
 * Request/Response: N/A.
 * Props: N/A.
 * Validation: N/A.
 * Accessibility: đảm bảo CssBaseline + ngôn ngữ tài liệu.
 * Tests cần viết: render app root không crash; providers được mount.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './providers/NotificationProvider';
import theme from './theme/theme';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
