import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ShieldCheck, Clock, Check, Zap, Star, Building2, MessageCircle, LogOut } from 'lucide-react'
import { PRICING_PLANS } from '@/types'
import type { SubscriptionPlan } from '@/types'

function formatCLP(n: number) {
  return '$' + n.toLocaleString('es-CL')
}

const PLAN_ICON: Record<string, typeof Check> = {
  inicial:    Zap,
  total:      Star,
  sucursales: Building2,
}

export default function TrialExpired() {
  const { tenant, signOut } = useAuth()

  const handleUpgrade = (_planId: SubscriptionPlan) => {
    // TODO: Conectar con MercadoPago / Transbank
    alert('¡Próximamente! Nuestro equipo te contactará para procesar el pago.')
  }

  const paidPlans = PRICING_PLANS.filter(p => p.id !== 'trial')

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-4 border border-white/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">RestoBPM</h1>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-6 py-4 mt-2 max-w-md">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock size={18} className="text-amber-300" />
              <span className="font-semibold text-white">Tu período de prueba ha terminado</span>
            </div>
            <p className="text-white/70 text-sm">
              {tenant?.name && <><strong className="text-white">{tenant.name}</strong> — </>}
              Elige un plan para continuar usando RestoBPM y mantener todos tus registros BPM.
            </p>
          </div>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {paidPlans.map(plan => {
            const Icon = PLAN_ICON[plan.id] ?? Zap
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl flex flex-col overflow-hidden shadow-lg transition-transform hover:scale-[1.02] ${
                  plan.highlighted ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-amber-400 text-amber-900 text-xs font-bold text-center py-1.5 tracking-wide uppercase">
                    ★ Más popular
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${plan.highlighted ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon size={18} />
                  </div>

                  <h3 className="font-bold text-gray-800 text-base">{plan.name}</h3>
                  <div className="mt-1 mb-4">
                    <span className="text-2xl font-extrabold text-gray-900">{formatCLP(plan.price)}</span>
                    <span className="text-xs text-gray-400 ml-1">/mes + IVA</span>
                  </div>

                  {/* Limits chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {plan.maxBranches === 1 ? '1 sucursal' : `${plan.maxBranches} sucursales`}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {plan.maxOperators + plan.maxSupervisors} usuarios
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {plan.maxModules === -1 ? 'Todos los módulos' : `${plan.maxModules} módulos`}
                    </span>
                  </div>

                  <ul className="space-y-1.5 flex-1 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                        <Check size={12} className="text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {plan.addons?.map(a => (
                      <li key={a} className="flex items-start gap-2 text-xs text-indigo-500">
                        <Zap size={11} className="shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      plan.highlighted
                        ? 'bg-brand-700 hover:bg-brand-900 text-white shadow-md hover:shadow-lg'
                        : 'bg-gray-900 hover:bg-gray-700 text-white'
                    }`}
                  >
                    <Zap size={14} />
                    Contratar ahora
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Contact + signout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-5 py-3 flex items-center gap-3 text-white text-sm">
            <MessageCircle size={16} className="text-white/70 shrink-0" />
            <span className="text-white/80">¿Tienes dudas? <a href="mailto:contacto@restobpm.cl" className="text-white font-semibold underline">contacto@restobpm.cl</a></span>
          </div>

          <button
            onClick={signOut}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          © {new Date().getFullYear()} RestoBPM · D.S. 977/96 RSA Chile
        </p>
      </div>
    </div>
  )
}
