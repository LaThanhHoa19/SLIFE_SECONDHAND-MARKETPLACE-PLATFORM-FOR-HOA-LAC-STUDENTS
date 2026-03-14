import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { getAdminUsers } from '../../api/userApi';
import AdminDataTable from '../../components/common/AdminDataTable';

function formatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const response = await getAdminUsers();
      setUsers(response?.data || []);
    } catch (error) {
      setErrorMessage(error?.message || 'Không tải được danh sách user.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const columns = [
    { id: 'id', label: 'ID', width: 80 },
    { id: 'email', label: 'Email' },
    {
      id: 'fullName',
      label: 'Họ tên',
      render: (row) => row.fullName || row.email,
    },
    {
      id: 'role',
      label: 'Vai trò',
      width: 120,
      render: (row) => (
          <Chip
              label={row.role}
              size="small"
              sx={{
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 999,
                bgcolor:
                    row.role === 'ADMIN'
                        ? 'rgba(37,99,235,0.08)'
                        : row.role === 'MODERATOR'
                            ? 'rgba(16,185,129,0.08)'
                            : 'rgba(148,163,184,0.08)',
                color:
                    row.role === 'ADMIN'
                        ? '#1d4ed8'
                        : row.role === 'MODERATOR'
                            ? '#047857'
                            : '#475569',
              }}
          />
      ),
    },
    {
      id: 'status',
      label: 'Trạng thái',
      width: 120,
      render: (row) => (
          <Chip
              label={row.status}
              size="small"
              sx={{
                fontSize: 11,
                borderRadius: 999,
                bgcolor:
                    row.status === 'ACTIVE'
                        ? 'rgba(22,163,74,0.08)'
                        : row.status === 'BANNED'
                            ? 'rgba(220,38,38,0.08)'
                            : 'rgba(148,163,184,0.08)',
                color:
                    row.status === 'ACTIVE'
                        ? '#16a34a'
                        : row.status === 'BANNED'
                            ? '#b91c1c'
                            : '#6b7280',
              }}
          />
      ),
    },
    {
      id: 'reputationScore',
      label: 'Uy tín',
      width: 100,
      render: (row) => row.reputationScore ?? '-',
    },
    {
      id: 'createdAt',
      label: 'Ngày tạo',
      width: 180,
      render: (row) => formatDate(row.createdAt),
    },
  ];

  return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Quản lý người dùng
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Theo dõi role, trạng thái và uy tín tài khoản trong hệ thống.
            </Typography>
          </Box>
          <Button
              variant="contained"
              onClick={loadUsers}
              disabled={isLoading}
              sx={{ borderRadius: 999, textTransform: 'none', px: 3 }}
          >
            Tải lại dữ liệu
          </Button>
        </Stack>

        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

        <AdminDataTable
            columns={columns}
            rows={users}
            isLoading={isLoading}
            emptyMessage="Không có dữ liệu user."
        />
      </Box>
  );
}
