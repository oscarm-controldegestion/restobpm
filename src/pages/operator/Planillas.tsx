import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ClipboardList, ChevronRight, ArrowLeft, PenLine, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  usePlanillaTemplates,
  usePlanillaMonths,
  usePlanillaItemsForMonth,
  usePlanillaEntries,
  signPlanillaMonth,
  updateMonthStatus,
} from '@/hooks/usePlanillas'
import PlanillaGrid from '@/components/planilla/PlanillaGrid'
import ChecklistView from '@/components/planilla/ChecklistView'
import HigieneManipuladoresView from '@/components/planilla/HigieneManipuladoresView'
import type { PlanillaMonth, TimeSlot } from '@/types'

const MONTH_NAMES = [
  '', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

const STATUS_CONFIG = {
  pending:     { label: 'Pendiente',  color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: 'En curso',   color: 'bg-blue-100 text-blue-700' },
  completed:   { label: 'Completada', color: 'bg-green-100 text-green-700' },
  signed:      { label: 'Firmada',    color: 'bg-purple-100 text-purple-700' },
}

// ── Signature pad ─────────────────────────────────────────────────────────────
function SignaturePad({ onSign, onCancel }: { onSign: (sig: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing   = useRef(false)

  const startDraw = (e: React.PointerEvent) => {
    drawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    const rect = canvasRef.current!.getBoundingClientRect()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }
  const draw = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const rect = canvasRef.current!.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#1A252F'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke()
  }
  const endDraw = () => { drawing.current = false }
  const clear   = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }
  const confirm = () => onSign(canvasRef.current?.toDataURL('image/png') ?? '')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">Firma Digital</h3>
          <p className="text-sm text-gray-500 mt-1">Dibuja tu firma para certificar esta planilla</p>
        </div>
        <div className="p-4">
          <canvas
            ref={canvasRef} width={400} height={160}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 touch-none cursor-crosshair"
            onPointerDown={startDraw} onPointerMove={draw} onPointerUp={endDraw} onPointerLeave={endDraw}
          />
        </div>
        <div className="p-4 flex gap-3 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={clear} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Limpiar</button>
          <button onClick={confirm} className="flex-1 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-900">Firmar planilla</button>
        </div>
      </div>
    </div>
  )
}

// ── Detail (grid + sign) ──────────────────────────────────────────────────────
function PlanillaDetail({
  planillaMonth, onBack, onSigned,
}: {
  planillaMonth: PlanillaMonth
  onBack: () => void
  onSigned: () => void
}) {
  const { profile } = useAuth()
  const { items, loading: loadingItems }             = usePlanillaItemsForMonth(planillaMonth.id, planillaMonth.template_id)
  const { entryMap, tempMap, complianceMTMap, setValue, setNumericValue, setTempClosed, setComplianceMTValue, entries } = usePlanillaEntries(planillaMonth.id)
  const [showSign, setShowSign] = useState(false)
  const [signing, setSigning]   = useState(false)
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null)

  const isSigned   = planillaMonth.status === 'signed'
  const isReadonly = isSigned || planillaMonth.status === 'completed'

  const handleSetValue = async (itemId: string, day: number, value: import('@/types').PlanillaValue | null) => {
    await setValue(itemId, day, value)
    if (planillaMonth.status === 'pending') {
      await updateMonthStatus(planillaMonth.id, 'in_progress')
    }
  }

  const handleSetNumeric = async (itemId: string, day: number, slot: TimeSlot, value: number | null) => {
    await setNumericValue(itemId, day, slot, value)
    if (planillaMonth.status === 'pending') {
      await updateMonthStatus(planillaMonth.id, 'in_progress')
    }
  }

  const handleSetCMT = async (itemId: string, day: number, slot: TimeSlot, value: import('@/types').PlanillaValue | null) => {
    await setComplianceMTValue(itemId, day, slot, value)
    if (planillaMonth.status === 'pending') {
      await updateMonthStatus(planillaMonth.id, 'in_progress')
    }
  }

  const daysInMonth  = new Date(planillaMonth.year, planillaMonth.month, 0).getDate()
  const compItems    = items.filter(i => i.value_type === 'compliance')
  const tempItems    = items.filter(i => i.value_type === 'temperature')
  const cmtItems     = items.filter(i => i.value_type === 'compliance_mt')
  const isTemperature  = tempItems.length > 0 && compItems.length === 0 && cmtItems.length === 0
  const isComplianceMT = cmtItems.length > 0 && compItems.length === 0 && tempItems.length === 0
  // Monthly checklist mode: all items have frequency='monthly'
  const isMonthlyChecklist = items.length > 0 && items.every(i => i.frequency === 'monthly')
  // Worker hygiene grid mode
  const isWorkerHygiene = planillaMonth.template?.layout_type === 'worker_hygiene'

  // Compliance indicators
  const totalCells  = compItems.length * daysInMonth
  const filledCells = entries.filter(e => e.value !== null && e.time_slot === null).length
  const cCells      = entries.filter(e => e.value === 'C' && e.time_slot === null).length
  const compliance  = filledCells > 0 ? Math.round((cCells / filledCells) * 100) : 0

  // Temperature indicators (each item × 2 slots × days)
  const tempItemIds     = new Set(tempItems.map(i => i.id))
  const totalTempCells  = tempItems.length * 2 * daysInMonth
  const filledTempCells = entries.filter(e => e.time_slot !== null && tempItemIds.has(e.item_id) && (e.numeric_value !== null || e.value === 'C')).length
  const tempCompliance  = totalTempCells > 0 ? Math.round((filledTempCells / totalTempCells) * 100) : 0
  const emptyTempCells  = totalTempCells - filledTempCells

  // Compliance M/T indicators (each item × 2 slots × days)
  const cmtItemIds       = new Set(cmtItems.map(i => i.id))
  const totalCMTCells    = cmtItems.length * 2 * daysInMonth
  const cmtEntries       = entries.filter(e => e.time_slot !== null && cmtItemIds.has(e.item_id) && e.value !== null)
  const filledCMTCells   = cmtEntries.length
  const cmtCumple        = cmtEntries.filter(e => e.value === 'C' || e.value === 'CL').length
  const cmtCompliance    = filledCMTCells > 0 ? Math.round((cmtCumple / filledCMTCells) * 100) : 0
  const cmtNC            = cmtEntries.filter(e => e.value === 'NC').length

  const handleSign = async (signature: string) => {
    if (!profile) return
    setSigning(true); setShowSign(false)
    const { error } = await signPlanillaMonth(planillaMonth.id, profile.id, signature)
    if (error) {
      setMsg({ ok: false, text: 'No se pudo guardar la firma. Intenta de nuevo.' })
    } else {
      setMsg({ ok: true, text: 'Planilla firmada correctamente.' })
      onSigned()
    }
    setSigning(false)
  }

  if (loadingItems) return <div className="flex items-center justify-center py-20 text-gray-400">Cargando planilla…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 text-lg leading-tight">
            {planillaMonth.template?.name}
            {planillaMonth.label ? ` — ${planillaMonth.label}` : ''}
          </h2>
          {!isMonthlyChecklist && (
            <p className="text-sm text-gray-500">{MONTH_NAMES[planillaMonth.month]} {planillaMonth.year}</p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CONFIG[planillaMonth.status].color}`}>
          {STATUS_CONFIG[planillaMonth.status].label}
        </span>
      </div>

      {(totalCells > 0 || totalTempCells > 0 || totalCMTCells > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {(isTemperature ? [
            { label: 'Completadas', value: `${filledTempCells}/${totalTempCells}`, color: 'text-blue-600' },
            { label: 'Cumplimiento', value: `${tempCompliance}%`, color: tempCompliance >= 80 ? 'text-green-600' : tempCompliance >= 50 ? 'text-amber-600' : 'text-red-600' },
            { label: 'Sin Registro', value: emptyTempCells, color: 'text-red-600' },
          ] : isComplianceMT ? [
            { label: 'Completadas', value: `${filledCMTCells}/${totalCMTCells}`, color: 'text-blue-600' },
            { label: 'Cumplimiento', value: `${cmtCompliance}%`, color: cmtCompliance >= 80 ? 'text-green-600' : cmtCompliance >= 50 ? 'text-amber-600' : 'text-red-600' },
            { label: 'No Cumple', value: cmtNC, color: 'text-red-600' },
          ] : [
            { label: 'Completadas', value: `${filledCells}/${totalCells}`, color: 'text-blue-600' },
            { label: 'Cumplimiento', value: `${compliance}%`, color: compliance >= 80 ? 'text-green-600' : compliance >= 50 ? 'text-amber-600' : 'text-red-600' },
            { label: 'No Cumple', value: entries.filter(e => e.value === 'NC').length, color: 'text-red-600' },
          ]).map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {isWorkerHygiene ? (
        <HigieneManipuladoresView
          monthId={planillaMonth.id}
          year={planillaMonth.year}
          month={planillaMonth.month}
          items={items}
          readOnly={isReadonly}
        />
      ) : isMonthlyChecklist ? (
        <ChecklistView
          monthId={planillaMonth.id}
          items={items}
          readOnly={isReadonly}
          canDeleteDocs={false}
        />
      ) : (
        <>
          <PlanillaGrid
            planillaMonth={planillaMonth}
            items={items}
            entryMap={entryMap}
            tempMap={tempMap}
            complianceMTMap={complianceMTMap}
            onSetValue={handleSetValue}
            onSetNumericValue={handleSetNumeric}
            onMarkTempClosed={(itemId, day, slot) => setTempClosed(itemId, day, slot)}
            onSetComplianceMTValue={handleSetCMT}
            readonly={isReadonly}
          />
          <p className="text-xs text-gray-400 text-center">
            {isTemperature
              ? 'Toca la celda M (mañana) o T (tarde) e ingresa los grados °C. Usa "Cerrado" si el establecimiento no abre ese día.'
              : isComplianceMT
              ? <>Toca cada celda para ciclar: <strong>C</strong> (Cumple) → <strong>NC</strong> (No Cumple) → <strong>C</strong> (Cerrado) → vacío</>
              : <>Toca cada celda para ciclar: <strong>C</strong> (Cumple) → <strong>NC</strong> (No Cumple) → <strong>NA</strong> (No Aplica) → vacío</>
            }
          </p>
        </>
      )}

      {msg && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </div>
      )}

      {!isSigned && (
        <div className="flex justify-end">
          <button
            disabled={signing}
            onClick={() => setShowSign(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-900 disabled:opacity-60 transition-colors"
          >
            <PenLine size={16} />
            {signing ? 'Firmando…' : 'Firmar planilla'}
          </button>
        </div>
      )}

      {isSigned && (
        <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700">
          <CheckCircle size={16} />
          <span>
            Firmada el {planillaMonth.signed_at
              ? new Date(planillaMonth.signed_at).toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' })
              : '—'}
          </span>
        </div>
      )}

      {showSign && <SignaturePad onSign={handleSign} onCancel={() => setShowSign(false)} />}
    </div>
  )
}

// ── Main list ─────────────────────────────────────────────────────────────────
export default function OperatorPlanillas() {
  const today    = new Date()
  const location = useLocation()
  const [year]   = useState(today.getFullYear())
  const [month]  = useState(today.getMonth() + 1)
  const { templates } = usePlanillaTemplates()
  // filterByCurrentUser=true → only shows planillas assigned to this operator
  const { months, loading: loadingMonths, reload } = usePlanillaMonths(year, month, true)
  const [selected, setSelected] = useState<PlanillaMonth | null>(null)

  // Open a specific planilla when navigated from the Home dashboard
  useEffect(() => {
    const state = location.state as { selectedMonthId?: string } | null
    if (state?.selectedMonthId && months.length > 0) {
      const target = months.find(m => m.id === state.selectedMonthId)
      if (target) setSelected(target)
    }
  }, [location.state, months])

  // Reset to list view whenever the sidebar navigates to this same route
  useEffect(() => { setSelected(null) }, [location.key])

  if (selected) {
    const fresh = months.find(m => m.id === selected.id) ?? selected
    return (
      <PlanillaDetail
        planillaMonth={{ ...fresh, template: selected.template }}
        onBack={() => setSelected(null)}
        onSigned={() => { reload(); setSelected(null) }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mis Planillas</h1>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
          <Calendar size={14} />
          {MONTH_NAMES[month]} {year}
        </p>
      </div>

      {loadingMonths ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : months.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 shadow-sm">
          <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
          <p className="font-medium">No tienes planillas asignadas</p>
          <p className="text-sm mt-1">Contacta a tu supervisor para que te asigne planillas este mes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {months.map(pm => {
            const tpl = templates.find(t => t.id === pm.template_id)
            const cfg = STATUS_CONFIG[pm.status]
            return (
              <button
                key={pm.id}
                onClick={() => setSelected({ ...pm, template: tpl })}
                className="w-full bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:border-brand-300 hover:shadow-md transition-all text-left"
              >
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardList size={20} className="text-brand-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {tpl?.name ?? 'Planilla'}
                    {pm.label ? ` — ${pm.label}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{tpl?.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
