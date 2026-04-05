import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, AlertTriangle, FileText,
  Users, Settings, CreditCard, X, LogOut, ChevronRight,
  ClipboardCheck, Bell, ShieldCheck
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem { label: string; path: string; icon: React.ElementType; roles: string[] }

const NAV_ITEMS: NavItem[] = [
  // ── Operator ──────────────────────────────────────────────
  { label: 'Mis Planillas',    path: '/operator/planillas', icon: ClipboardCheck, roles: ['operator'] },

  // ── Supervisor + Admin ─────────────────────────────────────
  { label: 'Planillas',        path: '/supervisor/planillas', icon: ClipboardCheck, roles: ['supervisor', 'admin'] },
  { label: 'Dashboard BPM',    path: '/supervisor/dashboard', icon: LayoutDashboard, roles: ['supervisor', 'admin'] },
  { label: 'Historial BPM',    path: '/supervisor/history',   icon: ClipboardList,   roles: ['supervisor', 'admin'] },
  { label: 'No Conformidades', path: '/supervisor/non-conformities', icon: AlertTriangle, roles: ['supervisor', 'admin'] },
  { label: 'Reportes',         path: '/supervisor/reports',   icon: FileText,        roles: ['supervisor', 'admin'] },
  { label: 'Archivo Fiscalización', path: '/supervisor/fiscalizacion', icon: ShieldCheck, roles: ['supervisor', 'admin'] },

  // ── Admin only ─────────────────────────────────────────────
  { label: 'Usuarios',         path: '/admin/users',          icon: Users,           roles: ['admin'] },
  { label: 'Configuración',    path: '/admin/settings',       icon: Settings,        roles: ['admin'] },
  { label: 'Suscripción',      path: '/admin/subscription',   icon: CreditCard,      roles: ['admin'] },
]

export default function Sidebar({ onClose }: { onClose: () => void }) {
  const { profile, tenant, signOut } = useAuth()
  const navigate = useNavigate()

  const filteredItems = NAV_ITEMS.filter(item =>
    profile && item.roles.includes(profile.role)
  )

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const roleLabel = { admin: 'Administrador', supervisor: 'Supervisor', operator: 'Operador' }

  return (
    <div className="flex flex-col h-full bg-brand-700 text-white">
      {/* Logo / Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-brand-700 font-bold text-sm">R</span>
            </div>
            <span className="font-bold text-lg tracking-tight">RestoBPM</span>
          </div>
          <p className="text-white/50 text-xs mt-1 pl-10 truncate max-w-[160px]">
            {tenant?.name ?? 'Cargando...'}
          </p>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-white/10">
          <X size={18} />
        </button>
      </div>

      {/* Usuario */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
        <p className="text-sm font-medium truncate">{profile?.full_name}</p>
        <span className="text-xs text-white/60">
          {profile?.role ? roleLabel[profile.role] : ''}
        </span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )
}
