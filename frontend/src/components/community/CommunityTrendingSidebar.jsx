import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Skeleton, Typography } from '@mui/material';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import { getCommunityHashtagTrending } from '../../api/communityApi';
import { unwrapApiData } from '../../utils/apiPayload';

/**
 * Sidebar: hashtag xu hướng (7 ngày) — chỉ dùng khi đang ở khu vực /community.
 */
export default function CommunityTrendingSidebar() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getCommunityHashtagTrending({ days: 7, limit: 10 })
            .then((res) => {
                if (cancelled) return;
                const raw = unwrapApiData(res);
                setRows(Array.isArray(raw) ? raw : []);
            })
            .catch(() => {
                if (!cancelled) setRows([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <Box
            sx={{
                bgcolor: 'rgba(42,39,51,0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
        >
            <Box
                sx={{
                    px: 2,
                    py: 2,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    background: 'linear-gradient(90deg, rgba(251,146,60,0.12) 0%, transparent 100%)',
                }}
            >
                <LocalFireDepartmentOutlinedIcon sx={{ fontSize: 22, color: '#fb923c' }} />
                <Typography sx={{ fontSize: '15px', fontWeight: 800, color: 'rgba(255,255,255,0.95)' }}>
                    Chủ đề nóng (7 ngày)
                </Typography>
            </Box>
            <Box sx={{ px: 2, py: 1.5 }}>
                {loading ? (
                    <StackSkel />
                ) : rows.length === 0 ? (
                    <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                        Chưa có dữ liệu hashtag — hãy đăng bài và gắn # trong nội dung.
                    </Typography>
                ) : (
                    <Box component="ul" sx={{ m: 0, pl: 0, listStyle: 'none' }}>
                        {rows.map((row) => {
                            const tag = row?.tag ?? row?.hashtag;
                            const cnt = row?.postCount ?? row?.post_count ?? 0;
                            if (!tag) return null;
                            return (
                                <Box
                                    key={tag}
                                    component="li"
                                    sx={{
                                        py: 0.85,
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        '&:last-of-type': { borderBottom: 'none' },
                                    }}
                                >
                                    <Typography
                                        component={RouterLink}
                                        to={`/community?hashtag=${encodeURIComponent(tag)}`}
                                        sx={{
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#c4b5fd',
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        #{tag}
                                    </Typography>
                                    <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', mt: 0.25 }}>
                                        {cnt} bài
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

function StackSkel() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3, 4, 5].map((k) => (
                <Skeleton key={k} variant="rounded" height={36} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1 }} />
            ))}
        </Box>
    );
}
