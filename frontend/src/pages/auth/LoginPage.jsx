/**
 * Trang đăng nhập – chỉ Google SSO (email @fpt.edu.vn).
 * Load Google Identity Services, nút "Đăng nhập bằng Google", gửi id_token lên backend.
 */
import { Box, Button, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

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
  const { loginWithGoogle, isAuthenticated, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);

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

      {authError && (
        <Typography color="error" sx={{ mt: 2 }}>
          {authError}
        </Typography>
      )}
    </Box>
  );
}
