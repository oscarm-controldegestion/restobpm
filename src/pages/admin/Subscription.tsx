import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Check, Zap, Star, Building2, MessageCircle, CheckCircle2, XCircle, Clock, Loader2, ShieldCheck, Download, FileText, AlertTriangle } from 'lucide-react'
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
  const [contractAccepted, setContractAccepted] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

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

  // Paso 1: seleccionar plan → muestra bloque de contrato
  const handleSelectPlan = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId)
    setContractAccepted(false)
    // Scroll suave hacia el bloque de contrato
    setTimeout(() => {
      document.getElementById('contract-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  // Paso 2: ya aceptó contrato → procede al pago
  const handleUpgrade = async (planId: SubscriptionPlan) => {
    if (!tenant) return
    if (!contractAccepted) {
      document.getElementById('contract-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
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
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={!!loadingPlan}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                      selectedPlan === plan.id
                        ? 'bg-brand-700 text-white ring-2 ring-brand-700/40'
                        : plan.highlighted
                          ? 'bg-brand-700 hover:bg-brand-900 text-white'
                          : 'bg-gray-800 hover:bg-gray-900 text-white'
                    }`}
                  >
                    {selectedPlan === plan.id
                      ? <><Check size={14} />Plan seleccionado — ver contrato ↓</>
                      : <><Zap size={14} />Contratar este plan</>
                    }
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── BLOQUE DE CONTRATO — aparece al seleccionar un plan ── */}
      {selectedPlan && (
        <div id="contract-block" className="bg-white border-2 border-brand-700/30 rounded-2xl overflow-hidden shadow-md">
          {/* Header */}
          <div className="bg-[#1A3C6E] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-white" />
              <span className="font-bold text-white text-sm">
                Contrato de Términos de Uso — Plan {PRICING_PLANS.find(p => p.id === selectedPlan)?.name}
              </span>
            </div>
            <button
              onClick={() => setSelectedPlan(null)}
              className="text-white/60 hover:text-white text-xs transition-colors"
            >
              Cancelar
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Advertencia clave */}
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4">
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-blue-800 mb-1">RestoBPM — Aplicación de Apoyo al Cumplimiento del Reglamento Sanitario de los Alimentos (D.S. N° 977/96)</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    RestoBPM es una <strong>aplicación de apoyo al cumplimiento del Reglamento Sanitario de los Alimentos</strong>.
                    Permite registrar y gestionar las actividades BPM del establecimiento, pero la responsabilidad por
                    el estado sanitario, el cumplimiento normativo y cualquier consecuencia ante la{' '}
                    <strong>Autoridad Sanitaria</strong> recae <strong>exclusivamente en el titular del establecimiento</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen de obligaciones */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">Al contratar, el Cliente declara que:</p>
              <ul className="space-y-1.5">
                {[
                  'Implementará físicamente todas las medidas de higiene, temperatura y control que registre en la Plataforma.',
                  'Responderá directamente ante la SEREMI de Salud durante inspecciones, sin invocar el uso de RestoBPM como garantía de cumplimiento.',
                  'Mantendrá los documentos y carnets sanitarios físicos requeridos por el D.S. N° 977/96.',
                  'No registrará datos falsos con el propósito de presentarlos como evidencia de cumplimiento.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Descarga del contrato completo */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <FileText size={18} className="text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-800">Contrato completo disponible</p>
                <p className="text-xs text-blue-600">Lee el contrato de 10 secciones antes de aceptar.</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/contrato"
                  target="_blank"
                  className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-blue-300 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FileText size={12} />
                  Ver en línea
                </Link>
                <a
                  href="https://restobpm.cl/contrato-terminos-uso.pdf"
                  download="Contrato_TerminosUso_RestoBPM.pdf"
                  className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-blue-300 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Download size={12} />
                  Descargar PDF
                </a>
              </div>
            </div>

            {/* Checkbox de aceptación */}
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              contractAccepted
                ? 'border-green-400 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-brand-300'
            }`}>
              <div className="mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={contractAccepted}
                  onChange={e => setContractAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-700 focus:ring-brand-500 cursor-pointer"
                />
              </div>
              <span className="text-xs text-gray-600 leading-relaxed">
                He leído y acepto el{' '}
                <Link to="/contrato" target="_blank" className="text-brand-700 hover:underline font-semibold">
                  Contrato de Términos de Uso y Limitación de Responsabilidad
                </Link>{' '}
                de RestoBPM. Entiendo que RestoBPM es una <strong>aplicación de apoyo al cumplimiento
                del Reglamento Sanitario de los Alimentos</strong> y que la responsabilidad ante la Autoridad
                Sanitaria recae exclusivamente en el titular del establecimiento. Al completar el pago, esta aceptación queda
                registrada con validez de firma electrónica simple según la <strong>Ley N° 19.799</strong> y
                el pago se considerará como confirmación del contrato.
              </span>
            </label>

            {/* Botón de pago */}
            <button
              onClick={() => handleUpgrade(selectedPlan)}
              disabled={!contractAccepted || !!loadingPlan}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
                contractAccepted
                  ? 'bg-brand-700 hover:bg-brand-900 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loadingPlan === selectedPlan ? (
                <><Loader2 size={16} className="animate-spin" />Redirigiendo a MercadoPago…</>
              ) : contractAccepted ? (
                <><ShieldCheck size={16} />Acepto y procedo al pago con MercadoPago</>
              ) : (
                <>Debes aceptar el contrato para continuar</>
              )}
            </button>

            {contractAccepted && (
              <p className="text-xs text-center text-gray-400 -mt-1">
                Al completar el pago, queda registrado tu consentimiento con fecha y hora (Ley 19.799 Chile).
              </p>
            )}
          </div>
        </div>
      )}

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
