import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, ShieldCheck, Mail, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const { user, profile, isSuperAdmin, loading: authLoading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [resetMode, setResetMode]     = useState(false)
  const [resetSent, setResetSent]     = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // Redirigir si ya hay sesión activa
  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (isSuperAdmin) { navigate('/superadmin/dashboard', { replace: true }); return }
    if (profile?.role === 'admin')      navigate('/admin/dashboard',      { replace: true })
    else if (profile?.role === 'supervisor') navigate('/supervisor/dashboard', { replace: true })
    else if (profile?.role === 'operator')   navigate('/operator/home',        { replace: true })
  }, [user, profile, isSuperAdmin, authLoading, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
    }
    // Si OK: onAuthStateChange actualiza user/profile y el useEffect redirige
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) { setError('Ingresa tu correo electrónico'); return }
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    if (error) {
      setError('Error al enviar el enlace. Verifica tu correo e intenta nuevamente.')
    } else {
      setResetSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <ShieldCheck size={32} className="text-brand-700" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">RestoBPM</h1>
          <p className="text-white/60 text-sm mt-1">Control de Buenas Prácticas de Manufactura</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {resetMode ? (
            /* ── Password Reset Mode ── */
            resetSent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Revisa tu correo</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Te enviamos un enlace a <strong>{email}</strong> para restablecer tu contraseña.
                  Revisa también la carpeta de spam.
                </p>
                <button
                  onClick={() => { setResetMode(false); setResetSent(false); setError(null) }}
                  className="text-brand-700 hover:underline text-sm font-semibold flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => { setResetMode(false); setError(null) }}
                  className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 mb-4"
                >
                  <ArrowLeft size={14} /> Volver
                </button>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Recuperar contraseña</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="nombre@establecimiento.cl"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                  >
                    {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </button>
                </form>
              </>
            )
          ) : (
            /* ── Normal Login Mode ── */
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Iniciar sesión</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="nombre@establecimiento.cl"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                    <button
                      type="button"
                      onClick={() => { setResetMode(true); setError(null) }}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors text-sm mt-2"
                >
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-gray-500">
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="text-brand-700 hover:underline font-semibold">
                    Regístrate gratis — 3 días de prueba
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} RestoBPM · D.S. 977/96 RSA Chile
        </p>
      </div>
    </div>
  )
}
