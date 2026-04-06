import { useContext } from 'react';
import { AdminAuthContext } from '../context/AdminAuthContext';

export function useAdminAuth() {
    return useContext(AdminAuthContext) ?? {};
}
