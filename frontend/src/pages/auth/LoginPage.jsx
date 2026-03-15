import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';

const GOOGLE_CLIENT_ID_FALLBACK =
    '318344558779-vee2ail43gcadoi97fo2q9122jm9qe7k.apps.googleusercontent.com';

export default function LoginPage() {
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const [urlError, setUrlError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const { login, googleLogin, authError } = useAuth();
  const GOOGLE_CLIENT_ID =
      import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK;

  // Read ?google_error= from URL (set by backend on OAuth failure)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleErr = params.get('google_error');
    if (googleErr) {
      setUrlError(decodeURIComponent(googleErr));
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const displayError = urlError || googleError || authError || '';

  const onSubmit = async (values) => {
    setUrlError('');
    const result = await login(values, {
      onSuccess: () => navigate('/feed'),
    });
    if (!result.success) {
      // authError is set inside login(), displayed via displayError
    }
  };

  useEffect(() => {
    let cancelled = false;
    let renderCheckTimeout;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleBtnRef.current) {
        return;
      }

      try {
        setGoogleError('');
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            const result = await googleLogin(response.credential, {
              onSuccess: () => navigate('/feed'),
            });
            if (!result.success && !cancelled) {
              setGoogleError(result.error || 'Đăng nhập Google thất bại.');
            }
          },
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 320,
        });

        // GIS can fail silently (for example when the current origin is not allowed).
        renderCheckTimeout = window.setTimeout(() => {
          if (cancelled || !googleBtnRef.current) {
            return;
          }
          const hasRenderedButton = googleBtnRef.current.innerHTML.trim().length > 0;
          if (hasRenderedButton) {
            setGoogleReady(true);
            return;
          }
          setGoogleReady(false);
          setGoogleError(
              `Google Sign-In chưa được cấu hình cho ${window.location.origin}. ` +
              'Hãy thêm origin này vào Authorized JavaScript origins trong Google Cloud Console.',
          );
        }, 1200);
      } catch (error) {
        if (!cancelled) {
          setGoogleError(error?.message || 'Không thể khởi tạo Google Sign-In.');
        }
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
        window.clearTimeout(renderCheckTimeout);
      };
    }

    const existingScript = document.getElementById('google-identity-script');
    if (existingScript) {
      existingScript.addEventListener('load', renderGoogleButton, { once: true });
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => {
      if (!cancelled) {
        setGoogleError('Không tải được Google Sign-In script.');
      }
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      window.clearTimeout(renderCheckTimeout);
    };
  }, [GOOGLE_CLIENT_ID, googleLogin, navigate]);

  return (
      <Box sx={{ minHeight: 'calc(100vh - 120px)', display: 'grid', placeItems: 'center', p: 2 }}>
        <Paper elevation={3} sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h4" fontWeight={700}>Đăng nhập</Typography>
              <Typography variant="body2" color="text.secondary">
                Đăng nhập bằng email hoặc Google SSO (@fpt.edu.vn).
              </Typography>
            </Box>

            {displayError && (
                <Alert severity="error" onClose={() => setUrlError('')}>
                  {displayError}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <TextField
                    fullWidth
                    label="Email"
                    autoComplete="email"
                    {...register('email', {
                      required: 'Email bắt buộc',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Email không hợp lệ',
                      },
                    })}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                />
                <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password', {
                      required: 'Mật khẩu bắt buộc',
                      minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                    })}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                />
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Đăng nhập'}
                </Button>
              </Stack>
            </Box>

            <Divider>hoặc</Divider>

            <Stack spacing={1} alignItems="center">
              <Box ref={googleBtnRef} sx={{ minHeight: 44 }} />
              {!googleReady && !googleError && (
                  <Typography variant="caption" color="text.secondary">
                    Đang tải Google Sign-In...
                  </Typography>
              )}
            </Stack>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              Chỉ chấp nhận tài khoản @fpt.edu.vn
            </Typography>
          </Stack>
        </Paper>
      </Box>
  );
}
