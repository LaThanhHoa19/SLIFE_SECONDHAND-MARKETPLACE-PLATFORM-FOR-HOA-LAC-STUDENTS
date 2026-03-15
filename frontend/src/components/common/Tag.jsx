/**
 * Tag — chip hiển thị trạng thái/ nhãn (listing, deal, notification).
 * Props:
 *   label  – nội dung hiển thị
 *   color  – 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
 *   size   – 'small' | 'medium'
 */
import { Chip } from '@mui/material';
import PropTypes from 'prop-types';

export default function Tag({ label, color = 'default', size = 'small' }) {
    return <Chip label={label || '—'} color={color} size={size} />;
}

Tag.propTypes = {
    label: PropTypes.string,
    color: PropTypes.oneOf(['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning']),
    size: PropTypes.oneOf(['small', 'medium']),
};
