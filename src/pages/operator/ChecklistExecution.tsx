import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, MinusCircle, HelpCircle, ChevronLeft, Send, Thermometer } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { calculateComplianceScore, generateFolio } from '@/lib/utils'
import type { BpmModule, BpmItem, ItemResult, ChecklistResponse } from '@/types'

type DraftResponse = { result: ItemResult; numeric_value?: number; notes?: string }

const RESULT_OPTIONS: { value: ItemResult; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: 'complies',      label: 'Cumple',     icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50  border-green-300' },
  { value: 'partial',       label: 'Parcial',    icon: MinusCircle,  color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300' },
  { value: 'non_compliant', label: 'No Cumple',  icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50    border-red-300' },
  { value: 'na',            label: 'N/A',        icon: HelpCircle,   color: 'text-gray-400',   bg: 'bg-gray-50   border-gray-200' },
]

export default function ChecklistExecution() {
  const { moduleCode } = useParams<{ moduleCode: string }>()
  const navigate = useNavigate()
  const { profile, tenant } = useAuth()

  const [module, setModule]       = useState<BpmModule | null>(null)
  const [items, setItems]         = useState<BpmItem[]>([])
  const [responses, setResponses] = useState<Record<string, DraftResponse>>({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [score, setScore]           = useState(0)
  const [folio, setFolio]           = useState('')

  useEffect(() => { loadModule() }, [moduleCode])

  const loadModule = async () => {
    const { data: mod } = await supabase
      .from('bpm_modules')
      .select('*, items:bpm_items(* )')
      .eq('code', moduleCode)
      .eq('active', true)
      .single()

    if (mod) {
      setModule(mod)
      const sorted = (mod.items as BpmItem[]).sort((a, b) => a.order_index - b.order_index)
      setItems(sorted)
    }
  }

  const currentItem = items[currentIdx]
  const progress    = items.length > 0 ? Math.round(((currentIdx) / items.length) * 100) : 0
  const answered    = responses[currentItem?.id ?? '']

  const setAnswer = (itemId: string, draft: DraftResponse) => {
    setResponses(prev => ({ ...prev, [itemId]: draft }))
  }

  const goNext = () => {
    if (currentIdx < items.length - 1) setCurrentIdx(i => i + 1)
  }

  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1)
  }

  const handleSubmit = async () => {
    if (!module || !tenant || !profile) return
    setSubmitting(true)

    // Calcular puntaje
    const responseList = Object.entries(responses).map(([itemId, r]) => ({
      item_id: itemId, result: r.result
    }))
    const finalScore = calculateComplianceScore(responseList)
    setScore(finalScore)

    // Obtener siguiente folio
    const { count } = await supabase
      .from('checklist_executions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
    const newFolio = generateFolio((count ?? 0) + 1)
    setFolio(newFolio)

    // Crear ejecución
    const { data: execution, error } = await supabase
      .from('checklist_executions')
      .insert({
        tenant_id:        tenant.id,
        module_id:        module.id,
        executed_by:      profile.id,
        started_at:       new Date().toISOString(),
        completed_at:     new Date().toISOString(),
        status:           'completed',
        compliance_score: finalScore,
        folio:            newFolio,
      })
      .select()
      .single()

    if (error || !execution) { setSubmitting(false); return }

    // Insertar respuestas
    const rows: Partial<ChecklistResponse>[] = Object.entries(responses).map(([itemId, r]) => ({
      execution_id:  execution.id,
      item_id:       itemId,
      result:        r.result,
      numeric_value: r.numeric_value,
      notes:         r.notes,
      responded_at:  new Date().toISOString(),
    }))
    await supabase.from('checklist_responses').insert(rows)

    // Crear no conformidades automáticamente
    const ncItems = Object.entries(responses).filter(([, r]) => r.result === 'non_compliant')
    if (ncItems.length > 0) {
      const ncs = ncItems.map(([itemId]) => ({
        tenant_id:   tenant.id,
        execution_id: execution.id,
        item_id:     itemId,
        detected_by: profile.id,
        severity:    'medium' as const,
        description: 'Detectado en checklist BPM. Requiere acción correctiva.',
        status:      'open' as const,
      }))
      await supabase.from('non_conformities').insert(ncs)
    }

    setSubmitting(false)
    setSubmitted(true)
  }

  // ── PANTALLA DE ÉXITO ──
  if (submitted) {
    const color = score >= 85 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'
    const bg    = score >= 85 ? 'bg-green-50'   : score >= 70 ? 'bg-yellow-50'    : 'bg-red-50'
    const label = score >= 85 ? 'Satisfactorio' : score >= 70 ? 'Con observaciones' : 'Incumplimiento crítico'

    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className={`w-20 h-20 ${bg} rounded-full flex items-center justify-center mb-4`}>
          <CheckCircle2 size={40} className={color} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Checklist guardado</h2>
        <p className="text-gray-500 text-sm mb-6">Folio: <span className="font-mono font-semibold text-gray-700">{folio}</span></p>

        <div className={`${bg} rounded-2xl p-6 w-full mb-6`}>
          <p className="text-5xl font-bold mb-1 text-gray-800">{score}%</p>
          <p className={`text-sm font-semibold ${color}`}>{label}</p>
          <p className="text-xs text-gray-500 mt-2">
            Registrado el {new Date().toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' })} a las {new Date().toLocaleTimeString('es-CL', { hour:'2-digit', minute:'2-digit' })} por {profile?.full_name}
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => navigate('/operator/home')}
            className="flex-1 bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm"
          >
            Volver al inicio
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            PDF
          </button>
        </div>
      </div>
    )
  }

  if (!module || items.length === 0) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto">
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-gray-800 truncate">{module.name}</h1>
          <p className="text-xs text-gray-500">{currentIdx + 1} de {items.length} controles</p>
        </div>
        <span className="text-sm font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-lg">
          {module.code}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-brand-700 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tarjeta del ítem */}
      {currentItem && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded">
              {currentItem.code}
            </span>
            <span className="text-xs text-gray-400">{currentItem.rsa_reference}</span>
          </div>

          <h3 className="font-semibold text-gray-800 mb-2">{currentItem.name}</h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{currentItem.description}</p>

          {/* Campo de valor numérico (temperatura, cloro, etc.) */}
          {currentItem.requires_value && (() => {
            const numVal = responses[currentItem.id]?.numeric_value
            const hasMin = currentItem.value_min !== undefined && currentItem.value_min !== null
            const hasMax = currentItem.value_max !== undefined && currentItem.value_max !== null
            const outOfRange = numVal !== undefined && numVal !== null && !isNaN(numVal) && (
              (hasMin && numVal < currentItem.value_min!) ||
              (hasMax && numVal > currentItem.value_max!)
            )
            return (
              <div className={`flex items-center gap-3 rounded-xl p-3 mb-4 ${outOfRange ? 'bg-red-50 border border-red-200' : 'bg-blue-50'}`}>
                <Thermometer size={18} className={outOfRange ? 'text-red-600 shrink-0' : 'text-blue-600 shrink-0'} />
                <div className="flex-1">
                  <label className={`text-xs font-medium block mb-1 ${outOfRange ? 'text-red-700' : 'text-blue-700'}`}>
                    Valor medido ({currentItem.value_unit})
                    {hasMin && ` · Rango: ${currentItem.value_min} a ${currentItem.value_max} ${currentItem.value_unit}`}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={hasMin ? currentItem.value_min : undefined}
                    max={hasMax ? currentItem.value_max : undefined}
                    value={responses[currentItem.id]?.numeric_value ?? ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value)
                      const isOutOfRange = !isNaN(val) && (
                        (hasMin && val < currentItem.value_min!) ||
                        (hasMax && val > currentItem.value_max!)
                      )
                      setAnswer(currentItem.id, {
                        ...responses[currentItem.id],
                        result: isOutOfRange ? 'non_compliant' : (responses[currentItem.id]?.result ?? 'complies'),
                        numeric_value: val
                      })
                    }}
                    className={`w-full bg-white rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                      outOfRange
                        ? 'border-red-300 focus:ring-red-400 text-red-700'
                        : 'border-blue-200 focus:ring-blue-400'
                    }`}
                    placeholder={`Ej: ${currentItem.value_min}`}
                  />
                  {outOfRange && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Valor fuera de rango permitido ({currentItem.value_min} - {currentItem.value_max} {currentItem.value_unit})
                    </p>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Opciones de resultado */}
          <div className="grid grid-cols-2 gap-2">
            {RESULT_OPTIONS.map(({ value, label, icon: Icon, color, bg }) => (
              <button
                key={value}
                onClick={() => setAnswer(currentItem.id, {
                  ...responses[currentItem.id], result: value
                })}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  answered?.result === value ? bg : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon size={18} className={answered?.result === value ? color : 'text-gray-400'} />
                <span className={answered?.result === value ? color : 'text-gray-600'}>{label}</span>
              </button>
            ))}
          </div>

          {/* Observaciones */}
          {answered && (
            <textarea
              value={answered.notes ?? ''}
              onChange={e => setAnswer(currentItem.id, { ...answered, notes: e.target.value })}
              placeholder="Observaciones (opcional)..."
              rows={2}
              className="w-full mt-3 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="flex gap-3">
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          className="px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Anterior
        </button>

        {currentIdx < items.length - 1 ? (
          <button
            onClick={goNext}
            disabled={!answered}
            className="flex-1 bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(responses).length < items.length}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? 'Guardando...' : <><Send size={16} /> Finalizar y guardar</>}
          </button>
        )}
      </div>

      {/* Resumen de respuestas */}
      {items.length > 0 && (
        <div className="flex gap-1 mt-4 flex-wrap">
          {items.map((item, idx) => {
            const r = responses[item.id]
            const dot = !r ? 'bg-gray-200'
              : r.result === 'complies' ? 'bg-green-400'
              : r.result === 'partial' ? 'bg-yellow-400'
              : r.result === 'non_compliant' ? 'bg-red-400'
              : 'bg-gray-400'
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIdx(idx)}
                className={`w-4 h-4 rounded-full transition-all ${dot} ${idx === currentIdx ? 'ring-2 ring-offset-1 ring-brand-700' : ''}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
