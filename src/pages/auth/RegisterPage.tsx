import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ShieldCheck, Eye, EyeOff, Building2, User, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import type { EstablishmentType } from '@/types'

const EST_TYPES: { value: EstablishmentType; label: string }[] = [
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'industry',   label: 'Industria alimentaria' },
  { value: 'casino',     label: 'Casino' },
  { value: 'bakery',     label: 'Panadería / Pastelería' },
  { value: 'other',      label: 'Otro' },
]

type Step = 1 | 2

export default function RegisterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep]       = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [showPw, setShowPw]   = useState(false)
  const [success, setSuccess] = useState(false)

  // Step 1 — Empresa
  const [companyName, setCompanyName] = useState('')
  const [companyRut,  setCompanyRut]  = useState('')
  const [address,     setAddress]     = useState('')
  const [phone,       setPhone]       = useState('')
  const [estType,     setEstType]     = useState<EstablishmentType>('restaurant')

  // Step 2 — Administrador
  const [adminName,  setAdminName]  = useState('')
  const [adminRut,   setAdminRut]   = useState('')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [password2,  setPassword2]  = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  if (user) return <Navigate to="/" replace />
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">¡Cuenta creada exitosamente!</h2>
            <p className="text-gray-500 text-sm mb-1">
              Tu período de prueba de <strong>3 días</strong> comienza ahora.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Revisa tu correo <strong>{email}</strong> para confirmar tu cuenta.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-brand-700 hover:bg-brand-900 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleStep1 = (e: FormEvent) => {
    e.preventDefault()
    if (!companyName.trim() || !companyRut.trim()) {
      setError('Nombre y RUT de la empresa son obligatorios.')
      return
    }
    setError(null)
    setStep(2)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!adminName.trim() || !email.trim() || !password) {
      setError('Nombre, correo y contraseña son obligatorios.')
      return
    }
    if (!acceptedTerms) {
      setError('Debes aceptar los Términos de Servicio y la Política de Privacidad para continuar.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: adminName.trim() } },
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Error al crear la cuenta. Intenta con otro correo.')
      setLoading(false)
      return
    }

    // 2. Crear tenant + perfil vía RPC con SECURITY DEFINER
    const { error: rpcError } = await supabase.rpc('register_new_tenant', {
      p_user_id:           authData.user.id,
      p_company_name:      companyName.trim(),
      p_company_rut:       companyRut.trim(),
      p_address:           address.trim(),
      p_phone:             phone.trim(),
      p_establishment_type: estType,
      p_admin_name:        adminName.trim(),
      p_admin_rut:         adminRut.trim(),
    })

    if (rpcError) {
      // Rollback: delete the auth user if tenant creation failed
      await supabase.auth.admin?.deleteUser?.(authData.user.id)
      setError('Error al configurar tu empresa. Por favor intenta de nuevo.')
      setLoading(false)
      return
    }

    setLoading(false)
    setSuccess(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-3">
            <ShieldCheck size={28} className="text-brand-700" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RestoBPM</h1>
          <p className="text-white/60 text-xs mt-1">Crea tu cuenta — 3 días gratis, sin tarjeta</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Steps indicator */}
          <div className="flex items-center mb-6">
            {[
              { n: 1, icon: Building2, label: 'Empresa' },
              { n: 2, icon: User,      label: 'Administrador' },
            ].map(({ n, icon: Icon, label }, i) => (
              <div key={n} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step === n ? 'bg-brand-700 text-white' : step > n ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > n ? <CheckCircle2 size={16} /> : <Icon size={15} />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${step === n ? 'text-brand-700' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < 1 && (
                  <div className={`flex-1 h-px mx-3 ${step > 1 ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* ── Paso 1: Empresa ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos del establecimiento</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del establecimiento *</label>
                  <input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    required
                    placeholder="Ej: Restaurante El Sabor"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">RUT empresa *</label>
                  <input
                    value={companyRut}
                    onChange={e => setCompanyRut(e.target.value)}
                    required
                    placeholder="76.123.456-7"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de establecimiento *</label>
                  <select
                    value={estType}
                    onChange={e => setEstType(e.target.value as EstablishmentType)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {EST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
                  <input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Av. Principal 123, Santiago"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              <button
                type="submit"
                className="w-full bg-brand-700 hover:bg-brand-900 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </form>
          )}

          {/* ── Paso 2: Administrador ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={() => { setStep(1); setError(null) }}
                  className="text-gray-400 hover:text-gray-600 transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-semibold text-gray-800">Datos del administrador</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo *</label>
                  <input
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    required
                    placeholder="Juan Pérez González"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">RUT personal</label>
                  <input
                    value={adminRut}
                    onChange={e => setAdminRut(e.target.value)}
                    placeholder="12.345.678-9"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="admin@miempresa.cl"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Mín. 8 caracteres"
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña *</label>
                  <input
                    type="password"
                    value={password2}
                    onChange={e => setPassword2(e.target.value)}
                    required
                    placeholder="Repite la contraseña"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Trial notice */}
              <div className="bg-brand-700/5 border border-brand-700/20 rounded-xl p-3 text-xs text-brand-700">
                <strong>Período de prueba gratuito:</strong> Tendrás acceso completo durante 3 días. Sin necesidad de tarjeta de crédito.
              </div>

              {/* Consent checkbox — Ley 19.628 Art.4 */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div className="mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
                  />
                </div>
                <span className="text-xs text-gray-500 leading-relaxed">
                  He leído y acepto los{' '}
                  <Link to="/terminos" target="_blank" className="text-brand-700 hover:underline font-medium">
                    Términos de Servicio
                  </Link>{' '}
                  y la{' '}
                  <Link to="/privacidad" target="_blank" className="text-brand-700 hover:underline font-medium">
                    Política de Privacidad
                  </Link>
                  {' '}de RestoBPM. Declaro que tengo autorización para registrar datos personales de mis trabajadores
                  de conformidad con la Ley N° 19.628.
                </span>
              </label>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Creando cuenta...' : '🎉 Crear cuenta gratis'}
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-400 mt-5">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-brand-700 hover:underline font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} RestoBPM · D.S. 977/96 RSA Chile
        </p>
      </div>
    </div>
  )
}
