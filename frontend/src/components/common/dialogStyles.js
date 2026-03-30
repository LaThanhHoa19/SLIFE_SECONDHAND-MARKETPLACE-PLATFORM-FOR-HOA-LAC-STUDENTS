/** Shared dialog paper styles for dark-theme admin/user screens. */

export const DARK_DIALOG_PAPER_PROPS = {
    sx: {
        bgcolor: '#25232C',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
    },
};

export const DANGER_DARK_DIALOG_PAPER_PROPS = {
    sx: {
        ...DARK_DIALOG_PAPER_PROPS.sx,
        border: '1px solid rgba(255,71,87,0.25)',
    },
};

/**
 * Cùng cách xử lý viền focus như thanh search trong UserManagementPage (searchFieldSx):
 * gán border + focus trực tiếp trên `.MuiOutlinedInput-root` (`fieldset` + `.MuiOutlinedInput-notchedOutline`)
 * để ghi đè màu primary (xanh) của MUI, kèm halo tím và tắt outline trình duyệt.
 */
const DIALOG_FIELD_BORDER = '#9D6EED';
const DIALOG_FIELD_FOCUS_GLOW = '0 0 0 3px rgba(157, 110, 237, 0.22)';

export const DARK_DIALOG_TEXTFIELD_SX = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        '& fieldset': { borderColor: DIALOG_FIELD_BORDER, borderWidth: 1 },
        '&:hover fieldset': { borderColor: DIALOG_FIELD_BORDER },
        '&.Mui-focused': {
            boxShadow: DIALOG_FIELD_FOCUS_GLOW,
        },
        '&.Mui-focused fieldset, &.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: DIALOG_FIELD_BORDER,
            borderWidth: 1,
        },
        '&.Mui-error fieldset': {
            borderColor: 'rgba(244,67,54,0.88)',
        },
        '&.Mui-error.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(244, 67, 54, 0.18)',
        },
        '&.Mui-error.Mui-focused fieldset, &.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(244,67,54,0.95)',
            borderWidth: 1,
        },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
    '& .MuiInputLabel-root.Mui-focused': { color: 'rgba(233,213,255,0.92)' },
    '& .MuiInputLabel-root.Mui-error': { color: '#f48fb1' },
    '& .MuiOutlinedInput-input': {
        outline: 'none',
        '&:focus': { outline: 'none', boxShadow: 'none' },
        '&:focus-visible': { outline: 'none', boxShadow: 'none' },
    },
    '& textarea.MuiOutlinedInput-input': {
        outline: 'none',
        '&:focus': { outline: 'none', boxShadow: 'none' },
        '&:focus-visible': { outline: 'none', boxShadow: 'none' },
    },
};
