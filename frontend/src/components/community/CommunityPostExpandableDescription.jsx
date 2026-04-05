import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { splitDescriptionForRender } from '../../utils/communityHashtagUtils';

const DEFAULT_PURPLE = '#9D6EED';

function renderDescriptionParts(parts, { color, tagColor, fontSize, fontWeight, linkHashtags }) {
    return parts.map((p, i) => {
        if (p.type === 'tag' && p.norm && linkHashtags) {
            return (
                <Box
                    key={i}
                    component={RouterLink}
                    to={`/community?hashtag=${encodeURIComponent(p.norm)}`}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        fontWeight: 800,
                        color: tagColor,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    {p.value}
                </Box>
            );
        }
        if (p.type === 'tag') {
            return (
                <Box component="span" key={i} sx={{ fontWeight: 800, color: tagColor }}>
                    {p.value}
                </Box>
            );
        }
        return (
            <span key={i} style={{ color, fontWeight: fontWeight ?? 400 }}>
                {p.value}
            </span>
        );
    });
}

/**
 * Mô tả dưới tiêu đề: giới hạn `lineClamp` dòng (mặc định 1); nếu tràn thì nút "Xem thêm...".
 * Hashtag hợp lệ (#...) được in đậm màu tagColor.
 */
function CommunityPostExpandableDescription({
    text,
    color = 'rgba(255,255,255,0.75)',
    moreColor = DEFAULT_PURPLE,
    fontSize = 14,
    /** Feed: 2 — xem nhanh nhiều hơn; chi tiết: 1 */
    lineClamp = 1,
    /** Hashtag trong nội dung → deep link /community?hashtag=… */
    linkHashtags = true,
}) {
    const raw = text != null ? String(text) : '';
    const parts = useMemo(() => splitDescriptionForRender(raw), [raw]);

    const clampRef = useRef(null);
    const [expanded, setExpanded] = useState(false);
    const [needsMore, setNeedsMore] = useState(false);

    useLayoutEffect(() => {
        if (!raw.trim()) return;
        if (expanded) return;
        const el = clampRef.current;
        if (!el) return;

        const measure = () => {
            if (!clampRef.current) return;
            const c = clampRef.current;
            setNeedsMore(c.scrollHeight > c.clientHeight + 1);
        };

        measure();
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => requestAnimationFrame(measure)) : null;
        if (ro) ro.observe(el);
        window.addEventListener('resize', measure);
        return () => {
            if (ro) ro.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [raw, expanded, lineClamp]);

    if (!raw.trim()) return null;

    const bodySx = {
        color,
        fontSize,
        lineHeight: 1.55,
        fontWeight: 400,
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
    };

    if (expanded) {
        return (
            <Box
                onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(false);
                }}
                sx={{ mb: 1, cursor: 'pointer' }}
            >
                <Typography component="div" sx={bodySx}>
                    {renderDescriptionParts(parts, { color, tagColor: moreColor, fontSize, linkHashtags })}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 1 }} onClick={(e) => e.stopPropagation()}>
            <Typography
                ref={clampRef}
                component="div"
                sx={{
                    ...bodySx,
                    display: '-webkit-box',
                    WebkitLineClamp: lineClamp,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {renderDescriptionParts(parts, { color, tagColor: moreColor, fontSize, linkHashtags })}
            </Typography>
            {needsMore ? (
                <Typography
                    component="button"
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(true);
                    }}
                    sx={{
                        mt: 0.25,
                        p: 0,
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: moreColor,
                        fontWeight: 700,
                        fontSize: 13,
                        display: 'block',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        '&:hover': { textDecoration: 'underline' },
                    }}
                >
                    Xem thêm...
                </Typography>
            ) : null}
        </Box>
    );
}

export default memo(CommunityPostExpandableDescription);
