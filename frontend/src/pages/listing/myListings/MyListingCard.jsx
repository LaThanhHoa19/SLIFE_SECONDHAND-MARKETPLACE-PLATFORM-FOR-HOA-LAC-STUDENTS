import {
    Box,
    Button,
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    AccessTime as ClockIcon,
    Autorenew as RenewIcon,
    DeleteOutline as DeleteIcon,
    EditOutlined as EditIcon,
    ErrorOutline as ReportedIcon,
    ImageNotSupported as NoImageIcon,
    LocationOn as LocationIcon,
    Replay as RepostIcon,
    Visibility as UnhideIcon,
    VisibilityOff as HideIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fullImageUrl } from '../../../utils/constants';
import { formatDate } from '../../../utils/formatDate';
import { isRenewable, STATUS_COLORS, STATUS_LABELS, toCurrency } from './myListingsConfig';

function ActionButton({ icon, label, onClick, color, borderColor, bgColor, hoverBg, disabled }) {
    return (
        <Button
            type="button"
            disabled={disabled}
            onClick={onClick}
            startIcon={icon}
            sx={{
                minWidth: 0,
                px: 1.25,
                py: 0.4,
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                bgcolor: bgColor,
                color,
                textTransform: 'none',
                lineHeight: 1.2,
                fontSize: 11.5,
                fontWeight: 600,
                gap: 0.5,
                opacity: disabled ? 0.5 : 1,
                '& .MuiButton-startIcon': { mr: 0, ml: 0 },
                '&:hover': disabled ? {} : { bgcolor: hoverBg, borderColor: color },
            }}
        >
            {label}
        </Button>
    );
}

export default function MyListingCard({
                                          listing,
                                          activeTab,
                                          onHide,
                                          onUnhide,
                                          onRenew,
                                          onRepost,
                                          onDeleteDraft,
                                      }) {
    const navigate = useNavigate();
    const id = listing?.id ?? listing?.listingId;
    const images = Array.isArray(listing?.images) ? listing.images : [];
    const thumb = images[0];
    const statusColor = STATUS_COLORS[listing?.status] || STATUS_COLORS.DRAFT;

    return (
        <Box sx={{
            display: 'flex',
            gap: 2.5,
            p: 2.5,
            borderRadius: '14px',
            bgcolor: '#262130',
            border: '1px solid rgba(255,255,255,0.07)',
            transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
            '&:hover': {
                borderColor: 'rgba(157,110,237,0.4)',
                boxShadow: '0 4px 24px rgba(157,110,237,0.1)',
                transform: 'translateY(-1px)',
            },
        }}>

            <Box
                onClick={() => navigate(`/listings/${id}`)}
                sx={{
                    width: 112,
                    height: 112,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: 'pointer',
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '2px solid rgba(157,110,237,0.22)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        borderColor: '#9D6EED',
                        boxShadow: '0 4px 18px rgba(157,110,237,0.3)',
                    },
                }}
            >
                {thumb ? (
                    <Box
                        component="img"
                        src={fullImageUrl(thumb)}
                        alt={listing?.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                ) : (
                    <Box sx={{ textAlign: 'center' }}>
                        <NoImageIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.18)' }} />
                        <Typography fontSize={10} color="rgba(255,255,255,0.2)" sx={{ mt: 0.5 }}>
                            Chưa có ảnh
                        </Typography>
                    </Box>
                )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.6 }}>

                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
                    <Typography
                        onClick={() => navigate(`/listings/${id}`)}
                        fontSize={15}
                        fontWeight={600}
                        color="rgba(255,255,255,0.92)"
                        sx={{
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.4,
                            transition: 'color 0.15s',
                            '&:hover': { color: '#9D6EED' },
                        }}
                    >
                        {listing?.title || 'Không có tiêu đề'}
                    </Typography>

                    <Stack direction="row" gap={0.75} flexShrink={0} alignItems="center" sx={{ mt: '-2px' }}>
                        {activeTab === 'ACTIVE' && (
                            <>
                                {isRenewable(listing?.expirationDate) && (
                                    <Tooltip title="Gia hạn thêm 15 ngày (chỉ khả dụng trong 7 ngày cuối)" arrow>
                                        <ActionButton
                                            icon={<RenewIcon sx={{ fontSize: 12, color: '#2ed573' }} />}
                                            label="Gia hạn"
                                            onClick={() => onRenew(id)}
                                            color="#2ed573"
                                            borderColor="rgba(46,213,115,0.35)"
                                            bgColor="rgba(46,213,115,0.08)"
                                            hoverBg="rgba(46,213,115,0.16)"
                                        />
                                    </Tooltip>
                                )}
                                <Tooltip title="Ẩn tin — bài đăng sẽ không hiển thị với người khác" arrow>
                                    <ActionButton
                                        icon={<HideIcon sx={{ fontSize: 12, color: '#ffa500' }} />}
                                        label="Ẩn tin"
                                        onClick={() => onHide(id)}
                                        color="#ffa500"
                                        borderColor="rgba(255,165,0,0.35)"
                                        bgColor="rgba(255,165,0,0.08)"
                                        hoverBg="rgba(255,165,0,0.16)"
                                    />
                                </Tooltip>
                                <Tooltip title="Chỉnh sửa tin đăng" arrow>
                                    <IconButton
                                        size="small"
                                        onClick={() => id && navigate(`/listings/${id}/edit`)}
                                        sx={{ color: '#fff', p: '4px' }}
                                    >
                                        <EditIcon sx={{ fontSize: 15, color: '#fff' }} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}

                        {activeTab === 'DRAFT' && (
                            <>
                                <Tooltip title="Tiếp tục chỉnh sửa và đăng bài" arrow>
                                    <ActionButton
                                        icon={<EditIcon sx={{ fontSize: 12, color: '#fff' }} />}
                                        label="Chỉnh sửa & Đăng"
                                        onClick={() => id && navigate(`/drafts/${id}/publish`)}
                                        color="#9D6EED"
                                        borderColor="rgba(157,110,237,0.35)"
                                        bgColor="rgba(157,110,237,0.1)"
                                        hoverBg="rgba(157,110,237,0.2)"
                                    />
                                </Tooltip>
                                <Tooltip title="Xóa bản nháp này vĩnh viễn" arrow>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDeleteDraft(id)}
                                        sx={{
                                            p: '4px',
                                            color: '#ff4757',
                                            border: '1px solid rgba(255,71,87,0.3)',
                                            borderRadius: '8px',
                                            bgcolor: 'rgba(255,71,87,0.06)',
                                            transition: 'background 0.15s, border-color 0.15s',
                                            '&:hover': {
                                                bgcolor: 'rgba(255,71,87,0.16)',
                                                borderColor: '#ff4757',
                                            },
                                        }}
                                    >
                                        <DeleteIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}

                        {activeTab === 'EXPIRED' && (
                            <Tooltip title="Đăng lại — tin sẽ hiển thị công khai trong 30 ngày" arrow>
                                <ActionButton
                                    icon={<RepostIcon sx={{ fontSize: 12, color: '#9D6EED' }} />}
                                    label="Đăng lại"
                                    onClick={() => onRepost(id)}
                                    color="#9D6EED"
                                    borderColor="rgba(157,110,237,0.35)"
                                    bgColor="rgba(157,110,237,0.08)"
                                    hoverBg="rgba(157,110,237,0.18)"
                                />
                            </Tooltip>
                        )}

                        {activeTab === 'HIDDEN' && (
                            <Tooltip title="Hiển thị lại bài đăng cho mọi người" arrow>
                                <ActionButton
                                    icon={<UnhideIcon sx={{ fontSize: 12, color: '#2ed573' }} />}
                                    label="Hiển thị lại"
                                    onClick={() => onUnhide(id)}
                                    color="#2ed573"
                                    borderColor="rgba(46,213,115,0.35)"
                                    bgColor="rgba(46,213,115,0.08)"
                                    hoverBg="rgba(46,213,115,0.16)"
                                />
                            </Tooltip>
                        )}

                        {(activeTab === 'PENDING' || activeTab === 'REJECTED' || activeTab === 'REPORTED') && (
                            <Tooltip title="Chỉnh sửa tin đăng" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => id && navigate(`/listings/${id}/edit`)}
                                    sx={{ color: '#fff', p: '4px' }}
                                >
                                    <EditIcon sx={{ fontSize: 15, color: '#fff' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>

                <Typography
                    fontSize={16}
                    fontWeight={700}
                    color={listing?.isGiveaway ? '#2ed573' : '#FF4757'}
                    sx={{ lineHeight: 1 }}
                >
                    {listing?.isGiveaway ? '🎁 Cho tặng miễn phí' : toCurrency(listing?.price)}
                </Typography>

                <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.25 }}>
                    <Chip
                        size="small"
                        label={STATUS_LABELS[listing?.status] || listing?.status}
                        sx={{
                            height: 22,
                            fontSize: 11.5,
                            fontWeight: 600,
                            bgcolor: statusColor.bg,
                            color: statusColor.text,
                            border: `1px solid ${statusColor.border}`,
                            borderRadius: '20px',
                            px: 0.25,
                        }}
                    />

                    {listing?.reportCount > 0 && (
                        <Chip
                            size="small"
                            icon={<ReportedIcon sx={{ fontSize: 11, color: '#ff4757 !important' }} />}
                            label={`${listing.reportCount} báo cáo`}
                            sx={{
                                height: 22,
                                fontSize: 11.5,
                                fontWeight: 600,
                                bgcolor: 'rgba(255,71,87,0.1)',
                                color: '#ff4757',
                                border: '1px solid rgba(255,71,87,0.28)',
                                borderRadius: '20px',
                                px: 0.25,
                                '& .MuiChip-icon': { ml: '5px' },
                            }}
                        />
                    )}

                    {listing?.categoryName && (
                        <Chip
                            size="small"
                            label={listing.categoryName}
                            sx={{
                                height: 22,
                                fontSize: 11.5,
                                bgcolor: 'rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.5)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px',
                                px: 0.25,
                            }}
                        />
                    )}

                    {listing?.expirationDate && (
                        <Chip
                            size="small"
                            icon={<ClockIcon sx={{ fontSize: 11, color: '#ffa500 !important' }} />}
                            label={`Hết hạn ${formatDate(listing.expirationDate)}`}
                            sx={{
                                height: 22,
                                fontSize: 11.5,
                                bgcolor: 'rgba(255,165,0,0.08)',
                                color: 'rgba(255,165,0,0.9)',
                                border: '1px solid rgba(255,165,0,0.22)',
                                borderRadius: '20px',
                                px: 0.25,
                                '& .MuiChip-icon': { ml: '5px' },
                            }}
                        />
                    )}
                </Stack>

                <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ mt: 'auto', pt: 0.5 }}>
                    {listing?.location && (
                        <Stack direction="row" alignItems="center" gap={0.4}>
                            <LocationIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }} />
                            <Typography fontSize={12} color="rgba(255,255,255,0.28)"
                                        sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {listing.location}
                            </Typography>
                        </Stack>
                    )}
                    <Stack direction="row" alignItems="center" gap={0.4}>
                        <ClockIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }} />
                        <Typography fontSize={12} color="rgba(255,255,255,0.28)">
                            {formatDate(listing?.createdAt)}
                        </Typography>
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
}
