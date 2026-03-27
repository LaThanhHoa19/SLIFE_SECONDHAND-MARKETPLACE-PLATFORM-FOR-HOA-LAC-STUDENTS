import { useCallback, useState } from 'react';

const INITIAL_SNACKBAR = {
    open: false,
    message: '',
    severity: 'success',
    action: null,
};

export default function useSnackbarState() {
    const [snackbar, setSnackbar] = useState(INITIAL_SNACKBAR);

    const showSnackbar = useCallback((message, severity = 'success', action = null) => {
        setSnackbar({
            open: true,
            message: message || '',
            severity,
            action,
        });
    }, []);

    const closeSnackbar = useCallback(() => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    }, []);

    return {
        snackbar,
        showSnackbar,
        closeSnackbar,
    };
}
