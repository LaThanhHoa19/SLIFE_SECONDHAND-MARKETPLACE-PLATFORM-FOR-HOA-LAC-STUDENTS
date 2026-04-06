import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Pagination,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PersonIcon from '@mui/icons-material/Person';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import * as userApi from '../../api/userApi';
import { unwrapApiData } from '../../utils/apiPayload';
import { fullImageUrl } from '../../utils/constants';
import { useBlockActions } from '../../hooks/useBlockActions';
import { DETAIL_PAGE_MAX_WIDTH } from '../../utils/layoutConstants';

const BG = '#141225';
const CARD = '#201D26';
const BORDER = 'rgba(255,255,255,0.07)';
const TEXT_MUTED = 'rgba(255,255,255,0.55)';
const PURPLE = '#9D6EED';

export default function BlockedUsersPage() {
  const navigate = useNavigate();
  const { unblockUserById } = useBlockActions();
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [rows, setRows] = useState([]);
  const [unblockingId, setUnblockingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.getMyBlockedUsers({ page, size });
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
  }, [page, size]);

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
        <Typography variant="body2" sx={{ color: TEXT_MUTED, mb: 3, maxWidth: 560, lineHeight: 1.6 }}>
          Những người bạn chặn sẽ không thấy bạn và bạn cũng không thấy họ trên SLIFE. Bỏ chặn để khôi phục tương tác.
        </Typography>

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
                return (
                  <ListItem
                    key={uid}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="Bỏ chặn"
                        disabled={unblockingId === uid}
                        onClick={() => handleUnblock(uid)}
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
                      secondary={`Điểm uy tín: ${u.reputationScore ?? u.reputation_score ?? '—'}`}
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
      </Box>
    </Box>
  );
}
