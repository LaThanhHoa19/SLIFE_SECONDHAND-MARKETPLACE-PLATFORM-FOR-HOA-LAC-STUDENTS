import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Alert,
    Button,
    Box,
    Divider,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import {
    VpnKeyOutlined as GuestIcon,
    BoltRounded as BoltIcon,
    VerifiedUserRounded as VerifiedIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import Footer from '../../components/layout/Footer';
import { uiTokens } from '../../theme/uiTokens';

const GOOGLE_CLIENT_ID_FALLBACK =
    '318344558779-vee2ail43gcadoi97fo2q9122jm9qe7k.apps.googleusercontent.com';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef(null);
  const [urlError, setUrlError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);

    const { googleLogin, authError } = useAuth();
    const GOOGLE_CLIENT_ID =
        import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK;

  const getRedirectTarget = () => {
    // Priority 1: State from navigate ({ state: { from: pathname } })
    if (location.state?.from) return location.state.from;

    // Priority 2: Query parameter (?redirect=...)
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    return redirect ? decodeURIComponent(redirect) : '/feed';
  };

    const displayError = urlError || googleError || authError || '';

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
                            onSuccess: () => navigate(getRedirectTarget()),
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
                    width: 360,
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
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 0,
                position: 'relative',
                overflow: 'hidden',
                background: `
              radial-gradient(900px 520px at 18% 6%, rgba(157,110,237,0.22), transparent 58%),
              radial-gradient(900px 560px at 88% 12%, rgba(124,58,237,0.26), transparent 58%),
              linear-gradient(135deg, #141225 0%, #151329 52%, #1C1535 100%)
            `,
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    px: { xs: 2, md: 3 },
                    pt: { xs: 2, md: 2.5 },
                }}
            >
                <Typography sx={{ color: uiTokens.colors.brand.textSoft, fontWeight: 700, fontSize: '1.95rem', letterSpacing: '0.02em' }}>
                    Slife
                </Typography>
            </Box>

            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 760,
                    mx: 'auto',
                    mt: { xs: 2, md: 0 },
                    px: { xs: 2, md: 0 },
                    borderRadius: 6,
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    textAlign: 'center',
                }}
            >
                <Stack spacing={1} sx={{ mb: 3 }}>
                    <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{
                            color: uiTokens.colors.brand.textStrong,
                            letterSpacing: '0.06em',
                            fontSize: { xs: '3.1rem', sm: '4.2rem' },
                            lineHeight: 1,
                        }}
                    >
                        SLIFE
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.82)', fontWeight: 700, fontSize: { xs: '1.5rem', sm: '2rem' }, letterSpacing: '0.04em' }}>
                        SECONDHAND MARKETPLACE
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.54)', fontWeight: 500, fontSize: '0.9rem', letterSpacing: '0.28em' }}>
                        BUY · SELL · CONNECT
                    </Typography>
                </Stack>

                <Paper
                    elevation={0}
                    sx={{
                        width: '100%',
                        maxWidth: 430,
                        mx: 'auto',
                        borderRadius: 5,
                        border: '1px solid rgba(255,255,255,0.09)',
                        bgcolor: 'rgba(23,21,34,0.76)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 22px 46px rgba(0,0,0,0.5)',
                        p: { xs: 2.5, sm: 3.25 },
                    }}
                >
                    <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.95rem', mb: 1 }}>
                        Chào mừng trở lại
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.66)', mb: 2.5 }}>
                        Đăng nhập để tiếp tục trải nghiệm mua bán trên SLIFE.
                    </Typography>

                    {displayError && (
                        <Alert severity="error" onClose={() => setUrlError('')} sx={{ mb: 2, textAlign: 'left' }}>
                            {displayError}
                        </Alert>
                    )}

                    <Stack spacing={1} alignItems="center">
                        <Box ref={googleBtnRef} sx={{ minHeight: 46, width: '100%', display: 'grid', placeItems: 'center' }} />
                        {!googleReady && !googleError && (
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                                Đang tải Google Sign-In...
                            </Typography>
                        )}
                    </Stack>

                    <Divider sx={{ my: 2.25, borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.42)', fontSize: '0.74rem', letterSpacing: '0.12em' }}>
                        HOẶC SỬ DỤNG
                    </Divider>

                    <Stack direction="row" spacing={1.5}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<GuestIcon />}
                            onClick={() => navigate(getRedirectTarget())}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 3,
                                py: 1.2,
                                fontWeight: 600,
                                color: 'rgba(255,255,255,0.88)',
                                borderColor: 'rgba(167,139,250,0.35)',
                                bgcolor: 'rgba(157,110,237,0.14)',
                                '&:hover': {
                                    borderColor: 'rgba(167,139,250,0.55)',
                                    bgcolor: 'rgba(157,110,237,0.2)',
                                },
                            }}
                        >
                            Tiếp tục với Guest
                        </Button>
                    </Stack>

                    <Typography
                        variant="caption"
                        sx={{ color: 'rgba(255,255,255,0.45)', mt: 1.75, display: 'block', textAlign: 'center' }}
                    >
                        Chỉ chấp nhận tài khoản trường có đuôi @fpt.edu.vn
                    </Typography>
                </Paper>

                <Box sx={{ mt: 3, mb: { xs: 3, md: 4 }, textAlign: 'center' }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.74)', mb: 2.2, fontWeight: 500 }}>
                        Nền tảng mua bán đồ cũ dành cho sinh viên khu vực Hòa Lạc.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
                        <Box sx={{ minWidth: 190, px: 2, py: 1.5, borderRadius: 3, border: `1px solid ${uiTokens.colors.brand.accentSubtle}`, bgcolor: 'rgba(157,110,237,0.12)', display: 'flex', gap: 1, alignItems: 'center' }}>
                            <BoltIcon sx={{ color: '#a78bfa', fontSize: 18 }} />
                            <Box sx={{ textAlign: 'left' }}>
                                <Typography sx={{ color: uiTokens.colors.surface.textSecondary, fontSize: '0.72rem', letterSpacing: '0.08em' }}>TỐC ĐỘ</Typography>
                                <Typography sx={{ color: '#fff', fontSize: '0.88rem', fontWeight: 700 }}>Chốt đơn 24/7</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ minWidth: 190, px: 2, py: 1.5, borderRadius: 3, border: `1px solid ${uiTokens.colors.brand.accentSubtle}`, bgcolor: 'rgba(157,110,237,0.12)', display: 'flex', gap: 1, alignItems: 'center' }}>
                            <VerifiedIcon sx={{ color: '#a78bfa', fontSize: 18 }} />
                            <Box sx={{ textAlign: 'left' }}>
                                <Typography sx={{ color: uiTokens.colors.surface.textSecondary, fontSize: '0.72rem', letterSpacing: '0.08em' }}>UY TÍN</Typography>
                                <Typography sx={{ color: '#fff', fontSize: '0.88rem', fontWeight: 700 }}>Xác thực Email</Typography>
                            </Box>
                        </Box>
                    </Stack>
                </Box>
            </Paper>

            <Box sx={{ width: '100%', mt: 'auto' }}>
                <Footer variant="minimal" />
            </Box>
        </Box>
    );
}
