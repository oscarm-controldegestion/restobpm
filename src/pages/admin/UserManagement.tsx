import { useState, useEffect } from 'react'
import { UserPlus, ToggleLeft, ToggleRight, ShieldCheck, Eye, Wrench, Copy, CheckCircle2, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  admin:      { label: 'Administrador', icon: ShieldCheck, color: 'text-brand-700 bg-brand-50' },
  supervisor: { label: 'Supervisor',    icon: Eye,         color: 'text-purple-700 bg-purple-50' },
  operator:   { label: 'Operador',      icon: Wrench,      color: 'text-orange-700 bg-orange-50' },
}

interface NewUserResult {
  name: string
  email: string
  tempPassword: string
}

export default function UserManagement() {
  const { tenant } = useAuth()
  const [users, setUsers]     = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState({ full_name: '', rut: '', email: '', role: 'operator' as UserRole })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [newUser, setNewUser] = useState<NewUserResult | null>(null)
  const [copied, setCopied]   = useState(false)

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

    const { data, error: fnError } = await supabase.functions.invoke('create-tenant-user', {
      body: {
        email:    form.email.trim().toLowerCase(),
        fullName: form.full_name.trim(),
        rut:      form.rut.trim(),
        role:     form.role,
        tenantId: tenant!.id,
      },
    })

    if (fnError || data?.error) {
      setError(data?.error ?? 'No se pudo crear el usuario. Intenta de nuevo.')
      setSaving(false)
      return
    }

    // Mostrar contraseña temporal al admin
    setNewUser({
      name:         form.full_name.trim(),
      email:        form.email.trim().toLowerCase(),
      tempPassword: data.tempPassword,
    })

    await loadUsers()
    setShowForm(false)
    setForm({ full_name: '', rut: '', email: '', role: 'operator' })
    setSaving(false)
  }

  const copyPassword = async () => {
    if (!newUser) return
    await navigator.clipboard.writeText(newUser.tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm">{users.length} usuarios en tu establecimiento</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null) }}
          className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-900 transition-colors"
        >
          <UserPlus size={16} />
          Nuevo usuario
        </button>
      </div>

      {/* ── Resultado de creación: mostrar credenciales ── */}
      {newUser && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">Usuario creado exitosamente</p>
                <p className="text-sm text-green-700 mt-1">
                  Comparte estas credenciales con <strong>{newUser.name}</strong> para que pueda ingresar:
                </p>
                <div className="mt-3 bg-white border border-green-200 rounded-lg p-3 text-sm font-mono space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-24 text-xs font-sans">Correo</span>
                    <span className="text-gray-800">{newUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-24 text-xs font-sans">Contraseña</span>
                    <span className="text-gray-800 font-bold tracking-wider">{newUser.tempPassword}</span>
                    <button
                      onClick={copyPassword}
                      className="ml-2 flex items-center gap-1 text-xs text-green-700 hover:text-green-900 transition-colors"
                    >
                      {copied ? <><CheckCircle2 size={13} />Copiado</> : <><Copy size={13} />Copiar</>}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  El usuario podrá cambiar su contraseña desde su perfil después de ingresar.
                </p>
              </div>
            </div>
            <button onClick={() => setNewUser(null)} className="text-green-400 hover:text-green-600">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Formulario de creación ── */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Crear nuevo usuario</h2>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
              <input
                required
                value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Juan Pérez González"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">RUT</label>
              <input
                value={form.rut}
                onChange={e => setForm({...form, rut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="12.345.678-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="juan@establecimiento.cl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rol *</label>
              <select
                value={form.role}
                onChange={e => setForm({...form, role: e.target.value as UserRole})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="operator">Operador</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>

            <div className="sm:col-span-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
              Se generará una contraseña temporal que podrás copiar y compartir con el usuario.
            </div>

            {error && (
              <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null) }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold bg-brand-700 text-white rounded-lg hover:bg-brand-900 disabled:opacity-60"
              >
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Lista de usuarios ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aún no hay usuarios. Crea el primero.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Usuario</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 hidden sm:table-cell">RUT</th>
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
                    <td className="py-3 px-4 text-gray-500 font-mono text-xs hidden sm:table-cell">
                      {user.rut ?? '—'}
                    </td>
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
                        {user.active
                          ? <ToggleRight size={20} className="text-green-500" />
                          : <ToggleLeft size={20} />
                        }
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
