import { useState } from 'react'
import { User, Lock, Building2, CheckCircle, AlertCircle, Users, Pencil, Trash2, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useWorkers } from '@/hooks/usePlanillas'
import type { WorkerShift } from '@/types'

type Tab = 'perfil' | 'password' | 'establecimiento' | 'trabajadores'

export default function Settings() {
  const { profile, tenant, refreshProfile, refreshTenant } = useAuth()
  const [tab, setTab] = useState<Tab>('perfil')

  // ── Estado perfil ──
  const [perfil, setPerfil] = useState({
    full_name: profile?.full_name ?? '',
    phone:     profile?.phone     ?? '',
    rut:       profile?.rut       ?? '',
  })
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [msgPerfil, setMsgPerfil]       = useState<{ ok: boolean; text: string } | null>(null)

  // ── Estado contraseña ──
  const [pwd, setPwd] = useState({ nueva: '', confirmar: '' })
  const [savingPwd, setSavingPwd]   = useState(false)
  const [msgPwd, setMsgPwd]         = useState<{ ok: boolean; text: string } | null>(null)

  // ── Estado establecimiento ──
  const [local, setLocal] = useState({
    name:                 tenant?.name                 ?? '',
    rut:                  tenant?.rut                  ?? '',
    address:              tenant?.address              ?? '',
    city:                 tenant?.city                 ?? '',
    phone:                tenant?.phone                ?? '',
    email:                tenant?.email                ?? '',
    resolucion_sanitaria: tenant?.resolucion_sanitaria ?? '',
    responsible_bpm:      tenant?.responsible_bpm      ?? '',
    cargo_responsable:    tenant?.cargo_responsable     ?? 'Encargado BPM',
  })
  const [savingLocal, setSavingLocal] = useState(false)
  const [msgLocal, setMsgLocal]       = useState<{ ok: boolean; text: string } | null>(null)

  // ── Guardar perfil ──────────────────────────────────────────────────────────
  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPerfil(true)
    setMsgPerfil(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: perfil.full_name.trim(),
        phone:     perfil.phone.trim() || null,
        rut:       perfil.rut.trim()   || null,
      })
      .eq('id', profile!.id)

    if (error) {
      setMsgPerfil({ ok: false, text: 'No se pudo guardar. Intenta de nuevo.' })
    } else {
      await refreshProfile()
      setMsgPerfil({ ok: true, text: 'Perfil actualizado correctamente.' })
    }
    setSavingPerfil(false)
  }

  // ── Cambiar contraseña ──────────────────────────────────────────────────────
  const handleSavePwd = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsgPwd(null)

    if (pwd.nueva.length < 8) {
      setMsgPwd({ ok: false, text: 'La contraseña debe tener al menos 8 caracteres.' })
      return
    }
    if (pwd.nueva !== pwd.confirmar) {
      setMsgPwd({ ok: false, text: 'Las contraseñas no coinciden.' })
      return
    }

    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: pwd.nueva })

    if (error) {
      setMsgPwd({ ok: false, text: 'No se pudo cambiar la contraseña. Intenta de nuevo.' })
    } else {
      setMsgPwd({ ok: true, text: 'Contraseña actualizada correctamente.' })
      setPwd({ nueva: '', confirmar: '' })
    }
    setSavingPwd(false)
  }

  // ── Guardar establecimiento ─────────────────────────────────────────────────
  const handleSaveLocal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingLocal(true)
    setMsgLocal(null)

    const { error } = await supabase
      .from('tenants')
      .update({
        name:                 local.name.trim(),
        rut:                  local.rut.trim()                  || null,
        address:              local.address.trim()              || null,
        city:                 local.city.trim()                 || null,
        phone:                local.phone.trim()                || null,
        email:                local.email.trim()                || null,
        resolucion_sanitaria: local.resolucion_sanitaria.trim() || null,
        responsible_bpm:      local.responsible_bpm.trim()      || null,
        cargo_responsable:    local.cargo_responsable.trim()    || null,
      })
      .eq('id', tenant!.id)

    if (error) {
      setMsgLocal({ ok: false, text: 'No se pudo guardar. Intenta de nuevo.' })
    } else {
      await refreshTenant()
      setMsgLocal({ ok: true, text: 'Datos del establecimiento actualizados. Los documentos ya reflejan los cambios.' })
    }
    setSavingLocal(false)
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  // ── Workers state ──────────────────────────────────────────────────────────
  const { workers, addWorker, updateWorker, deactivateWorker } = useWorkers()
  const [wForm, setWForm] = useState({ name: '', rut: '', shift: 'AM' as WorkerShift })
  const [wEditing, setWEditing] = useState<string | null>(null)
  const [wSaving, setWSaving]   = useState(false)
  const [wMsg, setWMsg]         = useState<{ ok: boolean; text: string } | null>(null)

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wForm.name.trim() || !wForm.rut.trim()) return
    setWSaving(true)
    const result = await addWorker(wForm.name.trim(), wForm.rut.trim(), wForm.shift)
    setWSaving(false)
    if (result) {
      setWForm({ name: '', rut: '', shift: 'AM' })
      setWMsg({ ok: true, text: 'Trabajador agregado.' })
    } else {
      setWMsg({ ok: false, text: 'Error al guardar. Intenta nuevamente.' })
    }
    setTimeout(() => setWMsg(null), 3000)
  }

  const handleUpdateWorker = async (id: string) => {
    setWSaving(true)
    await updateWorker(id, { name: wForm.name.trim(), rut: wForm.rut.trim(), shift: wForm.shift })
    setWSaving(false)
    setWEditing(null)
    setWForm({ name: '', rut: '', shift: 'AM' })
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'perfil',          label: 'Mi Perfil',       icon: User      },
    { id: 'password',        label: 'Contraseña',      icon: Lock      },
    { id: 'establecimiento', label: 'Establecimiento', icon: Building2 },
    { id: 'trabajadores',    label: 'Trabajadores',    icon: Users     },
  ]

  function Msg({ m }: { m: { ok: boolean; text: string } }) {
    const Icon = m.ok ? CheckCircle : AlertCircle
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${m.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
        <Icon size={15} />
        {m.text}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tu perfil y los datos del establecimiento</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab: Mi Perfil ── */}
      {tab === 'perfil' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Datos personales</h2>
          <p className="text-xs text-gray-400 mb-5">Administrador del establecimiento — titular del servicio.</p>
          <form onSubmit={handleSavePerfil} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
              <input
                required
                value={perfil.full_name}
                onChange={e => setPerfil({ ...perfil, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">RUT</label>
              <input
                value={perfil.rut}
                onChange={e => setPerfil({ ...perfil, rut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="12.345.678-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
              <input
                value={perfil.phone}
                onChange={e => setPerfil({ ...perfil, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="+56 9 1234 5678"
              />
            </div>

            {msgPerfil && <Msg m={msgPerfil} />}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPerfil}
                className="px-5 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900 disabled:opacity-60 transition-colors"
              >
                {savingPerfil ? 'Guardando…' : 'Guardar perfil'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab: Contraseña ── */}
      {tab === 'password' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Cambiar contraseña</h2>
          <p className="text-xs text-gray-400 mb-5">Mínimo 8 caracteres.</p>
          <form onSubmit={handleSavePwd} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña *</label>
              <input
                required
                type="password"
                value={pwd.nueva}
                onChange={e => setPwd({ ...pwd, nueva: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar contraseña *</label>
              <input
                required
                type="password"
                value={pwd.confirmar}
                onChange={e => setPwd({ ...pwd, confirmar: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="••••••••"
              />
            </div>

            {msgPwd && <Msg m={msgPwd} />}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPwd}
                className="px-5 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900 disabled:opacity-60 transition-colors"
              >
                {savingPwd ? 'Cambiando…' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab: Establecimiento ── */}
      {tab === 'establecimiento' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div>
            <h2 className="font-semibold text-gray-800 mb-1">Datos del establecimiento</h2>
            <p className="text-xs text-gray-400">
              Esta información se imprime automáticamente en todos los documentos BPM,
              procedimientos operativos (POE/POES) y reportes de fiscalización.
              Completa todos los campos para que los documentos queden correctamente identificados.
            </p>
          </div>

          <form onSubmit={handleSaveLocal} className="space-y-5">
            {/* ── Bloque 1: Identidad legal ── */}
            <div className="border border-gray-100 rounded-lg p-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Identidad legal</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Razón social / Nombre del local *</label>
                <input
                  required
                  value={local.name}
                  onChange={e => setLocal({ ...local, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej: Restaurante El Rincón S.P.A."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">RUT del establecimiento</label>
                <input
                  value={local.rut}
                  onChange={e => setLocal({ ...local, rut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="76.123.456-7"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  N° Resolución Sanitaria
                  <span className="ml-1 text-gray-400 font-normal">(aparece en documentos BPM y fiscalización)</span>
                </label>
                <input
                  value={local.resolucion_sanitaria}
                  onChange={e => setLocal({ ...local, resolucion_sanitaria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej: RS-2024-00123 / SEREMI RM"
                />
              </div>
            </div>

            {/* ── Bloque 2: Ubicación y contacto ── */}
            <div className="border border-gray-100 rounded-lg p-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ubicación y contacto</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
                <input
                  value={local.address}
                  onChange={e => setLocal({ ...local, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Av. Principal 123, Of. 2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ciudad / Comuna</label>
                <input
                  value={local.city}
                  onChange={e => setLocal({ ...local, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ej: Las Condes, Santiago"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                  <input
                    value={local.phone}
                    onChange={e => setLocal({ ...local, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="+56 2 1234 5678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Correo electrónico</label>
                  <input
                    type="email"
                    value={local.email}
                    onChange={e => setLocal({ ...local, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="contacto@milocal.cl"
                  />
                </div>
              </div>
            </div>

            {/* ── Bloque 3: Responsable BPM ── */}
            <div className="border border-gray-100 rounded-lg p-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Responsable BPM
                <span className="ml-1 text-gray-400 font-normal normal-case">— firma los documentos ante fiscalización</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del responsable</label>
                  <input
                    value={local.responsible_bpm}
                    onChange={e => setLocal({ ...local, responsible_bpm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Ej: Juan Pérez González"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                  <input
                    value={local.cargo_responsable}
                    onChange={e => setLocal({ ...local, cargo_responsable: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Ej: Jefe de Cocina / Encargado BPM"
                  />
                </div>
              </div>
            </div>

            {msgLocal && <Msg m={msgLocal} />}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingLocal}
                className="px-5 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900 disabled:opacity-60 transition-colors"
              >
                {savingLocal ? 'Guardando…' : 'Guardar datos del establecimiento'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ── Tab: Trabajadores ── */}
      {tab === 'trabajadores' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Manipuladores de alimentos</h2>
            <p className="text-xs text-gray-400 mb-5">
              Los trabajadores registrados aquí aparecen como filas en la planilla de Higiene de Manipuladores.
            </p>

            {/* Add / Edit form */}
            <form
              onSubmit={wEditing ? (e) => { e.preventDefault(); handleUpdateWorker(wEditing) } : handleAddWorker}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6"
            >
              <input
                required
                placeholder="Nombre completo *"
                value={wForm.name}
                onChange={e => setWForm(f => ({ ...f, name: e.target.value }))}
                className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                required
                placeholder="RUT (ej: 12.345.678-9) *"
                value={wForm.rut}
                onChange={e => setWForm(f => ({ ...f, rut: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex gap-2">
                <select
                  value={wForm.shift}
                  onChange={e => setWForm(f => ({ ...f, shift: e.target.value as WorkerShift }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                  <option value="Ambos">Ambos</option>
                </select>
                <button
                  type="submit"
                  disabled={wSaving}
                  className="px-3 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900 disabled:opacity-60 transition-colors flex items-center gap-1"
                >
                  {wEditing ? <CheckCircle size={15} /> : <Plus size={15} />}
                  {wEditing ? 'OK' : 'Agregar'}
                </button>
                {wEditing && (
                  <button
                    type="button"
                    onClick={() => { setWEditing(null); setWForm({ name: '', rut: '', shift: 'AM' }) }}
                    className="px-3 py-2 border border-gray-300 text-gray-500 text-sm rounded-lg hover:bg-gray-50"
                  >
                    ✕
                  </button>
                )}
              </div>
            </form>

            {wMsg && <Msg m={wMsg} />}

            {/* Worker list */}
            {workers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No hay trabajadores registrados aún.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {workers.map((w, idx) => (
                  <div key={w.id} className="flex items-center gap-3 py-3">
                    <span className="text-gray-400 text-xs w-6 text-right font-mono">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{w.name}</p>
                      <p className="text-xs text-gray-400">{w.rut}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      w.shift === 'AM' ? 'bg-blue-100 text-blue-700' :
                      w.shift === 'PM' ? 'bg-orange-100 text-orange-700' :
                                         'bg-purple-100 text-purple-700'
                    }`}>{w.shift}</span>
                    <button
                      onClick={() => {
                        setWEditing(w.id)
                        setWForm({ name: w.name, rut: w.rut, shift: w.shift })
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { if (confirm(`¿Eliminar a ${w.name}?`)) deactivateWorker(w.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
