/**
 * useConfirmDialog — hook tiện ích để dùng ConfirmDialog programmatically.
 *
 * Cách dùng:
 *   const { confirmProps, confirm } = useConfirmDialog();
 *
 *   // Trong JSX:
 *   <ConfirmDialog {...confirmProps} />
 *
 *   // Trigger:
 *   const ok = await confirm({
 *     title: 'Xoá tin?',
 *     content: 'Hành động này không thể hoàn tác.',
 *     variant: 'danger',
 *   });
 *   if (ok) { ... }
 */
import { useCallback, useState } from 'react';

export default function useConfirmDialog() {
    const [state, setState] = useState({
        open: false,
        title: '',
        content: '',
        variant: 'danger',
        confirmLabel: undefined,
        resolve: null,
    });

    const confirm = useCallback(
        ({ title, content, variant = 'danger', confirmLabel } = {}) =>
            new Promise((resolve) => {
                setState({ open: true, title, content, variant, confirmLabel, resolve });
            }),
        [],
    );

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState((s) => ({ ...s, open: false }));
    }, [state]);

    const handleClose = useCallback(() => {
        state.resolve?.(false);
        setState((s) => ({ ...s, open: false }));
    }, [state]);

    return {
        confirm,
        confirmProps: {
            open: state.open,
            title: state.title,
            content: state.content,
            variant: state.variant,
            confirmLabel: state.confirmLabel,
            onConfirm: handleConfirm,
            onClose: handleClose,
        },
    };
}
