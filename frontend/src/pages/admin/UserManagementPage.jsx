import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { getAdminUsers } from '../../api/userApi';
import ReusableTable from '../../components/common/ReusableTable';

function formatDate(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
}

function extractUserList(response) {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  if (payload?.content && Array.isArray(payload.content)) return payload.content;
  return [];
}

const USER_TABLE_SURFACE = '#19191B';
const USER_TABLE_BORDER = '#3E3E42';

const userManagementPaperSx = {
  bgcolor: USER_TABLE_SURFACE,
  border: `1px solid ${USER_TABLE_BORDER}`,
  borderRadius: 1,
  boxShadow: 'none',
  '& .MuiCircularProgress-root': {
    color: '#fff',
  },
};

const userManagementTableSx = {
  '& thead th': {
    color: 'rgba(255,255,255,0.88)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderBottom: `1px solid ${USER_TABLE_BORDER}`,
  },
  '& tbody td': {
    color: '#ffffff',
    borderBottom: `1px solid ${USER_TABLE_BORDER}`,
  },
  '& .MuiTableCell-root:not(:last-of-type)': {
    borderRight: `1px solid ${USER_TABLE_BORDER}`,
  },
  '& tbody .MuiTableRow-root:nth-of-type(odd)': {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  '& tbody .MuiTableRow-root:hover': {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  '& tbody .MuiTableRow-root:last-of-type .MuiTableCell-root': {
    borderBottom: 'none',
  },
  '& .MuiTypography-root': {
    color: 'rgba(255,255,255,0.72)',
  },
};

/** Khớp GET /api/admin/users — "Không chọn" = sortBy=id&sortDir=asc (ID tăng dần) */
const ADMIN_USER_SORT_BY = {
  NONE: 'id',
  CREATED_AT: 'createdAt',
  REPUTATION: 'reputationScore',
  VIOLATION: 'violationCount',
};

const selectFieldSx = {
  minWidth: 200,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: USER_TABLE_BORDER },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.7)' },
  '& .MuiSelect-select': { color: '#fff' },
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sortBy, setSortBy] = useState(ADMIN_USER_SORT_BY.NONE);
  const [sortDir, setSortDir] = useState('desc');
  const sortDisabled = sortBy === ADMIN_USER_SORT_BY.NONE;

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const params =
        sortBy === ADMIN_USER_SORT_BY.NONE
          ? { sortBy: 'id', sortDir: 'asc' }
          : { sortBy, sortDir };
      const response = await getAdminUsers(params);
      setUsers(extractUserList(response));
    } catch (error) {
      setErrorMessage(error?.message || 'Không tải được danh sách user.');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortDir]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const columns = [
    { id: 'id', label: 'ID', width: 80 },
    {
      id: 'avatarUrl',
      label: 'Avatar',
      width: 80,
      align: 'center',
      render: (row) => {
        const src = row.avatarUrl ?? row.avatar_url;
        const initial = (row.fullName || row.email || '?').trim().charAt(0).toUpperCase() || '?';
        return (
          <Avatar
            src={src || undefined}
            alt=""
            sx={{ width: 40, height: 40, mx: 'auto', fontSize: 16 }}
          >
            {initial}
          </Avatar>
        );
      },
    },
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
      id: 'violationCount',
      label: 'Vi phạm',
      width: 96,
      align: 'right',
      render: (row) => {
        const v = row.violationCount ?? row.violation_count;
        return v != null && v !== '' ? v : '-';
      },
    },
    {
      id: 'createdAt',
      label: 'Ngày tạo',
      width: 180,
      render: (row) => formatDate(row.createdAt ?? row.created_at),
    },
  ];

  return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
              Quản lý người dùng
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Theo dõi role, trạng thái và uy tín tài khoản trong hệ thống.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={selectFieldSx}>
              <InputLabel id="admin-users-sort-by">Sắp xếp theo</InputLabel>
              <Select
                labelId="admin-users-sort-by"
                label="Sắp xếp theo"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value={ADMIN_USER_SORT_BY.NONE}>Không chọn</MenuItem>
                <MenuItem value={ADMIN_USER_SORT_BY.CREATED_AT}>Ngày tạo</MenuItem>
                <MenuItem value={ADMIN_USER_SORT_BY.REPUTATION}>Uy tín</MenuItem>
                <MenuItem value={ADMIN_USER_SORT_BY.VIOLATION}>Vi phạm</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ ...selectFieldSx, minWidth: 220 }} disabled={sortDisabled}>
              <InputLabel id="admin-users-sort-dir">Thứ tự</InputLabel>
              <Select
                labelId="admin-users-sort-dir"
                label="Thứ tự"
                value={sortDir}
                disabled={sortDisabled}
                onChange={(e) => setSortDir(e.target.value)}
              >
                <MenuItem value="asc">Từ thấp đến cao</MenuItem>
                <MenuItem value="desc">Từ cao đến thấp</MenuItem>
              </Select>
            </FormControl>
            <Button
                variant="contained"
                onClick={loadUsers}
                disabled={isLoading}
                sx={{ borderRadius: 999, textTransform: 'none', px: 3 }}
            >
              Tải lại dữ liệu
            </Button>
          </Stack>
        </Stack>

        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

        <ReusableTable
            columns={columns}
            rows={users}
            getRowId={(row) => String(row.id ?? '')}
            isLoading={isLoading}
            emptyMessage="Không có dữ liệu user."
            paperSx={userManagementPaperSx}
            tableSx={userManagementTableSx}
        />
      </Box>
  );
}
