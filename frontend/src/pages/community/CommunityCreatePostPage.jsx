/**
 * Tạo bài đăng cộng đồng — multipart giống CreateListingPage.
 */
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';
import ImageUploader from '../../components/common/ImageUploader';
import { APP_SHELL_BG } from '../../utils/layoutConstants';
import { useMaxCommunityPostImages } from '../../hooks/useMaxCommunityPostImages';
import { createCommunityPostWithImages } from '../../api/communityApi';
import { useToast } from '../../context/ToastContext';

const MAX_HASHTAGS = 20;
const MAX_TITLE = 300;
const MAX_DESC = 8000;

function parseHashtagInput(raw) {
    if (raw == null || !String(raw).trim()) return [];
    return String(raw)
        .split(/[,;\s]+/)
        .map((s) => s.trim().replace(/^#+/, ''))
        .filter(Boolean);
}

export default function CommunityCreatePostPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const maxImages = useMaxCommunityPostImages();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [hashtagDraft, setHashtagDraft] = useState('');
    const [hashtags, setHashtags] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const canSubmit = useMemo(() => title.trim().length > 0 && !submitting, [title, submitting]);

    const addHashtagsFromDraft = useCallback(() => {
        const parts = parseHashtagInput(hashtagDraft);
        if (parts.length === 0) return;
        setHashtags((prev) => {
            const next = [...prev];
            for (const p of parts) {
                const lower = p.toLowerCase();
                if (next.length >= MAX_HASHTAGS) break;
                if (!next.some((x) => x.toLowerCase() === lower)) {
                    next.push(p.length > 100 ? p.slice(0, 100) : p);
                }
            }
            return next;
        });
        setHashtagDraft('');
    }, [hashtagDraft]);

    const onKeyDownHashtag = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addHashtagsFromDraft();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError('');
        setSubmitting(true);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || null,
                hashtags,
            };
            await createCommunityPostWithImages(payload, imageFiles);
            showToast('Đã đăng bài cộng đồng!', 'success');
            navigate('/community', { replace: true });
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                'Đăng bài thất bại. Thử lại sau.';
            setError(typeof msg === 'string' ? msg : 'Đăng bài thất bại.');
            showToast(typeof msg === 'string' ? msg : 'Đăng bài thất bại.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100%',
                width: '100%',
                bgcolor: APP_SHELL_BG,
                py: { xs: 1, md: 2 },
                px: { xs: 1.5, sm: 2 },
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    maxWidth: 720,
                    mx: 'auto',
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: (t) => alpha(t.palette.divider, 0.6),
                    bgcolor: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.55 : 0.98),
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <IconButton aria-label="Quay lại cộng đồng" onClick={() => navigate('/community')} size="small">
                        <ArrowBackIcon />
                    </IconButton>
                    <PostAddOutlinedIcon color="primary" />
                    <Typography variant="h6" fontWeight={800} sx={{ fontFamily: "'Outfit', sans-serif" }}>
                        Tạo bài cộng đồng
                    </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Chia sẻ hỏi đáp, thảo luận — có thể thêm ảnh và hashtag. Không dùng cho đăng bán hàng (dùng Feed
                    mua bán).
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2.25}>
                        <TextField
                            label="Tiêu đề"
                            required
                            fullWidth
                            value={title}
                            onChange={(ev) => setTitle(ev.target.value)}
                            inputProps={{ maxLength: MAX_TITLE }}
                            placeholder="Ví dụ: Có ai học nhóm môn OS không?"
                        />
                        <TextField
                            label="Nội dung"
                            fullWidth
                            multiline
                            minRows={5}
                            value={description}
                            onChange={(ev) => setDescription(ev.target.value)}
                            inputProps={{ maxLength: MAX_DESC }}
                            placeholder="Mô tả chi tiết…"
                        />

                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                                Hashtag (tối đa {MAX_HASHTAGS})
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Nhập rồi Enter — hoặc nhiều tag cách nhau bởi dấu phẩy"
                                    value={hashtagDraft}
                                    onChange={(ev) => setHashtagDraft(ev.target.value)}
                                    onKeyDown={onKeyDownHashtag}
                                />
                                <Button variant="outlined" onClick={addHashtagsFromDraft} sx={{ flexShrink: 0 }}>
                                    Thêm
                                </Button>
                            </Stack>
                            {hashtags.length > 0 && (
                                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.25 }}>
                                    {hashtags.map((tag) => (
                                        <Chip
                                            key={tag}
                                            label={`#${tag}`}
                                            size="small"
                                            onDelete={() => setHashtags((prev) => prev.filter((t) => t !== tag))}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                                Ảnh đính kèm (tối đa {maxImages})
                            </Typography>
                            <ImageUploader
                                onFilesChange={setImageFiles}
                                maxFiles={maxImages}
                                variant="studioHero"
                            />
                        </Box>

                        {error ? (
                            <Typography color="error" variant="body2">
                                {error}
                            </Typography>
                        ) : null}

                        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                            <Button type="button" variant="text" onClick={() => navigate('/community')}>
                                Hủy
                            </Button>
                            <Button type="submit" variant="contained" disabled={!canSubmit} sx={{ fontWeight: 800 }}>
                                {submitting ? 'Đang đăng…' : 'Đăng bài'}
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
}
