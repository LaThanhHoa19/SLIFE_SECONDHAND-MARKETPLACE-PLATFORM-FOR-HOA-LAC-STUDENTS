import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export default function BackendTestPage() {
  const [healthResult, setHealthResult] = useState(null);
  const [listingsResult, setListingsResult] = useState(null);
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
            3. Đăng nhập (Google SSO)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Chỉ hỗ trợ đăng nhập bằng Google với email @fpt.edu.vn. Dùng trang /login.
          </Typography>
          <Button variant="outlined" href="/login">
            Mở trang đăng nhập
          </Button>
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

