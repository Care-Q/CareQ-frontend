export const ROUTES = {
  // Public
  LOGIN: '/login',
  REGISTER: '/register/:deptSlug',
  TOKEN_STATUS: '/token/:tokenId',
  DISPLAY: '/display/:deptId',
  KIOSK: '/kiosk',
  
  // Nurse
  NURSE_TRIAGE: '/nurse/triage',
  
  // Doctor
  DOCTOR_STATION: '/doctor/station',
  
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_STATIONS: '/admin/stations',
  ADMIN_CONFIGURATION: '/admin/configuration',
  ADMIN_STAFF: '/admin/staff',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_REPORTS: '/admin/reports',
} as const;

export default ROUTES;
