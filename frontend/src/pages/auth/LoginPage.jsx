/**
 * Trang đăng nhập – Google SSO (@fpt.edu.vn) và đăng nhập test (Alice, Bob).
 */
import { Alert, Box, Button, Chip, CircularProgress, Divider, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../hooks/useAuth';

const TEST_ACCOUNTS = [
  { email: 'alice@example.com', label: 'Alice (người bán)' },
  { email: 'bob@example.com', label: 'Bob (người mua)' },
];

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

function loadGoogleScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export default function LoginPage() {
  const { loginWithGoogle, loginWithTestAccount, isAuthenticated, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(null);
  const [chatInitLoading, setChatInitLoading] = useState(false);
  const [chatInitResult, setChatInitResult] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    if (!GOOGLE_CLIENT_ID) {
      setScriptReady(false);
      return;
    }
    loadGoogleScript().then(() => setScriptReady(true));
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!scriptReady || !buttonRef.current || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      hosted_domain: 'fpt.edu.vn',
      callback: async (response) => {
        setLoading(true);
        clearAuthError();
        const result = await loginWithGoogle(response.credential);
        setLoading(false);
        if (result?.success) {
          navigate('/', { replace: true });
        }
      },
      auto_select: false,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 280,
    });
  }, [scriptReady, loginWithGoogle, navigate, clearAuthError]);

  if (isAuthenticated) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        px: 2,
      }}
    >
      <Typography variant="h5" gutterBottom>
        Đăng nhập SLIFE
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Chỉ tài khoản Google đuôi <strong>@fpt.edu.vn</strong> được phép đăng nhập.
      </Typography>

      {!GOOGLE_CLIENT_ID && (
        <Typography color="error">Thiếu cấu hình VITE_GOOGLE_CLIENT_ID.</Typography>
      )}
      {GOOGLE_CLIENT_ID && (
        <Box ref={buttonRef} sx={{ minHeight: 44 }}>
          {loading && (
            <Typography variant="body2" color="text.secondary">
              Đang xác thực...
            </Typography>
          )}
        </Box>
      )}

      <Divider sx={{ my: 3, width: '100%', maxWidth: 320 }}>hoặc</Divider>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Test nhanh với tài khoản mẫu
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {TEST_ACCOUNTS.map(({ email, label }) => (
          <Button
            key={email}
            variant="outlined"
            size="medium"
            disabled={!!testLoading}
            onClick={async () => {
              setTestLoading(email);
              clearAuthError();
              const result = await loginWithTestAccount(email);
              setTestLoading(null);
              if (result?.success) navigate('/', { replace: true });
            }}
            sx={{ textTransform: 'none' }}
          >
            {testLoading === email ? 'Đang đăng nhập...' : label}
          </Button>
        ))}
      </Box>

      {authError && (
        <Typography color="error" sx={{ mt: 2 }}>
          {authError}
        </Typography>
      )}

      {/* Setup test chat environment */}
      <Divider sx={{ my: 3, width: '100%', maxWidth: 400 }}>Test Chat</Divider>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
        Dùng nút bên dưới để tạo sẵn conversation giữa Alice và Bob cho việc test
      </Typography>
      <Button
        variant="contained"
        color="secondary"
        disabled={chatInitLoading}
        startIcon={chatInitLoading ? <CircularProgress size={16} color="inherit" /> : null}
        onClick={async () => {
          setChatInitLoading(true);
          setChatInitResult(null);
          try {
            const res = await axiosClient.get('/api/auth/test-chat-init');
            const data = res?.data?.data || res?.data;
            if (data?.sessionId) {
              localStorage.setItem('slife_test_session_id', data.sessionId);
              setChatInitResult({ success: true, data });
            } else {
              setChatInitResult({ success: false, error: 'Không nhận được sessionId' });
            }
          } catch (e) {
            setChatInitResult({ success: false, error: e?.response?.data?.message || e.message });
          } finally {
            setChatInitLoading(false);
          }
        }}
        sx={{ textTransform: 'none' }}
      >
        🔧 Khởi tạo Test Chat (Alice ↔ Bob)
      </Button>

      {chatInitResult?.success && (
        <Alert severity="success" sx={{ mt: 2, maxWidth: 440 }}>
          <Typography variant="body2" fontWeight={600}>Chat đã được tạo!</Typography>
          <Typography variant="caption" display="block">Session ID: <strong>{chatInitResult.data.sessionId}</strong></Typography>
          <Typography variant="caption" display="block">Alice ID: {chatInitResult.data.aliceId} | Bob ID: {chatInitResult.data.bobId}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            1. Đăng nhập với <strong>Alice</strong> → vào trang Chat → thấy tin nhắn của Bob<br />
            2. Mở tab khác → đăng nhập với <strong>Bob</strong> → vào trang Chat → gửi thêm tin
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Chip size="small" label={`Listing #${chatInitResult.data.listingId}`} color="info" />
            <Chip size="small" label={`Session: ${chatInitResult.data.sessionId?.slice(0, 8)}...`} color="primary" />
          </Box>
        </Alert>
      )}
      {chatInitResult?.success === false && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 440 }}>
          {chatInitResult.error}
        </Alert>
      )}
    </Box>
  );
}
