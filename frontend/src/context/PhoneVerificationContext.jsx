import { createContext, useContext, useState, useCallback } from 'react';
import PhoneVerificationModal from '../components/common/PhoneVerificationModal';
import { useAuth } from '../hooks/useAuth';

const PhoneVerificationContext = createContext(null);

export function PhoneVerificationProvider({ children }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [onSuccessCallback, setOnSuccessCallback] = useState(null);

    const checkVerification = useCallback((onVerified) => {
        if (!user) return false;

        const isPhoneVerified = !!(user.phoneVerified || user.phone_verified || user.phoneVerifiedAt || user.phone_verified_at);
        if (isPhoneVerified) {
            onVerified?.();
            return true;
        }

        setOnSuccessCallback(() => onVerified);
        setOpen(true);
        return false;
    }, [user]);

    const handleSuccess = useCallback(() => {
        setOpen(false);
        if (onSuccessCallback) {
            onSuccessCallback();
            setOnSuccessCallback(null);
        }
    }, [onSuccessCallback]);

    return (
        <PhoneVerificationContext.Provider value={{ checkVerification }}>
            {children}
            <PhoneVerificationModal
                open={open}
                onClose={() => setOpen(false)}
                onSuccess={handleSuccess}
            />
        </PhoneVerificationContext.Provider>
    );
}

export const usePhoneVerification = () => {
    const context = useContext(PhoneVerificationContext);
    if (!context) {
        throw new Error('usePhoneVerification must be used within a PhoneVerificationProvider');
    }
    return context;
};
