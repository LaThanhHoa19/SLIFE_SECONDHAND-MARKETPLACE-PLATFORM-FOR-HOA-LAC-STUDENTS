import { useState } from 'react';
import {
    Box,
    Button,
    Chip,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Paper,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import {
    formatDealConfirmationDisplayContent,
    getDeliveryReceiptInfo,
    getReferencePreview,
    resolveChatImageSrc,
} from '../chatMessageUtils';
import { SearchHighlight } from '../chatSearchHighlight';

function ImageBubble({ fileUrl }) {
    const src = resolveChatImageSrc(fileUrl);
    return (
        <Box
            component="img"
            src={src}
            alt="Ảnh"
            sx={{
                width: '100%',
                maxHeight: '56vh',
                borderRadius: 1.5,
                display: 'block',
                objectFit: 'contain',
                cursor: 'pointer',
                bgcolor: 'rgba(0,0,0,0.08)',
            }}
            onClick={() => window.open(src, '_blank')}
        />
    );
}

function OfferBubble({ msg, onAccept, onReject }) {
    const isMe = msg.isFromCurrentUser;
    const superseded = msg.offerActionsSuperseded === true;
    // Chỉ coi là kết thúc khi BE trả về ACCEPTED/REJECTED. offerStatus null (lịch sử cũ) = vẫn đang chờ, không hiện "từ chối" nhầm.
    const isPending =
        !superseded &&
        (msg.offerStatus === 'PENDING' ||
            (msg.messageType === 'OFFER_PROPOSAL' &&
                msg.offerStatus !== 'ACCEPTED' &&
                msg.offerStatus !== 'REJECTED'));
    const showTerminalChip = msg.offerStatus === 'ACCEPTED' || msg.offerStatus === 'REJECTED' || superseded;
    return (
        <Box>
            <Typography variant="body2" fontWeight={600} gutterBottom>
                {msg.content}
            </Typography>
            {!isMe && isPending && msg.offerId != null && (
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => onAccept(msg.offerId)}
                    >
                        Chấp nhận
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => onReject(msg.offerId)}
                    >
                        Từ chối
                    </Button>
                </Box>
            )}
            {showTerminalChip && (
                <Chip
                    size="small"
                    label={
                        superseded && msg.offerStatus !== 'ACCEPTED' && msg.offerStatus !== 'REJECTED'
                            ? '✅ Đã chốt đơn (xem tin xác nhận bên dưới)'
                            : msg.offerStatus === 'ACCEPTED'
                              ? '✅ Đã chấp nhận'
                              : '❌ Đã từ chối'
                    }
                    color={
                        superseded && msg.offerStatus !== 'ACCEPTED' && msg.offerStatus !== 'REJECTED'
                            ? 'success'
                            : msg.offerStatus === 'ACCEPTED'
                              ? 'success'
                              : 'error'
                    }
                    sx={{ mt: 0.5 }}
                />
            )}
        </Box>
    );
}

export default function Bubble({
    msg,
    onAccept,
    onReject,
    onDealConfirmDecision,
    onReply,
    onJumpToMessage,
    onReportMessage,
    contentHighlightQuery = '',
}) {
    const theme = useTheme();
    const [menuAnchor, setMenuAnchor] = useState(null);
    const isMe = msg.isFromCurrentUser === true;
    const isSystem = msg.messageType === 'DEAL_CONFIRMATION';
    const isPending = !!msg._pending;
    const isHighlighted = msg._highlighted === true;
    const quoteRefId = msg?.quote?.id ?? msg?.quoteMessageId ?? null;
    const remindRefId = msg?.replyTo?.id ?? msg?.replyToMessageId ?? null;
    const stableMessageId = msg?.id != null && !String(msg.id).startsWith('tmp');
    const showReport = !isMe && stableMessageId && typeof onReportMessage === 'function';
    const showBubbleMenu = !isPending && stableMessageId && (Boolean(onReply) || showReport);

    if (isSystem) {
        const decided =
            msg?.dealDecision === 'ACCEPT' ||
            msg?.dealDecision === 'CANCEL' ||
            msg?.dealDecision === 'DONE';
        const isDealConfirmationRequest =
            typeof msg?.content === 'string' &&
            msg.content.toUpperCase().includes('XÁC NHẬN THỎA THUẬN');
        const responder = (msg?.dealResponderName && String(msg.dealResponderName).trim()) || 'Người mua';
        const formatted = formatDealConfirmationDisplayContent(msg.content);
        const detailBody =
            decided && typeof formatted === 'string'
                ? formatted.replace(/^🧾\s*XÁC NHẬN THỎA THUẬN\s*\n*/i, '').trim()
                : formatted;
        const isAccept = msg?.dealDecision === 'ACCEPT';
        const isCancel = msg?.dealDecision === 'CANCEL';
        const borderColor = isCancel
            ? alpha(theme.palette.error.main, 0.55)
            : alpha(theme.palette.success.main, 0.55);
        const bgColor = isCancel
            ? alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.12 : 0.08)
            : alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.14 : 0.12);
        const titleColor = isCancel
            ? theme.palette.mode === 'dark'
                ? theme.palette.error.light
                : theme.palette.error.dark
            : theme.palette.mode === 'dark'
              ? theme.palette.success.light
              : theme.palette.success.dark;
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
                <Paper
                    sx={{
                        px: 2,
                        py: 1.25,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor,
                        bgcolor: bgColor,
                        boxShadow: 'none',
                        maxWidth: 560,
                    }}
                >
                    {decided && isDealConfirmationRequest ? (
                        <>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: titleColor, lineHeight: 1.35 }}>
                                {isAccept && `${responder} đã chấp nhận giao dịch`}
                                {isCancel && `${responder} đã từ chối / hủy giao dịch`}
                                {!isAccept && !isCancel && `${responder} đã phản hồi về giao dịch`}
                            </Typography>
                            {detailBody ? (
                                <Typography
                                    variant="caption"
                                    component="div"
                                    sx={{
                                        mt: 1.25,
                                        color: 'text.secondary',
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {detailBody}
                                </Typography>
                            ) : null}
                        </>
                    ) : (
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                                color: titleColor,
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {formatted}
                        </Typography>
                    )}
                    {!isMe &&
                        isDealConfirmationRequest &&
                        typeof onDealConfirmDecision === 'function' &&
                        !decided && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.25, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => onDealConfirmDecision(msg, 'CANCEL')}
                                sx={{ fontWeight: 800, textTransform: 'none' }}
                            >
                                Hủy
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                onClick={() => onDealConfirmDecision(msg, 'ACCEPT')}
                                sx={{ fontWeight: 900, textTransform: 'none' }}
                            >
                                Chấp nhận
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>
        );
    }

    const refAccent = quoteRefId ? theme.palette.info.main : theme.palette.warning.main;
    // Yêu cầu UI: tin bên trái (đối phương) để nút … ở bên phải bubble,
    // tin bên phải (mình) để nút … ở bên trái bubble.
    const menuOnLeft = isMe;

    const bubbleMenu = showBubbleMenu ? (
        <>
            <IconButton
                size="small"
                className="chat-bubble-actions"
                aria-label="Thao tác tin nhắn"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{
                    mt: 0.25,
                    flexShrink: 0,
                    color: alpha(theme.palette.common.white, 0.92),
                }}
            >
                <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: menuOnLeft ? 'left' : 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: menuOnLeft ? 'left' : 'right' }}
            >
                {onReply ? (
                    <MenuItem
                        dense
                        onClick={() => {
                            onReply(msg);
                            setMenuAnchor(null);
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            <ReplyRoundedIcon fontSize="small" />
                        </ListItemIcon>
                        Nhắc lại
                    </MenuItem>
                ) : null}
                {showReport ? (
                    <MenuItem
                        dense
                        onClick={() => {
                            onReportMessage(msg);
                            setMenuAnchor(null);
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            <OutlinedFlagIcon fontSize="small" />
                        </ListItemIcon>
                        Báo cáo tin nhắn
                    </MenuItem>
                ) : null}
            </Menu>
        </>
    ) : null;

    return (
        <Box
            className="chat-bubble-row"
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                gap: 0.25,
                width: '100%',
                mb: 1,
                opacity: isPending ? 0.6 : 1,
                '& .chat-bubble-actions': {
                    opacity: 0.55,
                    transition: 'opacity 160ms ease',
                },
                '&:hover .chat-bubble-actions': {
                    opacity: 1,
                },
            }}
        >
            {isMe && bubbleMenu}
            <Paper
                elevation={0}
                sx={{
                    maxWidth: msg.messageType === 'IMAGE' ? { xs: '78%', sm: '62%', md: '52%' } : { xs: '86%', sm: '74%' },
                    p: msg.messageType === 'IMAGE' ? 0.6 : 1.5,
                    bgcolor: isMe
                        ? 'primary.main'
                        : theme.palette.mode === 'dark'
                            ? alpha(theme.palette.common.white, 0.07)
                            : theme.palette.grey[100],
                    color: isMe ? 'primary.contrastText' : 'text.primary',
                    borderRadius: isMe ? '18px 10px 18px 18px' : '10px 18px 18px 18px',
                    border: '1px solid',
                    borderColor: isHighlighted
                        ? alpha(theme.palette.warning.main, 0.95)
                        : isMe
                            ? alpha(theme.palette.primary.dark, 0.35)
                            : theme.palette.mode === 'dark'
                                ? alpha(theme.palette.common.white, 0.1)
                                : alpha(theme.palette.divider, 0.55),
                    boxShadow: isMe
                        ? `0 2px 14px ${alpha(theme.palette.primary.main, 0.35)}`
                        : theme.palette.mode === 'dark'
                            ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
                            : '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'transform 120ms ease, box-shadow 180ms ease',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: isMe
                            ? `0 6px 18px ${alpha(theme.palette.primary.main, 0.4)}`
                            : theme.palette.mode === 'dark'
                                ? '0 6px 16px rgba(2,6,23,0.35)'
                                : '0 6px 16px rgba(15,23,42,0.08)',
                    },
                }}
            >
                {!isMe && msg.senderName && (
                    <Typography
                        variant="caption"
                        display="block"
                        fontWeight={700}
                        sx={{ mb: 0.5, opacity: 0.75 }}
                    >
                        {msg.senderName}
                    </Typography>
                )}

                {(quoteRefId || remindRefId) && (
                    <Box
                        onClick={() => onJumpToMessage?.(quoteRefId || remindRefId)}
                        sx={{
                            mb: 0.75,
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: isMe
                                ? alpha(theme.palette.common.white, 0.4)
                                : alpha(refAccent, 0.45),
                            bgcolor: isMe
                                ? alpha(theme.palette.common.white, 0.14)
                                : alpha(refAccent, 0.08),
                            cursor: 'pointer',
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                opacity: 0.92,
                                color: 'inherit',
                                display: 'block',
                                wordBreak: 'break-word',
                            }}
                        >
                            {quoteRefId ? 'Trích dẫn' : 'Nhắc lại'}:{' '}
                            {getReferencePreview(
                                quoteRefId ? msg?.quote : msg?.replyTo,
                                quoteRefId || remindRefId
                            ).slice(0, 80)}
                        </Typography>
                    </Box>
                )}

                {msg.messageType === 'IMAGE' ? (
                    <ImageBubble fileUrl={msg.fileUrl} />
                ) : msg.messageType === 'OFFER_PROPOSAL' ? (
                    <OfferBubble msg={msg} onAccept={onAccept} onReject={onReject} />
                ) : contentHighlightQuery ? (
                    <SearchHighlight
                        text={typeof msg.content === 'string' ? msg.content : ''}
                        query={contentHighlightQuery}
                        component="div"
                        sx={{
                            fontSize: '0.875rem',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}
                    />
                ) : (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.content}
                    </Typography>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })
                            : '…'}
                    </Typography>
                    {isMe &&
                        (() => {
                            const receipt = getDeliveryReceiptInfo(msg, isPending);
                            return (
                                <Tooltip title={receipt.tooltip} arrow placement="top">
                                    <Typography
                                        variant="caption"
                                        component="span"
                                        sx={{
                                            opacity: 0.9,
                                            fontWeight: isPending ? 500 : 600,
                                            fontSize: '0.7rem',
                                            cursor: 'help',
                                            textDecoration: 'underline',
                                            textDecorationStyle: 'dotted',
                                            textUnderlineOffset: '3px',
                                        }}
                                    >
                                        {receipt.short}
                                    </Typography>
                                </Tooltip>
                            );
                        })()}
                </Box>
            </Paper>
            {!isMe && bubbleMenu}
        </Box>
    );
}

