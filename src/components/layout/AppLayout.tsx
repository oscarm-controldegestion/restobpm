import { Outlet, Link } from 'react-router-dom'
import { useState } from 'react'
import { Clock, Zap } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '@/contexts/AuthContext'

function TrialBanner() {
  const { trialDaysLeft } = useAuth()
  if (trialDaysLeft === null) return null

  const urgent = trialDaysLeft <= 1

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium ${
      urgent ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
    }`}>
      <div className="flex items-center gap-2">
        <Clock size={13} className="shrink-0" />
        {trialDaysLeft === 0
          ? 'Tu período de prueba termina hoy.'
          : `Tu período de prueba termina en ${trialDaysLeft} día${trialDaysLeft === 1 ? '' : 's'}.`
        }
      </div>
      <Link
        to="/admin/subscription"
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
          urgent ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-white text-amber-600 hover:bg-amber-50'
        }`}
      >
        <Zap size={11} />
        Contratar plan
      </Link>
    </div>
  )
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar móvil (overlay) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TrialBanner />
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
