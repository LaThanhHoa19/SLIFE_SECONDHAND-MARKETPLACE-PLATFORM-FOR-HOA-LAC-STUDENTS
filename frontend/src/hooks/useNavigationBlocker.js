import { useCallback, useContext, useEffect, useState } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';

/**
 * Block in-app navigation for non-data routers (BrowserRouter + Routes).
 *
 * React Router's `useBlocker` only works with Data Router (createBrowserRouter).
 * This hook uses `UNSAFE_NavigationContext` to call history.block().
 *
 * API:
 * - state: 'unblocked' | 'blocked'
 * - reset(): cancel the pending transition
 * - proceed(): allow the pending transition
 */
export function useNavigationBlocker(when) {
    const { navigator } = useContext(UNSAFE_NavigationContext);
    const [state, setState] = useState('unblocked');
    const [tx, setTx] = useState(null);

    const reset = useCallback(() => {
        setTx(null);
        setState('unblocked');
    }, []);

    const proceed = useCallback(() => {
        if (!tx) return;
        const next = tx;
        reset();
        next.retry();
    }, [tx, reset]);

    useEffect(() => {
        if (!when) {
            reset();
            return;
        }
        if (!navigator?.block) {
            // Should never happen with BrowserRouter, but fail open.
            return;
        }
        const unblock = navigator.block((transition) => {
            const enhanced = {
                ...transition,
                retry() {
                    unblock();
                    transition.retry();
                },
            };
            setTx(enhanced);
            setState('blocked');
        });
        return unblock;
    }, [navigator, when, reset]);

    return { state, reset, proceed };
}

