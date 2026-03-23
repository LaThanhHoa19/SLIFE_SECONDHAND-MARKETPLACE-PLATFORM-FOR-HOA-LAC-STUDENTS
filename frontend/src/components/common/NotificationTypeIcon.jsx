/**
 * Icon theo loại thông báo — dùng chung Header dropdown và trang /notifications.
 */
import ChatIcon from '@mui/icons-material/Chat';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { deriveNotificationTab, NOTIF_TAB } from '../../utils/notificationCategory';

export default function NotificationTypeIcon({ notification: n, fontSize = 20 }) {
    const sx = { fontSize };
    const tab = deriveNotificationTab(n);
    if (tab === NOTIF_TAB.MESSAGE) return <ChatIcon sx={sx} />;
    if (tab === NOTIF_TAB.COMMENT) return <ChatBubbleOutlineIcon sx={sx} />;
    if (tab === NOTIF_TAB.OFFER) return <LocalOfferIcon sx={sx} />;
    if (tab === NOTIF_TAB.PUBLISH) return <NewspaperIcon sx={sx} />;
    const type = String(n?.type || '').toUpperCase();
    if (type === 'REPORT') return <FlagIcon sx={sx} />;
    if (type === 'DEAL') return <CheckCircleIcon sx={sx} />;
    return <NotificationsIcon sx={sx} />;
}
