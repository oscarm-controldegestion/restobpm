import { useState, useEffect } from 'react'
import { Search, Plus, Building2, ToggleLeft, ToggleRight, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Tenant, SubscriptionPlan } from '@/types'

const PLAN_BADGE: Record<string, string> = {
  free:       'text-gray-400 bg-gray-800 border border-gray-700',
  basic:      'text-blue-300 bg-blue-900/40 border border-blue-800',
  pro:        'text-indigo-300 bg-indigo-900/40 border border-indigo-800',
  enterprise: 'text-amber-300 bg-amber-900/40 border border-amber-800',
}

const PLAN_LABEL: Record<string, string> = {
  free: 'Gratuito', basic: 'Básico', pro: 'Profesional', enterprise: 'Empresa',
}

const TYPE_LABEL: Record<string, string> = {
  restaurant: 'Restaurante', industry: 'Industria', casino: 'Casino', bakery: 'Panadería', other: 'Otro',
}

interface TenantWithUsers extends Tenant { userCount?: number }

export default function SATenants() {
  const [tenants, setTenants]     = useState<TenantWithUsers[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [form, setForm] = useState({
    name: '', rut: '', address: '', phone: '', type: 'restaurant', plan: 'pro' as SubscriptionPlan,
  })

  useEffect(() => { loadTenants() }, [])

  const loadTenants = async () => {
    setLoading(true)
    const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
    const list = (data ?? []) as Tenant[]
    // Get user counts
    const counts = await Promise.all(list.map(async t => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', t.id)
      return { id: t.id, count: count ?? 0 }
    }))
    const countMap = Object.fromEntries(counts.map(c => [c.id, c.count]))
    setTenants(list.map(t => ({ ...t, userCount: countMap[t.id] })))
    setLoading(false)
  }

  const toggleTenant = async (t: TenantWithUsers) => {
    await supabase.from('tenants').update({ active: !t.active }).eq('id', t.id)
    setTenants(prev => prev.map(x => x.id === t.id ? { ...x, active: !x.active } : x))
  }

  const updatePlan = async (id: string, plan: SubscriptionPlan) => {
    await supabase.from('tenants').update({ plan }).eq('id', id)
    setTenants(prev => prev.map(t => t.id === id ? { ...t, plan } : t))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await supabase.from('tenants').insert({
      name: form.name, rut: form.rut || null,
      address: form.address || null, phone: form.phone || null,
      type: form.type, plan: form.plan, active: true, company_size: 'small',
    }).select().single()
    if (!error && data) {
      setTenants(prev => [{ ...data, userCount: 0 }, ...prev])
      setShowForm(false)
      setForm({ name: '', rut: '', address: '', phone: '', type: 'restaurant', plan: 'pro' })
    }
    setSaving(false)
  }

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.rut ?? '').includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Empresas</h1>
          <p className="text-gray-400 text-sm mt-1">{tenants.length} empresas registradas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700"
        >
          <Plus size={15} /> Nueva empresa
        </button>
      </div>

      {/* Formulario nueva empresa */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Registrar nueva empresa</h2>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Nombre *', placeholder: 'Restaurante El Sol', required: true },
              { key: 'rut', label: 'RUT', placeholder: '76.123.456-7', required: false },
              { key: 'address', label: 'Dirección', placeholder: 'Av. Ejemplo 123, Santiago', required: false },
              { key: 'phone', label: 'Teléfono', placeholder: '+56 9 1234 5678', required: false },
            ].map(({ key, label, placeholder, required }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                <input
                  required={required}
                  value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Plan inicial</label>
              <select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value as SubscriptionPlan })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {Object.entries(PLAN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-400 border border-gray-600 rounded-lg hover:bg-gray-700">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Creando...' : 'Crear empresa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-2.5 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o RUT..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {loading ? Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse border border-gray-700" />
        )) : filtered.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 py-16 text-center">
            <Building2 size={32} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No se encontraron empresas</p>
          </div>
        ) : filtered.map(t => {
          const isExp = expanded === t.id
          return (
            <div key={t.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-750"
                onClick={() => setExpanded(isExp ? null : t.id)}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.active ? 'bg-indigo-600/20' : 'bg-gray-700'}`}>
                  <Building2 size={16} className={t.active ? 'text-indigo-400' : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${t.active ? 'text-white' : 'text-gray-500 line-through'}`}>{t.name}</p>
                  <p className="text-xs text-gray-500">{t.rut ?? '—'} · {TYPE_LABEL[t.type] ?? t.type}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 ${PLAN_BADGE[t.plan]}`}>
                  {PLAN_LABEL[t.plan] ?? t.plan}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                  <Users size={12} />
                  {t.userCount}
                </div>
                {isExp ? <ChevronUp size={15} className="text-gray-500 shrink-0" /> : <ChevronDown size={15} className="text-gray-500 shrink-0" />}
              </div>

              {isExp && (
                <div className="border-t border-gray-700 bg-gray-900/50 p-4 space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4 text-xs">
                    <div><span className="text-gray-500">Dirección:</span><p className="text-gray-300 mt-0.5">{t.address ?? '—'}</p></div>
                    <div><span className="text-gray-500">Teléfono:</span><p className="text-gray-300 mt-0.5">{t.phone ?? '—'}</p></div>
                    <div><span className="text-gray-500">Registrada:</span><p className="text-gray-300 mt-0.5">{new Date(t.created_at).toLocaleDateString('es-CL')}</p></div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Cambiar plan */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Plan:</span>
                      <select
                        value={t.plan}
                        onChange={e => updatePlan(t.id, e.target.value as SubscriptionPlan)}
                        className="px-2.5 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {Object.entries(PLAN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>

                    {/* Toggle activo */}
                    <button
                      onClick={() => toggleTenant(t)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      {t.active
                        ? <><ToggleRight size={16} className="text-green-400" /> Activa — desactivar</>
                        : <><ToggleLeft size={16} /> Inactiva — activar</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
