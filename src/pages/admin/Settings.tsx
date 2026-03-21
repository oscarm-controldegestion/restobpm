import { useState, useEffect } from 'react'
import { Save, Building2, Phone, MapPin, Hash, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { EstablishmentType, BpmModule } from '@/types'

const ESTABLISHMENT_TYPES: { value: EstablishmentType; label: string }[] = [
  { value: 'restaurant', label: 'Restaurante / Casinos de alimentación' },
  { value: 'industry',   label: 'Industria alimentaria' },
  { value: 'casino',     label: 'Casino escolar / empresa' },
  { value: 'bakery',     label: 'Panadería / Pastelería' },
  { value: 'other',      label: 'Otro establecimiento' },
]

export default function Settings() {
  const { tenant, refreshTenant } = useAuth() as any
  const [modules, setModules]   = useState<BpmModule[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [form, setForm] = useState({
    name: '', rut: '', address: '', phone: '', type: 'restaurant' as EstablishmentType,
  })

  useEffect(() => {
    if (tenant) {
      setForm({
        name:    tenant.name    ?? '',
        rut:     tenant.rut     ?? '',
        address: tenant.address ?? '',
        phone:   tenant.phone   ?? '',
        type:    tenant.type    ?? 'restaurant',
      })
    }
    loadModules()
  }, [tenant])

  const loadModules = async () => {
    const { data } = await supabase.from('bpm_modules').select('*').order('order_index')
    setModules((data as BpmModule[]) ?? [])
    setLoading(false)
  }

  const saveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    setSaving(true)
    await supabase.from('tenants').update({
      name:    form.name,
      rut:     form.rut,
      address: form.address,
      phone:   form.phone,
      type:    form.type,
    }).eq('id', tenant.id)
    if (refreshTenant) await refreshTenant()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const toggleModule = async (mod: BpmModule) => {
    await supabase.from('bpm_modules').update({ active: !mod.active }).eq('id', mod.id)
    setModules(prev => prev.map(m => m.id === mod.id ? { ...m, active: !m.active } : m))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configuración del Establecimiento</h1>
        <p className="text-gray-500 text-sm">Datos del establecimiento y módulos BPM activos</p>
      </div>

      {/* Datos generales */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <Building2 size={18} className="text-brand-700" /> Datos del establecimiento
        </h2>
        <form onSubmit={saveGeneral} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del establecimiento *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Restaurante El Sol" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">RUT</label>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="76.123.456-7" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Av. Ejemplo 1234, Santiago" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="+56 9 1234 5678" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de establecimiento</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EstablishmentType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {ESTABLISHMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-900 disabled:opacity-60">
              <Save size={15} />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Guardado correctamente</span>}
          </div>
        </form>
      </div>

      {/* Módulos BPM */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-1">Módulos BPM activos</h2>
        <p className="text-xs text-gray-400 mb-5">Activa o desactiva módulos según las características de tu establecimiento</p>
        {loading ? (
          <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {modules.map(mod => (
              <div key={mod.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors
                ${mod.active ? 'border-brand-200 bg-brand-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm
                  ${mod.active ? 'bg-brand-700 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {mod.code}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${mod.active ? 'text-gray-800' : 'text-gray-500'}`}>{mod.name}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{mod.description}</p>
                </div>
                <button onClick={() => toggleModule(mod)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  {mod.active
                    ? <ToggleRight size={28} className="text-brand-700" />
                    : <ToggleLeft  size={28} />
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
