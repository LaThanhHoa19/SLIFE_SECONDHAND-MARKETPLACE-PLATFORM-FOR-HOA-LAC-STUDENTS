import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Pagination,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PersonIcon from '@mui/icons-material/Person';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SearchIcon from '@mui/icons-material/Search';

import * as userApi from '../../api/userApi';
import { unwrapApiData } from '../../utils/apiPayload';
import { fullImageUrl } from '../../utils/constants';
import { useBlockActions } from '../../hooks/useBlockActions';
import { DETAIL_PAGE_MAX_WIDTH } from '../../utils/layoutConstants';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const BG = '#141225';
const CARD = '#201D26';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_MUTED = 'rgba(255,255,255,0.55)';
const PURPLE = '#9D6EED';

function formatBlockedAt(raw) {
  if (raw == null || raw === '') return null;
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

export default function BlockedUsersPage() {
  const navigate = useNavigate();
  const { unblockUserById } = useBlockActions();
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [rows, setRows] = useState([]);
  const [unblockingId, setUnblockingId] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [sortOrder, setSortOrder] = useState('recent');
  const [unblockConfirm, setUnblockConfirm] = useState(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 320);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, sortOrder]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size, sort: sortOrder };
      if (debouncedQ) params.q = debouncedQ;
      const res = await userApi.getMyBlockedUsers(params);
      const data = unwrapApiData(res);
      const content = data?.content ?? [];
      setRows(Array.isArray(content) ? content : []);
      setTotalPages(typeof data?.totalPages === 'number' ? data.totalPages : 0);
    } catch {
      setRows([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedQ, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnblock = async (id) => {
    setUnblockingId(id);
    try {
      await unblockUserById(id);
      await load();
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <Box sx={{ minHeight: '70vh', bgcolor: BG, py: 3, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ maxWidth: DETAIL_PAGE_MAX_WIDTH, mx: 'auto' }}>
        <Button
          startIcon={<ArrowBackIosNewIcon sx={{ fontSize: 14 }} />}
          onClick={() => navigate(-1)}
          sx={{ color: 'rgba(255,255,255,0.85)', textTransform: 'none', mb: 2 }}
        >
          Quay lại
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <BlockIcon sx={{ color: PURPLE, fontSize: 28 }} />
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>
            Đã chặn
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 2, maxWidth: 560, lineHeight: 1.6 }}>
          Những người bạn chặn sẽ không thấy bạn và bạn cũng không thấy họ trên SLIFE. Bỏ chặn để khôi phục tương tác.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            mb: 2,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <TextField
            size="small"
            placeholder="Tìm theo tên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: TEXT_MUTED, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              '& .MuiOutlinedInput-root': {
                bgcolor: CARD,
                borderRadius: 2,
                color: '#fff',
                '& fieldset': { borderColor: BORDER },
                '&:hover fieldset': { borderColor: 'rgba(157,110,237,0.45)' },
              },
              '& .MuiInputBase-input::placeholder': { color: TEXT_MUTED, opacity: 1 },
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel id="blocked-sort-label" sx={{ color: TEXT_MUTED }}>
              Thời gian chặn
            </InputLabel>
            <Select
              labelId="blocked-sort-label"
              label="Thời gian chặn"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{
                bgcolor: CARD,
                borderRadius: 2,
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(157,110,237,0.45)' },
                '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' },
              }}
            >
              <MenuItem value="recent">Gần nhất trước</MenuItem>
              <MenuItem value="oldest">Lâu nhất trước</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            bgcolor: CARD,
            borderRadius: 3,
            border: `1px solid ${BORDER}`,
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: PURPLE }} />
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
              <Typography sx={{ color: TEXT_MUTED }}>Bạn chưa chặn ai.</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {rows.map((u) => {
                const uid = u.id ?? u.userId;
                const name = u.fullName || u.full_name || 'Người dùng';
                const avatar = fullImageUrl(u.avatarUrl ?? u.avatar_url);
                const blockedAtLabel = formatBlockedAt(u.blockedAt ?? u.blocked_at);
                const secondaryLines = [
                  `Điểm uy tín: ${u.reputationScore ?? u.reputation_score ?? '—'}`,
                  blockedAtLabel ? `Chặn lúc: ${blockedAtLabel}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <ListItem
                    key={uid}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="Bỏ chặn"
                        disabled={unblockingId === uid}
                        onClick={() => setUnblockConfirm({ id: uid, name })}
                        sx={{ color: PURPLE }}
                      >
                        {unblockingId === uid ? (
                          <CircularProgress size={22} sx={{ color: PURPLE }} />
                        ) : (
                          <LockOpenIcon />
                        )}
                      </IconButton>
                    }
                    sx={{
                      borderBottom: `1px solid ${BORDER}`,
                      py: 1.5,
                      px: 2,
                      '&:last-of-type': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={avatar || undefined} sx={{ bgcolor: PURPLE }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={name}
                      secondary={secondaryLines}
                      primaryTypographyProps={{ sx: { color: '#fff', fontWeight: 700 } }}
                      secondaryTypographyProps={{ sx: { color: TEXT_MUTED, fontSize: 13 } }}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(_, p) => setPage(p - 1)}
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': { color: 'rgba(255,255,255,0.8)' },
              }}
            />
          </Box>
        )}

        <ConfirmDialog
          open={!!unblockConfirm}
          title="Bỏ chặn người này?"
          content={
            unblockConfirm
              ? `Bạn sẽ có thể tương tác lại với ${unblockConfirm.name} trên SLIFE.`
              : ''
          }
          variant="info"
          confirmLabel="Bỏ chặn"
          cancelLabel="Hủy"
          loading={unblockingId != null}
          onClose={() => unblockingId == null && setUnblockConfirm(null)}
          onConfirm={async () => {
            if (!unblockConfirm) return;
            const targetId = unblockConfirm.id;
            await handleUnblock(targetId);
            setUnblockConfirm(null);
          }}
        />
      </Box>
    </Box>
  );
}
