import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Typography,
    Stack,
    Fade,
    alpha,
    InputAdornment
} from '@mui/material';
import {
    Close as CloseIcon,
    PhoneIphone as PhoneIcon,
    VerifiedUser as VerifiedIcon,
    ErrorOutline as ErrorIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { firebaseAuth } from '../../lib/firebase';
import * as userApi from '../../api/userApi';
import { unwrapApiData } from '../../utils/apiPayload';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';

const PURPLE = '#9D6EED';
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const getPayload = unwrapApiData;

/**
 * PhoneVerificationModal - Modal xác thực số điện thoại (Firebase OTP)
 * Dùng để chặn các hành động yêu cầu xác thực (như Đăng tin).
 */
export default function PhoneVerificationModal({ 
    open, 
    onClose, 
    onSuccess,
    initialPhoneNumber = ''
}) {
    const { user, updateUser: updateAuthUser } = useAuth();
    const { showToast } = useToast();
    
    // States: 'WARNING' -> 'PHONE_INPUT' -> 'OTP_INPUT'
    const [step, setStep] = useState('WARNING');
    const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || user?.phoneNumber || user?.phone_number || '');
    const [otpCode, setOtpCode] = useState('');
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef(null);
    
    // OTP Session
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [otpCooldownUntil, setOtpCooldownUntil] = useState(0);
    const [otpCooldownNow, setOtpCooldownNow] = useState(Date.now());
    
    const recaptchaContainerRef = useRef(null);
    const recaptchaVerifierRef = useRef(null);

    // Reset state khi mở lại
    useEffect(() => {
        if (open) {
            setStep('WARNING');
            const raw = initialPhoneNumber || user?.phoneNumber || user?.phone_number || '';
            let normalized = raw;
            if (raw.startsWith('+84')) normalized = raw.substring(3);
            else if (raw.startsWith('0')) normalized = raw.substring(1);
            
            setPhoneNumber(normalized);
            setOtpCode('');
            setLoading(false);
            setConfirmationResult(null);
            setOtpCooldownUntil(0);
        }
    }, [open, initialPhoneNumber, user]);

    // Timer cho cooldown
    useEffect(() => {
        if (!otpCooldownUntil) return undefined;
        const timer = window.setInterval(() => {
            setOtpCooldownNow(Date.now());
        }, 1000);
        return () => window.clearInterval(timer);
    }, [otpCooldownUntil]);

    const handleClose = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        onClose();
    };

    const clearRecaptchaVerifier = useCallback(() => {
        if (recaptchaVerifierRef.current) {
            try {
                recaptchaVerifierRef.current.clear();
            } catch (_) { /* noop */ }
            recaptchaVerifierRef.current = null;
        }
        if (recaptchaContainerRef.current) {
            recaptchaContainerRef.current.innerHTML = '';
        }
    }, []);

    const normalizePhoneNumber = (phone) => {
        const clean = phone.trim().replace(/\D/g, '');
        if (phone.startsWith('+')) return phone;
        // Logic đồng bộ: 9 số -> +84
        if (clean.length === 9) return '+84' + clean;
        return clean.replace(/^0/, '+84');
    };

    const handleSendOtp = async () => {
        if (!/^[1-9]\d{8}$/.test(phoneNumber)) {
            showToast('Số điện thoại phải gồm đúng 9 chữ số thuê bao (không gồm số 0 ở đầu).', 'warning');
            return;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setLoading(true);

        // Safety timeout for CAPTCHA/Firebase
        timeoutRef.current = setTimeout(() => {
            setLoading(false);
            showToast('Hệ thống phản hồi chậm. Vui lòng thử lại sau giây lát.', 'warning');
            // No need to clear here as next attempt will create a fresh container
        }, 45000);

        try {
            const normalizedPhone = normalizePhoneNumber(phoneNumber);
            
            // Definitively fix "already rendered" by creating a FRESH element every time
            clearRecaptchaVerifier();
            if (recaptchaContainerRef.current) {
                const freshChild = document.createElement('div');
                freshChild.id = `recaptcha-container-${Date.now()}`;
                recaptchaContainerRef.current.appendChild(freshChild);
                
                recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, freshChild, {
                    size: 'invisible',
                });
                await recaptchaVerifierRef.current.render();
            }

            const result = await signInWithPhoneNumber(firebaseAuth, normalizedPhone, recaptchaVerifierRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            
            setConfirmationResult(result);
            setStep('OTP_INPUT');
            setOtpCooldownUntil(Date.now() + OTP_RESEND_COOLDOWN_MS);
            showToast('Đã gửi mã OTP thành công.', 'success');
        } catch (err) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            clearRecaptchaVerifier();
            console.error('[PhoneVerification] send OTP failed', err);
            const code = err?.code || '';

            if (code === 'auth/invalid-phone-number') {
                showToast('Số điện thoại chưa đúng định dạng.', 'warning');
            } else if (code === 'auth/captcha-check-failed') {
                showToast('Hệ thống xác thực người máy không thành công. Hãy thử lại.', 'warning');
            } else if (code === 'auth/too-many-requests') {
                showToast('Bạn thao tác quá nhanh. Thử lại sau.', 'warning');
            } else {
                showToast(`Gửi mã thất bại: ${err?.message || 'Vui lòng thử lại sau.'}`, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otpCode.length !== 6) {
            showToast('Mã OTP phải có 6 chữ số.', 'warning');
            return;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setLoading(true);

        // Safety timeout for validation
        timeoutRef.current = setTimeout(() => {
            setLoading(false);
            showToast('Quá trình xác thực mất quá nhiều thời gian. Vui lòng thử lại.', 'warning');
        }, 30000);

        try {
            const credential = await confirmationResult.confirm(otpCode);
            const idToken = await credential.user.getIdToken();
            
            // Cập nhật SĐT lên server (luôn prepend +84)
            const phoneToUpdate = phoneNumber.startsWith('+') ? phoneNumber : `+84${phoneNumber}`;
            const currentStored = user?.phoneNumber || user?.phone_number;
            if (phoneToUpdate !== currentStored) {
                await userApi.updateUser({ phoneNumber: phoneToUpdate });
            }
            
            // Xác thực với BE
            const verifyRes = await userApi.verifyPhoneWithFirebase({ idToken });
            const patch = getPayload(verifyRes);
            
            // Fetch lại user mới nhất
            const meRes = await userApi.getUser();
            const fresh = getPayload(meRes);
            
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            if (fresh) {
                updateAuthUser(fresh);
            } else if (patch) {
                updateAuthUser({ ...user, ...patch });
            }

            showToast('Xác thực số điện thoại thành công!', 'success');
            onSuccess?.();
            onClose();
        } catch (err) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            console.error('[PhoneVerification] verify OTP failed', err);
            const code = err?.code || '';
            if (code === 'auth/invalid-verification-code') {
                showToast('Mã OTP không chính xác.', 'error');
            } else if (code === 'auth/code-expired') {
                showToast('Mã OTP đã hết hạn.', 'warning');
            } else {
                showToast('Xác thực thất bại. Vui lòng thử lại.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const cooldownLeft = Math.max(0, Math.ceil((otpCooldownUntil - otpCooldownNow) / 1000));

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            TransitionComponent={Fade}
            PaperProps={{
                sx: {
                    bgcolor: '#1a1d21',
                    backgroundImage: 'none',
                    borderRadius: 5, // Slightly rounder
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 24px 64px -12px rgba(0,0,0,0.8)',
                    width: '100%',
                    maxWidth: '380px !important', // Fixed narrower width
                    mx: 2,
                    overflow: 'hidden'
                }
            }}
        >
            {/* Invisible Recaptcha */}
            <Box
                ref={recaptchaContainerRef}
                aria-hidden
                sx={{
                    position: 'fixed',
                    left: 0,
                    bottom: 0,
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                    opacity: 0,
                    pointerEvents: 'none',
                    zIndex: -1,
                }}
            />

            <DialogTitle sx={{ color: 'white', position: 'relative', textAlign: 'center', pt: 4, pb: 1 }}>
                {step !== 'WARNING' && (
                    <IconButton
                        onClick={() => setStep(step === 'OTP_INPUT' ? 'PHONE_INPUT' : 'WARNING')}
                        sx={{ position: 'absolute', left: 16, top: 16, color: 'rgba(255,255,255,0.4)', zIndex: 1300, '&:hover': { color: 'white' } }}
                    >
                        <ArrowBackIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                )}
                <IconButton
                    onClick={handleClose}
                    sx={{ position: 'absolute', right: 16, top: 16, color: 'rgba(255,255,255,0.4)', zIndex: 1300, '&:hover': { color: 'white' } }}
                >
                    <CloseIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography 
                    component="div" 
                    sx={{ 
                        fontWeight: 800, 
                        fontFamily: "'Outfit', sans-serif", 
                        fontSize: '1.2rem', 
                        letterSpacing: '-0.02em' 
                    }}
                >
                    {step === 'WARNING' && 'Xác thực tài khoản'}
                    {step === 'PHONE_INPUT' && 'Số điện thoại'}
                    {step === 'OTP_INPUT' && 'Nhập mã OTP'}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 4, pb: 5, pt: 1 }}>
                {step === 'WARNING' && (
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '24px', // Squircle
                                bgcolor: alpha(PURPLE, 0.1),
                                border: `1px solid ${alpha(PURPLE, 0.2)}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 3,
                                position: 'relative',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    inset: -8,
                                    borderRadius: '30px',
                                    border: `1px solid ${alpha(PURPLE, 0.05)}`,
                                }
                            }}
                        >
                            <PhoneIcon sx={{ fontSize: 32, color: PURPLE }} />
                        </Box>
                        <Typography sx={{ color: 'rgba(255,255,255,0.95)', mb: 1.5, fontWeight: 700, fontSize: '1rem', lineHeight: 1.4 }}>
                            Xác thực SLife Hòa Lạc
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 4, px: 1, lineHeight: 1.5, textAlign: 'left', fontSize: '0.78rem' }}>
                            Để đảm bảo an toàn giao dịch, vui lòng xác thực số điện thoại của bạn. Quá trình này chỉ thực hiện một lần duy nhất.
                        </Typography>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => setStep('PHONE_INPUT')}
                            sx={{
                                bgcolor: PURPLE,
                                color: 'white',
                                borderRadius: '14px',
                                py: 1.8,
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                textTransform: 'none',
                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                '&:hover': { 
                                    bgcolor: alpha(PURPLE, 0.9),
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 12px 24px ${alpha(PURPLE, 0.3)}`
                                },
                                '&:active': { transform: 'scale(0.98)' },
                                boxShadow: `0 8px 20px ${alpha(PURPLE, 0.15)}`
                            }}
                        >
                            Tiếp tục
                        </Button>
                    </Box>
                )}

                {step === 'PHONE_INPUT' && (
                    <Box sx={{ pt: 1 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, textAlign: 'center', lineHeight: 1.5 }}>
                            {user?.phoneNumber || user?.phone_number 
                                ? 'Xác nhận số điện thoại hiện tại của bạn hoặc cập nhật số mới.' 
                                : 'Nhập số điện thoại để nhận mã xác thực qua tin nhắn (SMS).'}
                        </Typography>
                        <TextField
                            fullWidth
                            autoFocus
                            variant="outlined"
                            label="Số điện thoại"
                            placeholder="Nhập 9 số thuê bao"
                            value={phoneNumber}
                            onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.startsWith('0')) val = val.slice(1);
                                val = val.slice(0, 9);
                                setPhoneNumber(val);
                            }}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ mr: 1 }}>
                                        <Typography sx={{ color: alpha(PURPLE, 0.9), fontWeight: 800, fontSize: '1.1rem' }}>+84</Typography>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                mb: 4,
                                '& .MuiOutlinedInput-root': {
                                    color: 'white',
                                    borderRadius: '16px',
                                    bgcolor: 'rgba(255,255,255,0.02)',
                                    fontSize: '1.2rem',
                                    fontWeight: 600,
                                    height: '64px',
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                                    '&.Mui-focused fieldset': { borderColor: PURPLE, borderWidth: '2px' },
                                },
                                '& .MuiInputLabel-root': { 
                                    color: 'rgba(255,255,255,0.4)',
                                    '&.Mui-focused': { color: PURPLE }
                                },
                            }}
                            inputProps={{
                                spellCheck: false,
                                autoComplete: 'off',
                                inputMode: 'numeric',
                                style: { paddingLeft: '4px' }
                            }}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            disabled={loading || phoneNumber.length < 9}
                            onClick={handleSendOtp}
                            sx={{
                                bgcolor: PURPLE,
                                color: 'white',
                                borderRadius: '14px',
                                py: 1.8,
                                fontWeight: 800,
                                textTransform: 'none',
                                transition: 'all 0.3s',
                                '&:hover': { bgcolor: alpha(PURPLE, 0.9), transform: 'translateY(-2px)' },
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.2)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Gửi mã xác thực'}
                        </Button>
                    </Box>
                )}

                {step === 'OTP_INPUT' && (
                    <Box sx={{ pt: 1, textAlign: 'center' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mb: 4 }}>
                            Mã OTP đã được gửi tới <br/> <strong>+84{phoneNumber}</strong>
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1.2, justifyContent: 'center', mb: 5, position: 'relative' }}>
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        width: 40,
                                        height: 48,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '10px',
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        border: '1px solid',
                                        borderColor: otpCode[index] ? alpha(PURPLE, 0.6) : 'rgba(255,255,255,0.06)',
                                        color: 'white',
                                        fontSize: '1.2rem',
                                        fontWeight: 800,
                                        transition: 'all 0.2s',
                                        boxShadow: otpCode[index] ? `0 0 12px ${alpha(PURPLE, 0.1)}` : 'none'
                                    }}
                                >
                                    {otpCode[index] || ''}
                                </Box>
                            ))}
                            <input
                                autoFocus
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                style={{
                                    position: 'absolute',
                                    opacity: 0,
                                    width: '100%',
                                    height: '100%',
                                    top: 0,
                                    left: 0,
                                    cursor: 'default',
                                    textDecoration: 'none',
                                    outline: 'none',
                                    caretColor: 'transparent',
                                }}
                            />
                        </Box>

                        <Button
                            fullWidth
                            variant="contained"
                            disabled={loading || otpCode.length < 6}
                            onClick={handleVerifyOtp}
                            sx={{
                                bgcolor: PURPLE,
                                color: 'white',
                                borderRadius: '14px',
                                py: 1.8,
                                fontWeight: 800,
                                textTransform: 'none',
                                mb: 3,
                                transition: 'all 0.3s',
                                '&:hover': { bgcolor: alpha(PURPLE, 0.9), transform: 'translateY(-2px)' },
                                '&.Mui-disabled': {
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.2)',
                                }
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Xác thực'}
                        </Button>

                        <Box>
                            {cooldownLeft > 0 ? (
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                                    Gửi lại mã sau {cooldownLeft}s
                                </Typography>
                            ) : (
                                <Button
                                    variant="text"
                                    onClick={handleSendOtp}
                                    sx={{ 
                                        color: PURPLE, 
                                        textTransform: 'none', 
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        '&:hover': { bgcolor: 'transparent', color: alpha(PURPLE, 0.8) }
                                    }}
                                >
                                    Gửi lại mã
                                </Button>
                            )}
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}
