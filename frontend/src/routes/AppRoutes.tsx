import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { AboutPage } from '../pages/AboutPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AssistanceBrowsePage } from '../pages/AssistanceBrowsePage';
import { BusinessHubPage } from '../pages/BusinessHubPage';
import { AssistanceRequestPage } from '../pages/AssistanceRequestPage';
import { MyRequestsPage } from '../pages/MyRequestsPage';
import { DonorDashboardPage } from '../pages/DonorDashboardPage';
import { MyDonationsPage } from '../pages/MyDonationsPage';
import { NetworkPage } from '../pages/NetworkPage';
import { MessagesPage } from '../pages/MessagesPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ReelsPage } from '../pages/ReelsPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="initiatives" element={<AssistanceBrowsePage />} />
        <Route path="reels" element={<ReelsPage />} />
        <Route path="business-hub" element={<BusinessHubPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Protected Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="request-aid" element={<AssistanceRequestPage />} />
          <Route path="my-requests" element={<MyRequestsPage />} />
          <Route path="donor-dashboard" element={<DonorDashboardPage />} />
          <Route path="my-donations" element={<MyDonationsPage />} />
          <Route path="network" element={<NetworkPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Admin Exclusive Routes */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminDashboardPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
