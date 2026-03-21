import { Check, Zap, Star, Building2, MessageCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { PRICING_PLANS } from '@/types'
import type { SubscriptionPlan } from '@/types'

function formatCLP(n: number) {
  return '$' + n.toLocaleString('es-CL')
}

const PLAN_ICON: Record<string, typeof Check> = {
  trial:      MessageCircle,
  inicial:    Zap,
  total:      Star,
  sucursales: Building2,
}

export default function Subscription() {
  const { tenant } = useAuth()
  const currentPlan = (tenant?.plan ?? 'trial') as SubscriptionPlan

  const handleUpgrade = (planId: SubscriptionPlan) => {
    // TODO: Conectar con MercadoPago / Transbank
    alert(`Redirigiendo a pago del plan ${planId}…`)
  }

  const paidPlans = PRICING_PLANS.filter(p => p.id !== 'trial')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Suscripción</h1>
        <p className="text-gray-500 text-sm">
          Plan actual:{' '}
          <span className="font-semibold">
            {PRICING_PLANS.find(p => p.id === currentPlan)?.name ?? currentPlan}
          </span>
        </p>
      </div>

      {/* Planes pagados — 3 columnas */}
      <div className="grid sm:grid-cols-3 gap-5">
        {paidPlans.map(plan => {
          const isCurrent = plan.id === currentPlan
          const Icon = PLAN_ICON[plan.id] ?? Zap
          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl flex flex-col shadow-sm transition-shadow hover:shadow-md ${
                plan.highlighted
                  ? 'border-2 border-brand-700 ring-1 ring-brand-700/20'
                  : 'border border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    Más popular
                  </span>
                </div>
              )}

              <div className={`p-5 rounded-t-2xl ${plan.highlighted ? 'bg-brand-700/5' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.highlighted ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon size={16} />
                  </div>
                  {isCurrent && (
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Plan actual
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-gray-800 text-base">{plan.name}</h3>

                <div className="mt-2">
                  <span className="text-3xl font-extrabold text-gray-900">{formatCLP(plan.price)}</span>
                  <span className="text-xs text-gray-400 ml-1">/mes + IVA</span>
                </div>

                {/* Límites rápidos */}
                <div className="mt-3 flex flex-wrap gap-2">
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
              </div>

              {/* Features */}
              <div className="p-5 flex-1 space-y-2">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check size={13} className="text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}

                {plan.addons && plan.addons.length > 0 && (
                  <>
                    <div className="pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Servicios opcionales
                    </div>
                    {plan.addons.map(a => (
                      <div key={a} className="flex items-start gap-2 text-xs text-indigo-600">
                        <Zap size={12} className="shrink-0 mt-0.5" />
                        {a}
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="p-5 pt-0">
                {isCurrent ? (
                  <div className="w-full text-center py-2.5 text-sm font-semibold text-green-700 bg-green-50 rounded-xl border border-green-200">
                    Plan activo
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? 'bg-brand-700 hover:bg-brand-900 text-white'
                        : 'bg-gray-800 hover:bg-gray-900 text-white'
                    }`}
                  >
                    <Zap size={14} />
                    Contratar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Nota IVA */}
      <p className="text-xs text-gray-400 text-center">
        Todos los precios expresados en pesos chilenos (CLP) sin IVA (19%). Facturación mensual.
      </p>

      {/* Contacto */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-start gap-3">
          <MessageCircle size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-700">
            <strong>¿Tienes más de 5 sucursales o necesitas algo personalizado?</strong>
            <p className="text-xs text-indigo-500 mt-0.5">
              Contáctanos para una propuesta a medida para cadenas de restaurantes o empresas de alimentación colectiva.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
