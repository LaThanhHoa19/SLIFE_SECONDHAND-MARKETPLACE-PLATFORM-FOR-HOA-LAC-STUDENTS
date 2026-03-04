/**
 * AppRouter - Định nghĩa tất cả routes của ứng dụng
 * - Public routes: ai cũng truy cập được
 * - Auth routes: chỉ cho chưa đăng nhập
 * - Protected routes: cần đăng nhập
 * - Admin routes: chỉ admin
 */
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';
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
          {/* ===== PUBLIC ROUTES - Ai cũng truy cập được ===== */}
          <Route path="/" element={<ListingsPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />

          {/* ===== AUTH ROUTES - Chỉ cho chưa đăng nhập ===== */}
          <Route path="/login" element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          } />
          <Route path="/register" element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          } />

          {/* ===== PROTECTED ROUTES - Cần đăng nhập ===== */}
          <Route path="/listings/new" element={
            <ProtectedRoute requireEmailVerified>
              <CreateListingPage />
            </ProtectedRoute>
          } />
          <Route path="/profile/:id" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/deals/:id" element={
            <ProtectedRoute>
              <DealDetailPage />
            </ProtectedRoute>
          } />

          {/* ===== ADMIN ROUTES - Chỉ admin ===== */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute roles={['ADMIN']}>
              <ReportManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
  );
}
