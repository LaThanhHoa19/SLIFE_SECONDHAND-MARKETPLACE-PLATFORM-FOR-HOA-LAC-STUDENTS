/**
 * Tạo bài đăng cộng đồng — hashtag nhận diện trong nội dung (#tag), không ô nhập riêng.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Chip, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';
import ImageUploader from '../../components/common/ImageUploader';
import { APP_SHELL_BG } from '../../utils/layoutConstants';
import { useMaxCommunityPostImages } from '../../hooks/useMaxCommunityPostImages';
import { createCommunityPostWithImages } from '../../api/communityApi';
import { unwrapApiData } from '../../utils/apiPayload';
import { useToast } from '../../context/ToastContext';
import { previewHashtagsFromDescription } from '../../utils/communityHashtagUtils';
import {
    COMMUNITY_POST_MAX_DESCRIPTION,
    COMMUNITY_POST_MAX_HASHTAG_OCCURRENCES,
    COMMUNITY_POST_MAX_IMAGE_MB,
    COMMUNITY_POST_MAX_TITLE,
} from '../../utils/communityPostLimits';
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

    const canSubmit = useMemo(() => title.trim().length > 0 && !submitting, [title, submitting]);
    const hashtagPreview = useMemo(() => previewHashtagsFromDescription(description), [description]);

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
                        />
                        <Box>
                            <TextField
                                label="Nội dung"
                                fullWidth
                                multiline
                                minRows={6}
                                value={description}
                                onChange={(ev) => setDescription(ev.target.value)}
                                inputProps={{ maxLength: COMMUNITY_POST_MAX_DESCRIPTION }}
                                helperText={`${description.length}/${COMMUNITY_POST_MAX_DESCRIPTION}`}
                                placeholder={
                                    'Viết nội dung tại đây. Hashtag: bắt đầu bằng #, không khoảng trắng trong thẻ, chỉ chữ/số/gạch dưới — ví dụ: #slife #kytucxa2026'
                                }
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, lineHeight: 1.5 }}>
                                Quy tắc hashtag: không khoảng trắng trong thẻ; không ký tự đặc biệt (dấu câu, @, $, %…); # phải
                                đứng sau đầu dòng hoặc sau dấu cách / dấu câu; có thể dùng số (ví dụ #iphone15). Hệ thống chỉ xét tối đa{' '}
                                {COMMUNITY_POST_MAX_HASHTAG_OCCURRENCES} lần bắt # trong nội dung.
                            </Typography>
                            {hashtagPreview.occurrenceCount > 0 && (
                                <Box sx={{ mt: 1.25 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                                        Hashtag sẽ được lưu — lượt # trong bài: {hashtagPreview.occurrenceCount}/
                                        {COMMUNITY_POST_MAX_HASHTAG_OCCURRENCES} (trùng tính), {hashtagPreview.tags.length} thẻ khác nhau:
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
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
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
