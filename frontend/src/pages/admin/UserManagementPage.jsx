import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
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

/** Backend giới hạn size tối đa 100 / request — dùng khi gom toàn bộ danh sách. */
const API_PAGE_SIZE = 100;
/** Số user hiển thị mỗi trang (chỉ trên frontend). */
const PAGE_SIZE = 10;

function extractPagePayload(response) {
  const root = response?.data?.data ?? response?.data;
  if (root == null) return { content: [], totalElements: 0 };
  if (Array.isArray(root)) {
    return { content: root.filter(Boolean), totalElements: root.length };
  }
  const content = Array.isArray(root.content) ? root.content.filter((r) => r != null) : [];
  let total = root.totalElements;
  if (typeof total !== 'number' || Number.isNaN(total)) {
    const n = Number(total);
    total = Number.isFinite(n) ? n : content.length;
  }
  return { content, totalElements: Math.max(0, total) };
}

/** Gom nhiều trang từ API (sort/filter do backend), sau đó phân trang bằng JS. */
async function fetchAllUsersForAdmin(getAdminUsers, baseParams) {
  const aggregated = [];
  let pageIdx = 0;
  let reportedTotal = null;

  for (let guard = 0; guard < 500; guard += 1) {
    const res = await getAdminUsers({ ...baseParams, page: pageIdx, size: API_PAGE_SIZE });
    const { content, totalElements } = extractPagePayload(res);
    if (reportedTotal == null) reportedTotal = totalElements;
    aggregated.push(...content);

    if (content.length < API_PAGE_SIZE) break;
    if (reportedTotal > 0 && aggregated.length >= reportedTotal) break;
    pageIdx += 1;
  }

  return aggregated;
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

/** Khớp query ?status= — all = không gửi param */
const ADMIN_USER_STATUS_FILTER = {
  ALL: 'all',
  ACTIVE: 'ACTIVE',
  BANNED: 'BANNED',
  RESTRICTED: 'RESTRICTED',
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
  const [allUsers, setAllUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sortBy, setSortBy] = useState(ADMIN_USER_SORT_BY.NONE);
  const [sortDir, setSortDir] = useState('desc');
  const [statusFilter, setStatusFilter] = useState(ADMIN_USER_STATUS_FILTER.ALL);
  const sortDisabled = sortBy === ADMIN_USER_SORT_BY.NONE;

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setPage(0);
      const sortParams =
        sortBy === ADMIN_USER_SORT_BY.NONE
          ? { sortBy: 'id', sortDir: 'asc' }
          : { sortBy, sortDir };
      const base =
        statusFilter === ADMIN_USER_STATUS_FILTER.ALL
          ? sortParams
          : { ...sortParams, status: statusFilter };
      const list = await fetchAllUsersForAdmin(getAdminUsers, base);
      setAllUsers(list);
    } catch (error) {
      setErrorMessage(error?.message || 'Không tải được danh sách user.');
      setAllUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortDir, statusFilter]);

  const totalCount = allUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE) || 1);

  const displayedUsers = useMemo(
    () => allUsers.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [allUsers, page],
  );

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [totalCount, page]);

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
                            : row.status === 'RESTRICTED'
                                ? 'rgba(234,179,8,0.1)'
                                : 'rgba(148,163,184,0.08)',
                color:
                    row.status === 'ACTIVE'
                        ? '#16a34a'
                        : row.status === 'BANNED'
                            ? '#b91c1c'
                            : row.status === 'RESTRICTED'
                                ? '#ca8a04'
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
              <InputLabel id="admin-users-status-filter">Trạng thái</InputLabel>
              <Select
                labelId="admin-users-status-filter"
                label="Trạng thái"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value={ADMIN_USER_STATUS_FILTER.ALL}>Tất cả</MenuItem>
                <MenuItem value={ADMIN_USER_STATUS_FILTER.ACTIVE}>Hoạt động</MenuItem>
                <MenuItem value={ADMIN_USER_STATUS_FILTER.BANNED}>Bị khóa</MenuItem>
                <MenuItem value={ADMIN_USER_STATUS_FILTER.RESTRICTED}>Hạn chế</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={selectFieldSx}>
              <InputLabel id="admin-users-sort-by">Sắp xếp theo</InputLabel>
              <Select
                labelId="admin-users-sort-by"
                label="Sắp xếp theo"
                value={sortBy}
                onChange={(e) => {
                  setPage(0);
                  setSortBy(e.target.value);
                }}
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
                onChange={(e) => {
                  setPage(0);
                  setSortDir(e.target.value);
                }}
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
            rows={displayedUsers}
            getRowId={(row) => String(row?.id ?? '')}
            isLoading={isLoading}
            emptyMessage="Không có dữ liệu user."
            paperSx={userManagementPaperSx}
            tableSx={userManagementTableSx}
        />

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mt: 2,
            py: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
            {totalCount === 0
              ? '0 kết quả'
              : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} / ${totalCount}`}
          </Typography>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, value) => setPage(value - 1)}
            disabled={isLoading || totalCount === 0}
            color="primary"
            size="small"
            sx={{
              '& .MuiPaginationItem-root': { color: 'rgba(255,255,255,0.88)' },
            }}
          />
        </Box>
      </Box>
  );
}
