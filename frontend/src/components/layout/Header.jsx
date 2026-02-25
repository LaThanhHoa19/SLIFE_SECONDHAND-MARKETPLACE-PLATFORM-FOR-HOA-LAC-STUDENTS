/** Mục đích: Header navigation + search + auth buttons + notification badge/list. API: GET /api/notifications, PATCH read. */
import { AppBar, Badge, Box, IconButton, Toolbar, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useContext } from 'react';
import { NotificationContext } from '../../providers/NotificationProvider';
export default function Header(){ const { unreadCount } = useContext(NotificationContext); return <AppBar position='static'><Toolbar><Typography>SLIFE</Typography><Box flex={1} /><IconButton color='inherit'><Badge badgeContent={unreadCount} color='error'><NotificationsIcon /></Badge></IconButton></Toolbar></AppBar>; }
