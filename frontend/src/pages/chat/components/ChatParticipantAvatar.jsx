import { useEffect, useState } from 'react';
import { Avatar } from '@mui/material';
import { fullImageUrl } from '../../../utils/constants';

/**
 * Avatar người đối diện trong chat: ưu tiên ảnh từ API, lỗi tải hoặc thiếu URL → chữ cái đầu.
 */
export default function ChatParticipantAvatar({ avatarUrl, displayName, sx = {} }) {
    const [broken, setBroken] = useState(false);
    useEffect(() => {
        setBroken(false);
    }, [avatarUrl]);
    const resolved = fullImageUrl(avatarUrl);
    const src = resolved && !broken ? resolved : undefined;
    const initial = (displayName || '?')[0]?.toUpperCase() ?? '?';

    return (
        <Avatar
            src={src}
            alt=""
            imgProps={{
                onError: () => setBroken(true),
            }}
            sx={{
                bgcolor: 'primary.main',
                flexShrink: 0,
                ...sx,
            }}
        >
            {initial}
        </Avatar>
    );
}
