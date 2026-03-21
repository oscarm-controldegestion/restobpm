import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const { user, profile, isSuperAdmin, loading: authLoading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
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
            <p className="text-xs text-gray-400">
              ¿Problemas para ingresar? Contacta al administrador de tu establecimiento.
            </p>
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-brand-700 hover:underline font-semibold">
                Regístrate gratis — 3 días de prueba
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} RestoBPM · D.S. 977/96 RSA Chile
        </p>
      </div>
    </div>
  )
}
