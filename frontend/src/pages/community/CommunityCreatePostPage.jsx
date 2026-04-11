/**
 * Tạo bài đăng cộng đồng — hashtag nhận diện trong nội dung (#tag), không ô nhập riêng.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    List,
    ListItemButton,
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
import { createCommunityPostWithImages, getCommunityHashtagSuggest } from '../../api/communityApi';
import { unwrapApiData } from '../../utils/apiPayload';
import { useToast } from '../../context/ToastContext';
import { previewHashtagsFromDescription } from '../../utils/communityHashtagUtils';
import { COMMUNITY_POST_MAX_DESCRIPTION, COMMUNITY_POST_MAX_IMAGE_MB, COMMUNITY_POST_MAX_TITLE } from '../../utils/communityPostLimits';
import { validateCommunityPostImages } from '../../utils/communityImageValidation';

export default function CommunityCreatePostPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const maxImages = useMaxCommunityPostImages();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const descInputRef = useRef(null);
    const suggestTimerRef = useRef(null);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestOpen, setSuggestOpen] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(false);

    useEffect(() => {
        const key = 'community.create.prefill.description';
        const prefill = sessionStorage.getItem(key);
        if (prefill && prefill.trim()) {
            setDescription(prefill);
            sessionStorage.removeItem(key);
        }
    }, []);

    const canSubmit = useMemo(() => title.trim().length > 0 && !submitting, [title, submitting]);
    const hashtagPreview = useMemo(() => previewHashtagsFromDescription(description), [description]);

    const scheduleSuggestFromInput = useCallback((inputEl) => {
        if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);
        if (!inputEl) return;
        const text = inputEl.value ?? '';
        const pos = inputEl.selectionStart ?? text.length;
        const before = text.slice(0, pos);
        const match = before.match(/#([\p{L}\p{N}_]*)$/u);
        if (!match) {
            setSuggestOpen(false);
            setSuggestions([]);
            return;
        }
        const prefix = match[1] ?? '';
        if (prefix.length > 100) {
            setSuggestOpen(false);
            return;
        }
        setSuggestOpen(true);
        suggestTimerRef.current = window.setTimeout(() => {
            setSuggestLoading(true);
            getCommunityHashtagSuggest({ q: prefix, limit: 12 })
                .then((res) => {
                    const raw = unwrapApiData(res);
                    setSuggestions(Array.isArray(raw) ? raw : []);
                })
                .catch(() => setSuggestions([]))
                .finally(() => setSuggestLoading(false));
        }, 200);
    }, []);

    useEffect(
        () => () => {
            if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);
        },
        [],
    );

    const insertHashtagSuggestion = useCallback((tag) => {
        const el = descInputRef.current;
        if (!el || !tag) return;
        const text = description;
        const pos = el.selectionStart ?? text.length;
        const before = text.slice(0, pos);
        const after = text.slice(pos);
        const re = /#([\p{L}\p{N}_]*)$/u;
        const m = before.match(re);
        if (!m) return;
        const start = before.length - m[0].length;
        const newBefore = text.slice(0, start) + `#${tag} `;
        setDescription(newBefore + after);
        setSuggestOpen(false);
        setSuggestions([]);
        queueMicrotask(() => {
            el.focus();
            const np = newBefore.length;
            el.setSelectionRange(np, np);
        });
    }, [description]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError('');
        const imgCheck = validateCommunityPostImages(imageFiles, maxImages, COMMUNITY_POST_MAX_IMAGE_MB);
        if (!imgCheck.ok) {
            setError(imgCheck.message);
            showToast(imgCheck.message, 'error');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || null,
                hashtags: [],
            };
            const res = await createCommunityPostWithImages(payload, imageFiles);
            const created = unwrapApiData(res);
            const newId = created?.id;
            showToast('Đã đăng bài cộng đồng!', 'success');
            if (newId != null) {
                navigate(`/community/posts/${newId}`, { replace: true });
            } else {
                navigate('/community', { replace: true });
            }
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
                    bgcolor: '#201D26',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <IconButton aria-label="Quay lại cộng đồng" onClick={() => navigate('/community')} size="small" sx={{ color: '#fff' }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <PostAddOutlinedIcon sx={{ color: '#fff' }} />
                    <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
                        Tạo bài cộng đồng
                    </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Viết nội dung tại ô bên dưới — gõ trực tiếp hashtag trong bài (ví dụ <strong>#hoctienganh</strong>,{' '}
                    <strong>#iphone15</strong>). Hệ thống sẽ tự nhận diện và gắn thẻ khi đăng.
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2.25}>
                        <TextField
                            label="Tiêu đề"
                            required
                            fullWidth
                            value={title}
                            onChange={(ev) => setTitle(ev.target.value)}
                            inputProps={{ maxLength: COMMUNITY_POST_MAX_TITLE }}
                            helperText={`${title.length}/${COMMUNITY_POST_MAX_TITLE}`}
                            placeholder="Ví dụ: Có ai học nhóm môn OS không?"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: '#312F37',
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255,107,107,0.3)' },
                                    '&.Mui-focused fieldset': { borderColor: '#9D6EED' },
                                },
                                '& .MuiInputBase-input': {
                                    color: '#FFFFFF',
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    color: 'rgba(255,255,255,0.4)',
                                    opacity: 1,
                                }
                            }}
                        />
                        <Box>
                            <TextField
                                label="Nội dung"
                                fullWidth
                                multiline
                                minRows={6}
                                value={description}
                                inputRef={descInputRef}
                                onChange={(ev) => {
                                    setDescription(ev.target.value);
                                    scheduleSuggestFromInput(ev.target);
                                }}
                                onSelect={(ev) => scheduleSuggestFromInput(ev.target)}
                                onKeyUp={(ev) => scheduleSuggestFromInput(ev.target)}
                                inputProps={{ maxLength: COMMUNITY_POST_MAX_DESCRIPTION }}
                                helperText={`${description.length}/${COMMUNITY_POST_MAX_DESCRIPTION}`}
                                placeholder={
                                    'Viết nội dung tại đây. Hashtag: bắt đầu bằng #, không khoảng trắng trong thẻ, chỉ chữ/số/gạch dưới — ví dụ: #slife #kytucxa2026'
                                }
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        bgcolor: '#312F37',
                                        borderRadius: 2,
                                        '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                                        '&:hover fieldset': { borderColor: 'rgba(255,107,107,0.3)' },
                                        '&.Mui-focused fieldset': { borderColor: '#9D6EED' },
                                    },
                                    '& .MuiInputBase-input': {
                                        color: '#FFFFFF',
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: 'rgba(255,255,255,0.4)',
                                        opacity: 1,
                                    }
                                }}
                            />
                            {suggestOpen ? (
                                <Paper
                                    elevation={4}
                                    sx={{
                                        mt: 0.5,
                                        maxHeight: 220,
                                        overflow: 'auto',
                                        border: (t) => `1px solid ${t.palette.divider}`,
                                    }}
                                >
                                    {suggestLoading ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                            <CircularProgress size={22} />
                                        </Box>
                                    ) : suggestions.length === 0 ? (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 1.5 }}>
                                            Không có gợi ý — thử hashtag khác hoặc tiếp tục gõ.
                                        </Typography>
                                    ) : (
                                        <List dense disablePadding>
                                            {suggestions.map((t) => (
                                                <ListItemButton key={t} onMouseDown={(e) => e.preventDefault()} onClick={() => insertHashtagSuggestion(t)}>
                                                    <Typography variant="body2">#{t}</Typography>
                                                </ListItemButton>
                                            ))}
                                        </List>
                                    )}
                                </Paper>
                            ) : null}
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, lineHeight: 1.5 }}>
                                Quy tắc hashtag: không khoảng trắng trong thẻ; không ký tự đặc biệt (dấu câu, @, $, %…); # phải
                                đứng sau đầu dòng hoặc sau dấu cách / dấu câu; có thể dùng số (ví dụ #iphone15). Gõ # để xem gợi ý
                                hashtag đang có trên hệ thống.
                            </Typography>
                            {hashtagPreview.occurrenceCount > 0 && (
                                <Box sx={{ mt: 1.25 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                                        Hashtag sẽ được lưu — {hashtagPreview.occurrenceCount} lần bắt # (trùng tính),{' '}
                                        {hashtagPreview.tags.length} thẻ khác nhau:
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                                        {hashtagPreview.tags.map((t) => (
                                            <Chip key={t.toLowerCase()} size="small" label={`#${t}`} color="primary" variant="outlined" />
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75, color: '#fff' }}>
                                Ảnh đính kèm — JPG/PNG, tối đa {maxImages} ảnh, mỗi file ≤ {COMMUNITY_POST_MAX_IMAGE_MB}MB
                            </Typography>
                            <ImageUploader
                                onFilesChange={setImageFiles}
                                maxFiles={maxImages}
                                maxSizeMB={COMMUNITY_POST_MAX_IMAGE_MB}
                                variant="studioHero"
                                imageProfile="community"
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
