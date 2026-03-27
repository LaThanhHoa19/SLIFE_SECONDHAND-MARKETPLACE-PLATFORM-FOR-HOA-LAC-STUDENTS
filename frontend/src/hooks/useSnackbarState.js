import { useCallback, useState } from 'react';
import { useToast } from '../context/ToastContext';

const INITIAL_SNACKBAR = {
    open: false,
    message: '',
    severity: 'success',
    action: null,
};

export default function useSnackbarState() {
    const [snackbar, setSnackbar] = useState(INITIAL_SNACKBAR);
    const { showToast } = useToast();

    const showSnackbar = useCallback((message, severity = 'success', action = null) => {
        showToast(message || '', severity);
        // Backward-compatible shape for legacy callers; UI render is delegated to global Toast.
        setSnackbar({
            open: false,
            message: message || '',
            severity,
            action,
        });
    }, [showToast]);

    const closeSnackbar = useCallback(() => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    }, []);

    return {
        snackbar,
        showSnackbar,
        closeSnackbar,
    };
}
