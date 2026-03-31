import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';

export default function OfferDialog({
                                        open,
                                        onClose,
                                        theme,
                                        offerAmount,
                                        setOfferAmount,
                                        formattedOfferAmount,
                                        formattedListingPrice,
                                        quickOfferSuggestions,
                                        parsedOfferAmount,
                                        canSubmitOffer,
                                        submitOffer,
                                        activeListingThumb,
                                        activeSession,
                                    }) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3.5,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.26),
                    bgcolor: alpha(theme.palette.background.paper, 0.98),
                    backgroundImage:
                        'radial-gradient(800px 260px at 50% -120px, rgba(168,85,247,0.18), transparent 65%)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 30px 70px rgba(2,6,23,0.55)',
                    overflow: 'hidden',
                },
            }}
        >
            <IconButton
                aria-label="Đóng"
                onClick={onClose}
                sx={{ position: 'absolute', top: 10, right: 10, color: 'text.secondary' }}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
            <DialogTitle sx={{ pb: 0.5, pt: 2.5 }}>
                <Stack spacing={1} alignItems="center">
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.22),
                            border: '1px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.38),
                        }}
                    >
                        <MonetizationOnIcon color="primary" />
                    </Box>
                    <Typography variant="h5" fontWeight={800}>
                        Đề xuất giá
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 320 }}>
                        Nhập số tiền bạn muốn đề xuất cho sản phẩm này.
                    </Typography>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 1.5 }}>
                <Typography
                    variant="caption"
                    sx={{ display: 'block', mb: 0.8, fontWeight: 700, letterSpacing: 0.8, color: 'text.secondary' }}
                >
                    SỐ TIỀN ĐỀ XUẤT
                </Typography>
                <TextField
                    autoFocus
                    fullWidth
                    id="chat-offer-price"
                    name="offer_price_custom"
                    placeholder="0"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(String(e.target.value || '').replace(/[^\d]/g, ''))}
                    type="text"
                    autoComplete="off"
                    inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        autoComplete: 'off',
                        spellCheck: 'false',
                        autoCorrect: 'off',
                        autoCapitalize: 'off',
                        'aria-autocomplete': 'none',
                        'data-lpignore': 'true',
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2.25,
                            fontSize: '1.9rem',
                            fontWeight: 700,
                            bgcolor: alpha(theme.palette.common.black, 0.18),
                            '& fieldset': {
                                borderColor: alpha(theme.palette.primary.main, 0.55),
                            },
                            '&.Mui-focused fieldset': {
                                borderWidth: 1.5,
                                borderColor: alpha(theme.palette.primary.light, 0.95),
                            },
                        },
                        '& .MuiOutlinedInput-input:focus': {
                            outline: 'none',
                            boxShadow: 'none',
                        },
                        '& .MuiOutlinedInput-input': {
                            caretColor: theme.palette.primary.light,
                        },
                        '& input[type=number]': {
                            MozAppearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0,
                        },
                    }}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">đ</InputAdornment>,
                    }}
                    helperText={formattedOfferAmount ? `Đề xuất của bạn: ${formattedOfferAmount}` : 'Nhập số tiền lớn hơn 0'}
                />
                {formattedListingPrice && (
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75, mb: 0.25 }}>
                        <Typography variant="caption" color="text.secondary">
                            Giá gốc: {formattedListingPrice}
                        </Typography>
                    </Stack>
                )}
                {quickOfferSuggestions.length > 0 && (
                    <>
                        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mt: 2.25, mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.8, color: 'text.secondary' }}>
                                GỢI Ý NHANH
                            </Typography>
                            <Box sx={{ flex: 1 }} />
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
                            {quickOfferSuggestions.map((amount) => (
                                <Chip
                                    key={amount}
                                    label={`${Math.round(amount / 1000)}k`}
                                    clickable
                                    onClick={() => setOfferAmount(String(amount))}
                                    color={parsedOfferAmount === amount ? 'primary' : 'default'}
                                    variant={parsedOfferAmount === amount ? 'filled' : 'outlined'}
                                />
                            ))}
                        </Stack>
                    </>
                )}
                <Button
                    fullWidth
                    variant="contained"
                    onClick={submitOffer}
                    disabled={!canSubmitOffer}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 800,
                        py: 1.15,
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, #a78bfa 0%, #b794f4 100%)',
                        color: '#17142a',
                        boxShadow: '0 10px 24px rgba(168,85,247,0.35)',
                        '&:hover': {
                            background: 'linear-gradient(90deg, #c4b5fd 0%, #c084fc 100%)',
                        },
                    }}
                >
                    Gửi đề xuất
                </Button>
                <Button
                    fullWidth
                    onClick={onClose}
                    sx={{ mt: 1, textTransform: 'none', color: 'text.secondary', fontWeight: 700 }}
                >
                    Hủy
                </Button>

                <Divider sx={{ my: 2 }} />
                <Paper
                    variant="outlined"
                    sx={{
                        p: 1.2,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: alpha(theme.palette.common.black, 0.12),
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                    }}
                >
                    {activeListingThumb ? (
                        <Box
                            component="img"
                            src={activeListingThumb}
                            alt={activeSession?.listingTitle || 'Ảnh sản phẩm'}
                            sx={{ width: 42, height: 42, borderRadius: 1.2, objectFit: 'cover' }}
                        />
                    ) : (
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 1.2,
                                display: 'grid',
                                placeItems: 'center',
                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                            }}
                        >
                            <StorefrontOutlinedIcon color="primary" fontSize="small" />
                        </Box>
                    )}
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                            {activeSession?.listingTitle || 'Sản phẩm đang trao đổi'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            Người bán: {activeSession?.otherParticipantName || 'Đang cập nhật'}
                        </Typography>
                    </Box>
                </Paper>
            </DialogContent>
        </Dialog>
    );
}

