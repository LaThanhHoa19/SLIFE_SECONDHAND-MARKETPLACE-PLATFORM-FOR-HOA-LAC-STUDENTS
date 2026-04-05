import { Box, Badge, Chip, CircularProgress, Fab, LinearProgress, Skeleton, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import Bubble from './Bubble';
import {
    formatChatDayLabel,
    getMessageDomId,
    getMessageRowKey,
    isMessageFromCurrentUser,
    sameCalendarDayVi,
} from '../chatMessageUtils';

export default function ChatMessagesPanel({
                                              theme,
                                              messagesScrollRef,
                                              onScroll,
                                              updateJumpToLatestVisibility,
                                              historyLoading,
                                              loadingOlderHistory,
                                              historyHasMore,
                                              displayMessages,
                                              currentUserId,
                                              highlightedMessageId,
                                              bubbleSearchHighlight,
                                              handleAccept,
                                              handleReject,
                                              handleDealConfirmDecision,
                                              handleReplyMessage,
                                              handleJumpToMessage,
                                              handleReportMessage,
                                              typingLabel,
                                              bottomRef,
                                              newOpponentMsgCount,
                                              showJumpToLatest,
                                              messages,
                                              scrollToBottom,
                                          }) {
    const showHistorySkeleton = historyLoading && displayMessages.length === 0;

    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {historyLoading && (
                <LinearProgress
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 4,
                        height: 2,
                        borderRadius: 0,
                    }}
                />
            )}
            <Box
                ref={messagesScrollRef}
                onScroll={onScroll ?? updateJumpToLatestVisibility}
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    overscrollBehavior: 'contain',
                    p: 2,
                    bgcolor:
                        theme.palette.mode === 'dark'
                            ? alpha(theme.palette.common.black, 0.22)
                            : alpha(theme.palette.grey[500], 0.06),
                    backgroundImage:
                        theme.palette.mode === 'dark'
                            ? 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)'
                            : 'linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${alpha(theme.palette.primary.main, 0.42)} ${alpha(theme.palette.common.white, 0.06)}`,
                    '&::-webkit-scrollbar': {
                        width: 10,
                    },
                    '&::-webkit-scrollbar-track': {
                        background: alpha(theme.palette.common.white, 0.04),
                        borderRadius: 999,
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: alpha(theme.palette.primary.main, 0.48),
                        borderRadius: 999,
                        border: `2px solid ${alpha(theme.palette.background.paper, 0.72)}`,
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                        background: alpha(theme.palette.primary.light, 0.66),
                    },
                }}
            >
                {loadingOlderHistory && !showHistorySkeleton && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.25 }}>
                        <CircularProgress size={22} thickness={4} />
                    </Box>
                )}
                {historyHasMore && !loadingOlderHistory && !showHistorySkeleton && displayMessages.length > 0 && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', textAlign: 'center', pb: 1, opacity: 0.85 }}
                    >
                        Cuộn lên để tải tin cũ hơn
                    </Typography>
                )}
                {showHistorySkeleton ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, py: 0.5 }}>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <Skeleton
                                key={i}
                                variant="rounded"
                                height={i % 2 === 0 ? 48 : 56}
                                sx={{
                                    alignSelf: i % 2 === 0 ? 'flex-end' : 'flex-start',
                                    width: `${58 + (i % 3) * 12}%`,
                                    maxWidth: '92%',
                                    borderRadius: 2.5,
                                }}
                            />
                        ))}
                    </Box>
                ) : displayMessages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                        <LightbulbOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7, mb: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Bắt đầu hội thoại
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
                            Dòng <strong>gợi ý nhanh</strong> ngay trên ô nhập nhắc bạn có thể bấm icon <strong>bóng đèn</strong> để chọn câu gửi
                            ngay. Hoặc gõ tin trực tiếp ở ô bên dưới.
                        </Typography>
                    </Box>
                ) : (
                    displayMessages.map((m, idx) => {
                        const msgIsMe = isMessageFromCurrentUser(m, currentUserId);
                        const prev = idx > 0 ? displayMessages[idx - 1] : null;
                        const showDay = idx === 0 || !sameCalendarDayVi(prev?.timestamp, m.timestamp);
                        const mid = m?.id != null ? String(m.id) : null;
                        const isHighlighted = mid != null && String(highlightedMessageId) === mid;
                        const contentHighlightQuery =
                            bubbleSearchHighlight &&
                            mid != null &&
                            String(bubbleSearchHighlight.messageId) === mid
                                ? bubbleSearchHighlight.query || ''
                                : '';
                        return (
                            <Box key={getMessageRowKey(m, idx)}>
                                {showDay && m.timestamp && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                        <Chip
                                            size="small"
                                            label={formatChatDayLabel(m.timestamp)}
                                            sx={{
                                                bgcolor: alpha(theme.palette.primary.main, 0.18),
                                                color: 'text.secondary',
                                                border: '1px solid',
                                                borderColor: alpha(theme.palette.primary.main, 0.35),
                                                fontWeight: 600,
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                    </Box>
                                )}
                                <div id={getMessageDomId(mid)}>
                                    <Bubble
                                        msg={{ ...m, isFromCurrentUser: msgIsMe, _highlighted: isHighlighted }}
                                        onAccept={handleAccept}
                                        onReject={handleReject}
                                        onDealConfirmDecision={handleDealConfirmDecision}
                                        onReply={handleReplyMessage}
                                        onJumpToMessage={handleJumpToMessage}
                                        onReportMessage={handleReportMessage}
                                        contentHighlightQuery={contentHighlightQuery}
                                    />
                                </div>
                            </Box>
                        );
                    })
                )}
                {typingLabel && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1,
                            mb: 1,
                        }}
                    >
                        <CircularProgress size={12} />
                        <Typography variant="caption" color="text.secondary">
                            {typingLabel}
                        </Typography>
                    </Box>
                )}
                <div ref={bottomRef} />
            </Box>

            {newOpponentMsgCount > 0 && showJumpToLatest && !historyLoading && (
                <Box
                    sx={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bottom: 58,
                        zIndex: 2,
                        pointerEvents: 'none',
                    }}
                >
                    <Chip label="Tin nhắn mới!" color="primary" size="small" sx={{ fontWeight: 700, boxShadow: 2 }} />
                </Box>
            )}

            {showJumpToLatest && !historyLoading && messages.length > 0 && (
                <Tooltip
                    title={newOpponentMsgCount > 0 ? `${newOpponentMsgCount} tin mới từ đối phương` : 'Xuống tin mới nhất'}
                    placement="left"
                >
                    <Badge
                        badgeContent={newOpponentMsgCount > 0 ? newOpponentMsgCount : 0}
                        color="error"
                        overlap="circular"
                        invisible={newOpponentMsgCount === 0}
                        sx={{
                            position: 'absolute',
                            bottom: 12,
                            right: 16,
                            zIndex: 5,
                            '& .MuiBadge-badge': {
                                fontWeight: 700,
                                minWidth: 18,
                                zIndex: 6,
                                top: 6,
                                right: 6,
                                boxShadow: (t) => `0 0 0 2px ${t.palette.background.paper}`,
                            },
                        }}
                    >
                        <Fab
                            size="small"
                            color="primary"
                            aria-label="Xuống tin mới nhất"
                            onClick={() => scrollToBottom('smooth')}
                            sx={{ boxShadow: 3, zIndex: 4 }}
                        >
                            <KeyboardArrowDownIcon />
                        </Fab>
                    </Badge>
                </Tooltip>
            )}
        </Box>
    );
}

