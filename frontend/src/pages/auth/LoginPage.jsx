/**
 * Mục đích: Trang đăng nhập.
 * API: POST /api/auth/login.
 * Request: { email, password }.
 * Response: { accessToken, refreshToken, user }.
 * Validation (react-hook-form): email bắt buộc + pattern; password >= 8.
 * Accessibility: label đầy đủ, aria-invalid khi lỗi, Enter submit.
 * Tests: render input, validate lỗi, gọi login thành công/thất bại.
 */
import { Box, Button, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const onSubmit = async (values) => { await login(values); };
  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h5">Login</Typography>
      <TextField label="Email" {...register('email', { required: 'Email bắt buộc' })} error={!!errors.email} />
      <TextField label="Password" type="password" {...register('password', { required: 'Mật khẩu bắt buộc', minLength: 8 })} error={!!errors.password} />
      <Button type="submit">Đăng nhập</Button>
    </Box>
  );
}
