import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import SuperAdminLayout from '@/components/layout/SuperAdminLayout'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import TrialExpired from '@/pages/auth/TrialExpired'
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

/** Rutas normales: requieren sesión. Si trial expiró → /trial-expired
 *  Excepción: /admin/subscription siempre está accesible (para poder pagar). */
function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) {
  const { user, profile, loading, isTrialExpired } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user || !profile) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }
  if (isTrialExpired) return <Navigate to="/trial-expired" replace />
  return children
}

/** Igual que ProtectedRoute pero permite el acceso aunque el trial esté vencido
 *  (se usa para la página de suscripción). */
function ProtectedRouteNoTrialBlock({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) {
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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Landing (pública) ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Auth (públicas) ── */}
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/register"      element={<RegisterPage />} />
        <Route path="/trial-expired" element={<TrialExpired />} />

        {/* ── Super Admin ── */}
        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
          <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="dashboard" element={<SADashboard />} />
          <Route path="tenants"   element={<SATenants />} />
          <Route path="users"     element={<SAUsers />} />
          <Route path="stats"     element={<SAStats />} />
        </Route>

        {/* ── App (layout protegido, pathless) ── */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* Admin */}
          <Route path="/admin/dashboard"    element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users"        element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/settings"     element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
          <Route path="/admin/reports"      element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
          {/* Suscripción accesible siempre (incluso con trial vencido) */}
          <Route path="/admin/subscription" element={<ProtectedRouteNoTrialBlock allowedRoles={['admin']}><Subscription /></ProtectedRouteNoTrialBlock>} />

          {/* Supervisor */}
          <Route path="/supervisor/dashboard"         element={<ProtectedRoute allowedRoles={['admin','supervisor']}><SupervisorDashboard /></ProtectedRoute>} />
          <Route path="/supervisor/history"           element={<ProtectedRoute allowedRoles={['admin','supervisor']}><ChecklistHistory /></ProtectedRoute>} />
          <Route path="/supervisor/non-conformities"  element={<ProtectedRoute allowedRoles={['admin','supervisor']}><NonConformities /></ProtectedRoute>} />
          <Route path="/supervisor/reports"           element={<ProtectedRoute allowedRoles={['admin','supervisor']}><Reports /></ProtectedRoute>} />

          {/* Operator */}
          <Route path="/operator/home"                    element={<ProtectedRoute allowedRoles={['admin','supervisor','operator']}><OperatorHome /></ProtectedRoute>} />
          <Route path="/operator/checklist/:moduleCode"   element={<ProtectedRoute allowedRoles={['admin','supervisor','operator']}><ChecklistExecution /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
