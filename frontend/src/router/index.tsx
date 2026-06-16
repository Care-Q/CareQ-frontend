import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import NurseLayout from '../layouts/NurseLayout';
import DoctorLayout from '../layouts/DoctorLayout';

// Pages stubs imports - we will create these pages next
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/patient/RegisterPage';
import TokenStatusPage from '../pages/patient/TokenStatusPage';
import PublicDisplayPage from '../pages/display/PublicDisplayPage';
import KioskPage from '../pages/patient/KioskPage';
import TriageConsolePage from '../pages/nurse/TriageConsolePage';
import StationPage from '../pages/doctor/StationPage';
import DashboardPage from '../pages/admin/DashboardPage';
import AnalyticsPage from '../pages/admin/AnalyticsPage';
import ReportsPage from '../pages/admin/ReportsPage';
import StationsPage from '../pages/admin/StationsPage';
import ConfigurationPage from '../pages/admin/ConfigurationPage';
import StaffPage from '../pages/admin/StaffPage';
import AuditLogPage from '../pages/admin/AuditLogPage';

export const router = createBrowserRouter([
  // Public Routes (Patient / Display)
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register/:deptSlug', element: <RegisterPage /> },
      { path: '/token/:tokenId', element: <TokenStatusPage /> },
    ],
  },
  
  // Public TV waiting display (no layout chrome, fullscreen)
  {
    path: '/display/:deptId',
    element: <PublicDisplayPage />
  },

  // Public Patient Kiosk & Mobile Phone Simulator
  {
    path: '/kiosk',
    element: <KioskPage />
  },

  // Nurse Routes
  {
    element: <ProtectedRoute allowedRoles={['nurse']} />,
    children: [
      {
        element: <NurseLayout />,
        children: [
          { path: '/nurse/triage', element: <TriageConsolePage /> },
        ],
      },
    ],
  },

  // Doctor Routes
  {
    element: <ProtectedRoute allowedRoles={['doctor']} />,
    children: [
      {
        element: <DoctorLayout />,
        children: [
          { path: '/doctor/station', element: <StationPage /> },
        ],
      },
    ],
  },

  // Admin Routes
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin/dashboard', element: <DashboardPage /> },
          { path: '/admin/analytics', element: <AnalyticsPage /> },
          { path: '/admin/reports', element: <ReportsPage /> },
          { path: '/admin/stations', element: <StationsPage /> },
          { path: '/admin/configuration', element: <ConfigurationPage /> },
          { path: '/admin/staff', element: <StaffPage /> },
          { path: '/admin/audit', element: <AuditLogPage /> },
        ],
      },
    ],
  },

  // Fallbacks
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
