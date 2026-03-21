import { Menu, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { tenant } = useAuth()
  const today = format(new Date(), "EEEE dd 'de' MMMM", { locale: es })

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
        <div>
          <p className="text-sm font-semibold text-gray-800 capitalize">{today}</p>
          <p className="text-xs text-gray-400 hidden sm:block">{tenant?.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-600" />
          {/* badge de notificaciones */}
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
