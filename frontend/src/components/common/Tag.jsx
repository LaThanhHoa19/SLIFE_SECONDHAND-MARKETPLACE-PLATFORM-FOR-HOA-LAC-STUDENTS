/** Mục đích: Tag/chip reusable cho trạng thái listing/deal/notification. */
import { Chip } from '@mui/material';
export default function Tag({label,color='default'}){ return <Chip label={label || 'TODO'} color={color} size='small' />; }
