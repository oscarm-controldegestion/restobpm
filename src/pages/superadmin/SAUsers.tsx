import { useState, useEffect } from 'react'
import { Search, ShieldCheck, Eye, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UserRow {
  id: string
  full_name: string
  rut?: string
  role: string
  active: boolean
  created_at: string
  tenant_name: string
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof ShieldCheck; color: string }> = {
  admin:      { label: 'Admin',      icon: ShieldCheck, color: 'text-indigo-300 bg-indigo-900/40' },
  supervisor: { label: 'Supervisor', icon: Eye,         color: 'text-purple-300 bg-purple-900/40' },
  operator:   { label: 'Operador',   icon: Wrench,      color: 'text-orange-300 bg-orange-900/40' },
}

export default function SAUsers() {
  const [users, setUsers]   = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]  = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, tenant:tenants(name)')
      .order('created_at', { ascending: false })
    setUsers((data ?? []).map((u: any) => ({ ...u, tenant_name: u.tenant?.name ?? '—' })))
    setLoading(false)
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = u.full_name.toLowerCase().includes(q) || u.tenant_name.toLowerCase().includes(q) || (u.rut ?? '').includes(q)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Todos los usuarios</h1>
        <p className="text-gray-400 text-sm mt-1">{users.length} usuarios en la plataforma</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, empresa o RUT..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="operator">Operador</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array(6).fill(0).map((_,i) => <div key={i} className="h-10 bg-gray-700 rounded animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">No se encontraron usuarios</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Usuario</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">RUT</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Empresa</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-400">Rol</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-400">Estado</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400">Registro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const role = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.operator
                const Icon = role.icon
                return (
                  <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="py-3 px-4 font-medium text-white">{u.full_name}</td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-xs">{u.rut ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-300">{u.tenant_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
                        <Icon size={11} /> {role.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${u.active ? 'bg-green-400' : 'bg-gray-600'}`} />
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('es-CL')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
