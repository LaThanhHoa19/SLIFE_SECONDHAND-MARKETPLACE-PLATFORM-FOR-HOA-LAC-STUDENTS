import {
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Paper,
    Popover,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SendIcon from '@mui/icons-material/Send';

import { formatDealConfirmationDisplayContent } from '../chatMessageUtils';

export default function MessageComposer({
                                            theme,
                                            composerRef,
                                            setComposerRef,
                                            suggestAnchorEl,
                                            setSuggestAnchorEl,
                                            suggestedChatPhrases,
                                            sending,
                                            handleSend,
                                            fileInputRef,
                                            handleFileChange,
                                            imageUploading,
                                            activeSessionId,
                                            setOfferOpen,
                                            priceOfferDisabled,
                                            priceOfferTooltip,
                                            freeListingBuyerHint = false,
                                            onFreeListingOfferHint,
                                            suggestBtnRef,
                                            inputRef,
                                            inputText,
                                            handleInputChange,
                                        }) {
    return (
        <Box
            sx={{
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.88 : 0.98),
            }}
        >
            {composerRef && (
                <Box
                    sx={{
                        mx: 1.5,
                        mt: 1,
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.35),
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                    }}
                >
                    <Typography variant="caption" sx={{ minWidth: 0 }}>
                        Nhắc lại {composerRef.senderName}:{' '}
                        {(() => {
                            const raw = composerRef.content || '';
                            const preview =
                                raw.includes('XÁC NHẬN GIAO DỊCH') || raw.includes('Giá thỏa thuận')
                                    ? formatDealConfirmationDisplayContent(raw)
                                    : raw;
                            return preview.slice(0, 80);
                        })()}
                    </Typography>
                    <Button size="small" onClick={() => setComposerRef(null)}>
                        Bỏ
                    </Button>
                </Box>
            )}
            <Box
                sx={{
                    mx: 1.5,
                    mt: composerRef ? 0.75 : 1,
                    mb: 0.5,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                }}
            >
                <LightbulbOutlinedIcon color="primary" sx={{ fontSize: 20, mt: 0.15, flexShrink: 0, opacity: 0.95 }} />
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                    <Box component="span" fontWeight={700} color="primary.light" sx={{ mr: 0.5 }}>
                        Gợi ý nhanh
                    </Box>
                    : chọn câu mẫu để gửi ngay.
                </Typography>
            </Box>
            <Popover
                open={Boolean(suggestAnchorEl)}
                anchorEl={suggestAnchorEl}
                onClose={() => setSuggestAnchorEl(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        p: 2,
                        width: { xs: 'min(100vw - 32px, 360px)', sm: 360 },
                        maxHeight: 'min(420px, 55vh)',
                        overflow: 'auto',
                        borderRadius: 2,
                        boxShadow: 6,
                    },
                }}
            >
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                    <LightbulbOutlinedIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>
                        Gợi ý nhanh
                    </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                    Một bấm là <strong>gửi tin ngay</strong>. Đóng hộp này rồi mở lại bằng icon bóng đèn bất cứ lúc nào.
                </Typography>
                <Stack spacing={1}>
                    {suggestedChatPhrases.map((phrase) => (
                        <Chip
                            key={phrase}
                            label={phrase}
                            size="medium"
                            variant="outlined"
                            color="primary"
                            disabled={sending}
                            onClick={() => {
                                void handleSend(phrase);
                                setSuggestAnchorEl(null);
                            }}
                            sx={{
                                width: '100%',
                                height: 'auto',
                                py: 0.5,
                                '& .MuiChip-label': {
                                    whiteSpace: 'normal',
                                    textAlign: 'left',
                                    display: 'block',
                                },
                            }}
                        />
                    ))}
                </Stack>
            </Popover>

            <Paper
                elevation={0}
                sx={{
                    m: 1.5,
                    p: 1.1,
                    borderRadius: 2.5,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor:
                        theme.palette.mode === 'dark'
                            ? alpha(theme.palette.common.white, 0.05)
                            : alpha(theme.palette.common.white, 0.95),
                    boxShadow:
                        theme.palette.mode === 'dark'
                            ? 'inset 0 1px 0 rgba(255,255,255,0.04)'
                            : '0 8px 20px rgba(15,23,42,0.06)',
                }}
            >
                <Stack direction="row" spacing={1} alignItems="flex-end">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <Tooltip title="Gửi ảnh (JPG, PNG, WebP)">
            <span>
              <IconButton
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading || !activeSessionId}
                  sx={{ bgcolor: 'action.hover' }}
              >
                {imageUploading ? <CircularProgress size={20} /> : <AttachFileIcon fontSize="small" />}
              </IconButton>
            </span>
                    </Tooltip>
                    <Tooltip title={priceOfferTooltip ?? 'Trả giá / đề xuất giá'}>
            <span>
              <IconButton
                  size="small"
                  onClick={() => {
                      if (freeListingBuyerHint && !priceOfferDisabled) {
                          onFreeListingOfferHint?.();
                          return;
                      }
                      if (!priceOfferDisabled) setOfferOpen(true);
                  }}
                  disabled={!activeSessionId || Boolean(priceOfferDisabled)}
                  sx={{ bgcolor: 'action.hover' }}
              >
                <MonetizationOnIcon fontSize="small" />
              </IconButton>
            </span>
                    </Tooltip>
                    <Tooltip title={suggestAnchorEl ? 'Đóng gợi ý nhanh' : 'Mở gợi ý nhanh — chọn câu gửi ngay'}>
            <span>
              <IconButton
                  ref={suggestBtnRef}
                  size="small"
                  onClick={(e) => {
                      if (suggestAnchorEl) setSuggestAnchorEl(null);
                      else setSuggestAnchorEl(e.currentTarget);
                  }}
                  disabled={!activeSessionId}
                  color={suggestAnchorEl ? 'primary' : 'default'}
                  sx={{
                      bgcolor: suggestAnchorEl ? alpha(theme.palette.primary.main, 0.15) : 'action.hover',
                      border: suggestAnchorEl ? 1 : 0,
                      borderColor: 'primary.main',
                  }}
              >
                <LightbulbOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
                    </Tooltip>
                    <TextField
                        inputRef={inputRef}
                        size="small"
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Nhập tin nhắn… (Enter gửi, Shift+Enter xuống dòng)"
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                void handleSend();
                            }
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' },
                        }}
                    />
                    <Tooltip title="Gửi">
            <span>
              <IconButton
                  color="primary"
                  onClick={() => void handleSend()}
                  disabled={sending || !inputText?.trim()}
                  sx={{
                      flexShrink: 0,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                  }}
              >
                {sending ? <CircularProgress size={22} color="inherit" /> : <SendIcon />}
              </IconButton>
            </span>
                    </Tooltip>
                </Stack>
            </Paper>
        </Box>
    );
}

