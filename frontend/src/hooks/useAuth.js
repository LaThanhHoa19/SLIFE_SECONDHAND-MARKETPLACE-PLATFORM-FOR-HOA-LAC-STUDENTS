/** Mục đích: Hook tiện ích đọc AuthContext. */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
export const useAuth = () => useContext(AuthContext);
