/**
 * Loading — placeholder trạng thái đang tải.
 * Props:
 *   size  – kích thước CircularProgress ('small' | 'medium' | number, default 'medium')
 */
import { CircularProgress, Stack } from '@mui/material';
import PropTypes from 'prop-types';

export default function Loading({ size = 'medium' }) {
    const progressSize = typeof size === 'number' ? size : size === 'small' ? 24 : 40;
    return (
        <Stack alignItems="center" justifyContent="center" p={2}>
            <CircularProgress size={progressSize} />
        </Stack>
    );
}

Loading.propTypes = {
    size: PropTypes.oneOfType([PropTypes.oneOf(['small', 'medium']), PropTypes.number]),
};
