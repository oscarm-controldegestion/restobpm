import { useState } from 'react'
import { User, Lock, Building2, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Tab = 'perfil' | 'password' | 'establecimiento'

export default function Settings() {
  const { profile, tenant, refreshProfile } = useAuth()
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
    name:    tenant?.name    ?? '',
    address: tenant?.address ?? '',
    phone:   tenant?.phone   ?? '',
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
        name:    local.name.trim(),
        address: local.address.trim() || null,
        phone:   local.phone.trim()   || null,
      })
      .eq('id', tenant!.id)

    if (error) {
      setMsgLocal({ ok: false, text: 'No se pudo guardar. Intenta de nuevo.' })
    } else {
      setMsgLocal({ ok: true, text: 'Datos del establecimiento actualizados.' })
    }
    setSavingLocal(false)
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'perfil',          label: 'Mi Perfil',       icon: User      },
    { id: 'password',        label: 'Contraseña',      icon: Lock      },
    { id: 'establecimiento', label: 'Establecimiento', icon: Building2 },
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Datos del establecimiento</h2>
          <p className="text-xs text-gray-400 mb-5">Esta información aparece en los reportes generados.</p>
          <form onSubmit={handleSaveLocal} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del local *</label>
              <input
                required
                value={local.name}
                onChange={e => setLocal({ ...local, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ej: Rico Pollo Chile S.A."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dirección</label>
              <input
                value={local.address}
                onChange={e => setLocal({ ...local, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Av. Principal 123, Santiago"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
              <input
                value={local.phone}
                onChange={e => setLocal({ ...local, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="+56 2 1234 5678"
              />
            </div>

            {msgLocal && <Msg m={msgLocal} />}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingLocal}
                className="px-5 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900 disabled:opacity-60 transition-colors"
              >
                {savingLocal ? 'Guardando…' : 'Guardar datos'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
