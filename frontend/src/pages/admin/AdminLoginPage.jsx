import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm();

    const { login, logout } = useAuth();

    const onSubmit = async (values) => {
        setLoginError('');
        const result = await login(values, {
            onSuccess: async (payload) => {
                const role = payload?.user?.role;
                if (role === 'ADMIN' || role === 'MODERATOR') {
                    navigate('/admin');
                } else {
                    await logout();
                    setLoginError('Tài khoản không có quyền truy cập trang quản trị.');
                }
            },
        });
        if (!result.success) {
            setLoginError(result.error || 'Đăng nhập thất bại.');
        }
    };

    const textFieldSx = {
        '& .MuiInputBase-input': { color: '#fff' },
        '& .MuiInputBase-input:-webkit-autofill': {
            WebkitTextFillColor: '#fff',
            WebkitBoxShadow: '0 0 0 100px #1F1D25 inset',
        },
        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#a78bfa' },
        '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(167,139,250,0.5)' },
            '&.Mui-focused fieldset': { borderColor: '#a78bfa' },
        },
        '& .MuiFormHelperText-root': { color: '#f87171' },
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
            <Paper
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 460,
                    p: 5,
                    borderRadius: 3,
                    bgcolor: '#1F1D25',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                }}
            >
                <Stack spacing={3}>
                    <Box textAlign="center">
                        <Typography
                            variant="h2"
                            fontWeight={800}
                            sx={{ color: '#a78bfa', letterSpacing: '0.12em', mb: 2 }}
                        >
                            SLIFE
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="#fff">
                            Quản trị viên
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.75 }}>
                            Đăng nhập để truy cập trang quản trị
                        </Typography>
                    </Box>

                    {loginError && (
                        <Alert severity="error" onClose={() => setLoginError('')}>
                            {loginError}
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
                                sx={textFieldSx}
                            />
                            <TextField
                                fullWidth
                                label="Mật khẩu"
                                type="password"
                                autoComplete="current-password"
                                {...register('password', {
                                    required: 'Mật khẩu bắt buộc',
                                    minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                                })}
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                sx={textFieldSx}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={isSubmitting}
                                sx={{
                                    mt: 0.5,
                                    bgcolor: '#a78bfa',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    borderRadius: 2,
                                    '&:hover': { bgcolor: '#8b5cf6' },
                                    '&:disabled': { bgcolor: 'rgba(167,139,250,0.3)' },
                                }}
                            >
                                {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Đăng nhập'}
                            </Button>
                        </Stack>
                    </Box>

                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.25)' }} textAlign="center">
                        Chỉ dành cho Admin và Moderator
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
}
