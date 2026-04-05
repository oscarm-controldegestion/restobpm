import { useState, useEffect } from 'react'
import { UserPlus, Pencil, ToggleLeft, ToggleRight, ShieldCheck, Eye, Wrench } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  admin:      { label: 'Administrador', icon: ShieldCheck, color: 'text-brand-700 bg-brand-50' },
  supervisor: { label: 'Supervisor',    icon: Eye,         color: 'text-purple-700 bg-purple-50' },
  operator:   { label: 'Operador',      icon: Wrench,      color: 'text-orange-700 bg-orange-50' },
}

export default function UserManagement() {
  const { tenant } = useAuth()
  const [users, setUsers]     = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({ full_name: '', rut: '', email: '', role: 'operator' as UserRole })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    if (!tenant) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: true })
    setUsers((data as Profile[]) ?? [])
    setLoading(false)
  }

  const toggleActive = async (user: Profile) => {
    await supabase.from('profiles').update({ active: !user.active }).eq('id', user.id)
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: form.email,
      password: Math.random().toString(36).slice(-10) + 'Aa1!',
      email_confirm: true,
    })

    if (authError || !authData.user) {
      setError('No se pudo crear el usuario. Verifica que el correo no esté registrado.')
      setSaving(false)
      return
    }

    // Crear perfil
    await supabase.from('profiles').insert({
      id: authData.user.id,
      tenant_id: tenant!.id,
      full_name: form.full_name,
      rut: form.rut,
      role: form.role,
      active: true,
    })

    await loadUsers()
    setShowForm(false)
    setForm({ full_name: '', rut: '', email: '', role: 'operator' })
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm">{users.length} usuarios en tu establecimiento</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-900 transition-colors"
        >
          <UserPlus size={16} />
          Nuevo usuario
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Crear nuevo usuario</h2>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
              <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Juan Pérez González" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">RUT</label>
              <input value={form.rut} onChange={e => setForm({...form, rut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="12.345.678-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico *</label>
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="juan@establecimiento.cl" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rol *</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="operator">Operador</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-brand-700 text-white rounded-lg hover:bg-brand-900 disabled:opacity-60">
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Usuario</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">RUT</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Rol</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Estado</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const role = ROLE_CONFIG[user.role]
                const Icon = role.icon
                return (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{user.full_name}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs">{user.rut ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
                        <Icon size={12} />
                        {role.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleActive(user)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title={user.active ? 'Desactivar' : 'Activar'}
                      >
                        {user.active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                      </button>
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
