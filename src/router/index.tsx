import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import SuperAdminLayout from '@/components/layout/SuperAdminLayout'
import LoginPage from '@/pages/auth/LoginPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import UserManagement from '@/pages/admin/UserManagement'
import SupervisorDashboard from '@/pages/supervisor/SupervisorDashboard'
import OperatorHome from '@/pages/operator/OperatorHome'
import ChecklistExecution from '@/pages/operator/ChecklistExecution'
import ChecklistHistory from '@/pages/supervisor/ChecklistHistory'
import NonConformities from '@/pages/supervisor/NonConformities'
import Reports from '@/pages/supervisor/Reports'
import Settings from '@/pages/admin/Settings'
import Subscription from '@/pages/admin/Subscription'
import SADashboard from '@/pages/superadmin/SADashboard'
import SATenants from '@/pages/superadmin/SATenants'
import SAUsers from '@/pages/superadmin/SAUsers'
import SAStats from '@/pages/superadmin/SAStats'
import LoadingScreen from '@/components/ui/LoadingScreen'

function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user || !profile) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

function SuperAdminRoute({ children }: { children: JSX.Element }) {
  const { user, isSuperAdmin, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isSuperAdmin) return <Navigate to="/" replace />
  return children
}

function RoleBasedHome() {
  const { profile, isSuperAdmin } = useAuth()
  if (isSuperAdmin) return <Navigate to="/superadmin/dashboard" replace />
  if (!profile) return <Navigate to="/login" replace />
  switch (profile.role) {
    case 'admin':      return <Navigate to="/admin/dashboard" replace />
    case 'supervisor': return <Navigate to="/supervisor/dashboard" replace />
    case 'operator':   return <Navigate to="/operator/home" replace />
    default:           return <Navigate to="/login" replace />
  }
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Pública ── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── Super Admin ── */}
        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
          <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="dashboard" element={<SADashboard />} />
          <Route path="tenants"   element={<SATenants />} />
          <Route path="users"     element={<SAUsers />} />
          <Route path="stats"     element={<SAStats />} />
        </Route>

        {/* ── App ── */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<RoleBasedHome />} />

          {/* Admin */}
          <Route path="admin/dashboard"  element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/users"      element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="admin/settings"   element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
          <Route path="admin/subscription" element={<ProtectedRoute allowedRoles={['admin']}><Subscription /></ProtectedRoute>} />
          {/* Reports also accessible to admin */}
          <Route path="admin/reports"    element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />

          {/* Supervisor */}
          <Route path="supervisor/dashboard"    element={<ProtectedRoute allowedRoles={['admin','supervisor']}><SupervisorDashboard /></ProtectedRoute>} />
          <Route path="supervisor/history"      element={<ProtectedRoute allowedRoles={['admin','supervisor']}><ChecklistHistory /></ProtectedRoute>} />
          <Route path="supervisor/non-conformities" element={<ProtectedRoute allowedRoles={['admin','supervisor']}><NonConformities /></ProtectedRoute>} />
          <Route path="supervisor/reports"      element={<ProtectedRoute allowedRoles={['admin','supervisor']}><Reports /></ProtectedRoute>} />

          {/* Operator */}
          <Route path="operator/home"      element={<ProtectedRoute allowedRoles={['admin','supervisor','operator']}><OperatorHome /></ProtectedRoute>} />
          <Route path="operator/checklist/:moduleCode" element={<ProtectedRoute allowedRoles={['admin','supervisor','operator']}><ChecklistExecution /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
