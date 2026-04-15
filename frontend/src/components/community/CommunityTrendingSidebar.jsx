import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Skeleton, Typography } from '@mui/material';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
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
        getCommunityHashtagTrending({ days: 7, limit: 5 })
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
                bgcolor: 'rgba(16,22,56,0.86)',
                backdropFilter: 'blur(12px)',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.24)',
            }}
        >
            <Box
                sx={{
                    px: 2,
                    pt: 2,
                    pb: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <TrendingUpOutlinedIcon sx={{ fontSize: 20, color: '#b6a0ff' }} />
                <Typography sx={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>
                    Chủ đề thịnh hành
                </Typography>
            </Box>

            <Box sx={{ px: 2, pb: 2 }}>
                {loading ? (
                    <StackSkel />
                ) : rows.length === 0 ? (
                    <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                        Chưa có dữ liệu hashtag.
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
                                        py: 0.75,
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        '&:last-of-type': { borderBottom: 'none' },
                                    }}
                                >
                                    <Typography
                                        component={RouterLink}
                                        to={`/community?hashtag=${encodeURIComponent(tag)}`}
                                        sx={{
                                            fontSize: 18,
                                            fontWeight: 800,
                                            color: '#d4c7ff',
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        #{tag}
                                    </Typography>
                                    <Typography sx={{ fontSize: 14, color: 'rgba(255,255,255,0.62)', mt: 0.15 }}>
                                        {cnt} bài đăng hôm nay
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
                <Skeleton key={k} variant="rounded" height={44} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1.5 }} />
            ))}
        </Box>
    );
}
