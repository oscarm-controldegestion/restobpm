import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import UserManagement from '@/pages/admin/UserManagement'
import SupervisorDashboard from '@/pages/supervisor/SupervisorDashboard'
import OperatorHome from '@/pages/operator/OperatorHome'
import OperatorPlanillas from '@/pages/operator/Planillas'
import ChecklistExecution from '@/pages/operator/ChecklistExecution'
import ChecklistHistory from '@/pages/supervisor/ChecklistHistory'
import NonConformities from '@/pages/supervisor/NonConformities'
import Reports from '@/pages/supervisor/Reports'
import PlanillasDashboard from '@/pages/supervisor/PlanillasDashboard'
import Settings from '@/pages/admin/Settings'
import Subscription from '@/pages/admin/Subscription'
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

function RoleBasedHome() {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  switch (profile.role) {
    case 'admin':      return <Navigate to="/admin/dashboard" replace />
    case 'supervisor': return <Navigate to="/supervisor/planillas" replace />
    case 'operator':   return <Navigate to="/operator/planillas" replace />
    default:           return <Navigate to="/login" replace />
  }
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Pública ── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── App ── */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<RoleBasedHome />} />

          {/* Admin */}
          <Route path="admin/dashboard"    element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="admin/users"        element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
          <Route path="admin/settings"     element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
          <Route path="admin/subscription" element={<ProtectedRoute allowedRoles={['admin']}><Subscription /></ProtectedRoute>} />
          <Route path="admin/reports"      element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
          <Route path="admin/planillas"    element={<ProtectedRoute allowedRoles={['admin']}><PlanillasDashboard /></ProtectedRoute>} />

          {/* Supervisor */}
          <Route path="supervisor/dashboard"        element={<ProtectedRoute allowedRoles={['admin','supervisor']}><SupervisorDashboard /></ProtectedRoute>} />
          <Route path="supervisor/planillas"         element={<ProtectedRoute allowedRoles={['admin','supervisor']}><PlanillasDashboard /></ProtectedRoute>} />
          <Route path="supervisor/history"          element={<ProtectedRoute allowedRoles={['admin','supervisor']}><ChecklistHistory /></ProtectedRoute>} />
          <Route path="supervisor/non-conformities" element={<ProtectedRoute allowedRoles={['admin','supervisor']}><NonConformities /></ProtectedRoute>} />
          <Route path="supervisor/reports"          element={<ProtectedRoute allowedRoles={['admin','supervisor']}><Reports /></ProtectedRoute>} />

          {/* Operator */}
          <Route path="operator/planillas" element={<ProtectedRoute allowedRoles={['admin','supervisor','operator']}><OperatorPlanillas /></ProtectedRoute>} />
          <Route path="operator/home"      element={<ProtectedRoute allowedRoles={['admin','supervisor','operator']}><OperatorHome /></ProtectedRoute>} />
          <Route path="operator/checklist/:moduleCode" element={<ProtectedRoute allowedRoles={['admin','supervisor','operator']}><ChecklistExecution /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
