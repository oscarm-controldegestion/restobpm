import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Check, Zap, Star, Building2, MessageCircle, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
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
  const { tenant, refreshTenant, trialDaysLeft } = useAuth()
  const [searchParams] = useSearchParams()
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null)
  const [payResult, setPayResult] = useState<'exitoso' | 'fallido' | 'pendiente' | null>(null)

  const currentPlan = (tenant?.plan ?? 'trial') as SubscriptionPlan

  // Detectar retorno desde MercadoPago
  useEffect(() => {
    const pago = searchParams.get('pago') as typeof payResult
    if (pago) {
      setPayResult(pago)
      if (pago === 'exitoso') {
        // Refrescar tenant después de un momento (el webhook puede tardar 1-2s)
        setTimeout(() => refreshTenant(), 2000)
      }
    }
  }, [searchParams])

  const handleUpgrade = async (planId: SubscriptionPlan) => {
    if (!tenant) return
    setLoadingPlan(planId)

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { planId, tenantId: tenant.id },
      })

      if (error || !data?.init_point) {
        alert('No se pudo iniciar el proceso de pago. Por favor intenta de nuevo.')
        setLoadingPlan(null)
        return
      }

      // Redirigir a MercadoPago (sandbox_init_point en desarrollo)
      const url = data.init_point
      window.location.href = url

    } catch {
      alert('Error al conectar con el servicio de pago.')
      setLoadingPlan(null)
    }
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

      {/* Resultado de pago */}
      {payResult === 'exitoso' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">¡Pago recibido! Tu plan está siendo activado.</p>
            <p className="text-sm text-green-600 mt-0.5">En unos segundos tu cuenta se actualizará. Si no cambia, recarga la página.</p>
          </div>
        </div>
      )}
      {payResult === 'pendiente' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Pago en proceso</p>
            <p className="text-sm text-amber-600 mt-0.5">Tu pago está siendo procesado. Te notificaremos cuando se confirme.</p>
          </div>
        </div>
      )}
      {payResult === 'fallido' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">El pago no se completó</p>
            <p className="text-sm text-red-600 mt-0.5">Por favor intenta de nuevo o contacta a soporte.</p>
          </div>
        </div>
      )}

      {/* Banner trial */}
      {trialDaysLeft !== null && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Clock size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">
            {trialDaysLeft === 0
              ? 'Tu período de prueba termina hoy. Contrata un plan para continuar usando RestoBPM.'
              : `Te quedan ${trialDaysLeft} día${trialDaysLeft === 1 ? '' : 's'} de prueba gratuita.`
            }
          </p>
        </div>
      )}

      {/* Planes pagados — 3 columnas */}
      <div className="grid sm:grid-cols-3 gap-5">
        {paidPlans.map(plan => {
          const isCurrent = plan.id === currentPlan
          const isLoading = loadingPlan === plan.id
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
                    disabled={!!loadingPlan}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                      plan.highlighted
                        ? 'bg-brand-700 hover:bg-brand-900 text-white'
                        : 'bg-gray-800 hover:bg-gray-900 text-white'
                    }`}
                  >
                    {isLoading ? (
                      <><Loader2 size={14} className="animate-spin" />Redirigiendo…</>
                    ) : (
                      <><Zap size={14} />Contratar con MercadoPago</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Nota IVA + seguridad */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-xs text-gray-400">
          Precios en CLP sin IVA (19%). Facturación mensual. Cancela cuando quieras.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-green-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Pago seguro vía MercadoPago
        </div>
      </div>

      {/* Contacto */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-start gap-3">
          <MessageCircle size={18} className="text-indigo-500 shrink-0 mt-0.5" />
          <div className="text-sm text-indigo-700">
            <strong>¿Necesitas factura o tienes más de 5 sucursales?</strong>
            <p className="text-xs text-indigo-500 mt-0.5">
              Escríbenos a <a href="mailto:contacto@restobpm.cl" className="underline">contacto@restobpm.cl</a> para una propuesta a medida.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
