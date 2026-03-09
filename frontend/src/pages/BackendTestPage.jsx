import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export default function BackendTestPage() {
  const [healthResult, setHealthResult] = useState(null);
  const [listingsResult, setListingsResult] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginResult, setLoginResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckHealth = async () => {
    setLoading(true);
    setError(null);
    setHealthResult(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/actuator/health`);
      setHealthResult(res.data);
    } catch (err) {
      setError(err.message || 'Lỗi khi gọi /actuator/health');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchListings = async () => {
    setLoading(true);
    setError(null);
    setListingsResult(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/listings`);
      setListingsResult(res.data);
    } catch (err) {
      setError(err.message || 'Lỗi khi gọi /api/listings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    setLoginResult(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: loginEmail,
        password: loginPassword,
      });
      const { data } = res;
      const token = data?.data?.token;
      if (token) {
        localStorage.setItem('slife_access_token', token);
      }
      setLoginResult(data);
    } catch (err) {
      setError(err.message || 'Lỗi khi gọi /api/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const pretty = (value) =>
    value ? JSON.stringify(value, null, 2) : 'Chưa có dữ liệu.';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Backend Test Page
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Trang này chỉ dùng nội bộ để test nhanh kết nối backend (health, listings, login).
      </Typography>

      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            1. Kiểm tra /actuator/health
          </Typography>
          <Button
            variant="contained"
            onClick={handleCheckHealth}
            disabled={loading}
          >
            Gọi /actuator/health
          </Button>
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Kết quả:
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 1.5,
                bgcolor: 'grey.100',
                borderRadius: 1,
                fontSize: 12,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {pretty(healthResult)}
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            2. Kiểm tra /api/listings (public)
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleFetchListings}
            disabled={loading}
          >
            Gọi /api/listings
          </Button>
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Kết quả:
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 1.5,
                bgcolor: 'grey.100',
                borderRadius: 1,
                fontSize: 12,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {pretty(listingsResult)}
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            3. Test login /api/auth/login
          </Typography>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <TextField
              label="Email (@fpt.edu.vn)"
              fullWidth
              size="small"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <TextField
              label="Mật khẩu"
              type="password"
              fullWidth
              size="small"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleLogin}
              disabled={loading}
            >
              Login
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Nếu login thành công, token sẽ được lưu vào localStorage
            (&quot;slife_access_token&quot;).
          </Typography>

          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Kết quả:
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 1.5,
                bgcolor: 'grey.100',
                borderRadius: 1,
                fontSize: 12,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {pretty(loginResult)}
            </Box>
          </Box>
        </Paper>

        {error && (
          <>
            <Divider />
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'error.light' }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Lỗi gần nhất:
              </Typography>
              <Typography variant="body2">{error}</Typography>
            </Paper>
          </>
        )}
      </Stack>
    </Container>
  );
}

