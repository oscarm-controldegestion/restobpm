import { Check, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatCLP } from '@/lib/utils'
import { PRICING_PLANS } from '@/types'
import type { SubscriptionPlan } from '@/types'

export default function Subscription() {
  const { tenant } = useAuth()
  const currentPlan = tenant?.plan ?? 'free'

  const handleUpgrade = (planId: SubscriptionPlan) => {
    // TODO: Conectar con Stripe Checkout o MercadoPago
    alert(`Redirigiendo a pago del plan ${planId}...`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Suscripción</h1>
        <p className="text-gray-500 text-sm">Plan actual: <span className="font-semibold capitalize">{currentPlan}</span></p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRICING_PLANS.map(plan => {
          const isCurrent = plan.id === currentPlan
          return (
            <div key={plan.id} className={`bg-white rounded-2xl border-2 p-5 flex flex-col shadow-sm ${isCurrent ? 'border-brand-700' : 'border-gray-100'}`}>
              {isCurrent && (
                <span className="text-xs font-bold bg-brand-700 text-white px-2 py-0.5 rounded-full self-start mb-3">
                  Plan actual
                </span>
              )}
              <h3 className="font-bold text-gray-800 text-lg">{plan.name}</h3>
              <div className="my-3">
                {plan.price === 0 ? (
                  <p className="text-3xl font-bold text-gray-800">Gratis</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-800">{formatCLP(plan.price)}</p>
                    <p className="text-xs text-gray-400">/mes + IVA</p>
                  </>
                )}
              </div>
              <ul className="space-y-2 flex-1 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check size={13} className="text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className="w-full flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-900 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Zap size={14} />
                  Contratar
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 border border-blue-100">
        <strong>¿Necesitas más?</strong> Contáctanos para planes personalizados para cadenas de restaurantes o empresas de alimentación colectiva con múltiples sucursales.
      </div>
    </div>
  )
}
