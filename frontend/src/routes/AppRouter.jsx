/** Mục đích: Định nghĩa route public/protected/admin bằng React Router v6. */
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ListingsPage from '../pages/listing/ListingsPage';
import ListingDetailPage from '../pages/listing/ListingDetailPage';
import CreateListingPage from '../pages/listing/CreateListingPage';
import ProfilePage from '../pages/profile/ProfilePage';
import DealDetailPage from '../pages/deal/DealDetailPage';
import DashboardPage from '../pages/admin/DashboardPage';
import ReportManagementPage from '../pages/admin/ReportManagementPage';
import UserManagementPage from '../pages/admin/UserManagementPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<ListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/listings/new" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/deals/:id" element={<ProtectedRoute><DealDetailPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><ReportManagementPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagementPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
