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
