import { useState, useEffect, useRef } from 'react'
import { ClipboardList, ChevronRight, ArrowLeft, PenLine, CheckCircle, AlertCircle, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  usePlanillaTemplates,
  usePlanillaMonths,
  usePlanillaItems,
  usePlanillaEntries,
  signPlanillaMonth,
  updateMonthStatus,
} from '@/hooks/usePlanillas'
import PlanillaGrid from '@/components/planilla/PlanillaGrid'
import type { PlanillaMonth } from '@/types'

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

// ── Signature pad (simple canvas) ─────────────────────────────────────────────
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
    ctx.strokeStyle = '#1A252F'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  const endDraw = () => { drawing.current = false }
  const clear = () => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !canvasRef.current) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }
  const confirm = () => {
    const sig = canvasRef.current?.toDataURL('image/png') ?? ''
    onSign(sig)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">Firma Digital</h3>
          <p className="text-sm text-gray-500 mt-1">Dibuja tu firma en el recuadro para certificar esta planilla</p>
        </div>
        <div className="p-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={160}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 touch-none cursor-crosshair"
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
          />
        </div>
        <div className="p-4 flex gap-3 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={clear} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Limpiar
          </button>
          <button onClick={confirm} className="flex-1 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-900 transition-colors">
            Firmar planilla
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Grid view ─────────────────────────────────────────────────────────────────
function PlanillaDetail({
  planillaMonth,
  onBack,
  onSigned,
}: {
  planillaMonth: PlanillaMonth
  onBack: () => void
  onSigned: () => void
}) {
  const { profile } = useAuth()
  const { items, loading: loadingItems } = usePlanillaItems(planillaMonth.template_id)
  const { entryMap, setValue, entries } = usePlanillaEntries(planillaMonth.id)
  const [showSign, setShowSign] = useState(false)
  const [signing, setSigning]  = useState(false)
  const [msg, setMsg]          = useState<{ ok: boolean; text: string } | null>(null)
  const isSigned   = planillaMonth.status === 'signed'
  const isReadonly = isSigned || planillaMonth.status === 'completed'

  // Auto-update status to in_progress when operator starts filling
  const handleSetValue = async (itemId: string, day: number, value: import('@/types').PlanillaValue | null) => {
    await setValue(itemId, day, value)
    if (planillaMonth.status === 'pending') {
      await updateMonthStatus(planillaMonth.id, 'in_progress')
    }
  }

  const totalCells  = items.length * new Date(planillaMonth.year, planillaMonth.month, 0).getDate()
  const filledCells = entries.filter(e => e.value !== null).length
  const cCells      = entries.filter(e => e.value === 'C').length
  const compliance  = filledCells > 0 ? Math.round((cCells / filledCells) * 100) : 0

  const handleSign = async (signature: string) => {
    if (!profile) return
    setSigning(true)
    setShowSign(false)
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
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 text-lg leading-tight">{planillaMonth.template?.name}</h2>
          <p className="text-sm text-gray-500">{MONTH_NAMES[planillaMonth.month]} {planillaMonth.year}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CONFIG[planillaMonth.status].color}`}>
          {STATUS_CONFIG[planillaMonth.status].label}
        </span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Completadas', value: `${filledCells}/${totalCells}`, color: 'text-blue-600' },
          { label: 'Cumplimiento', value: `${compliance}%`, color: compliance >= 80 ? 'text-green-600' : compliance >= 50 ? 'text-amber-600' : 'text-red-600' },
          { label: 'No Cumple', value: entries.filter(e => e.value === 'NC').length, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <PlanillaGrid
        planillaMonth={planillaMonth}
        items={items}
        entryMap={entryMap}
        onSetValue={handleSetValue}
        readonly={isReadonly}
      />

      {/* Legend note */}
      <p className="text-xs text-gray-400 text-center">
        Toca cada celda para ciclar: <strong>C</strong> (Cumple) → <strong>NC</strong> (No Cumple) → <strong>NA</strong> (No Aplica) → vacío
      </p>

      {/* Feedback */}
      {msg && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {msg.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Sign button */}
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
            Firmada el {planillaMonth.signed_at ? new Date(planillaMonth.signed_at).toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' }) : '—'}
          </span>
        </div>
      )}

      {showSign && <SignaturePad onSign={handleSign} onCancel={() => setShowSign(false)} />}
    </div>
  )
}

// ── Main list view ────────────────────────────────────────────────────────────
export default function OperatorPlanillas() {
  const today = new Date()
  const [year]  = useState(today.getFullYear())
  const [month] = useState(today.getMonth() + 1)
  const { templates, loading: loadingTemplates } = usePlanillaTemplates()
  const { months, loading: loadingMonths, ensureMonths, reload } = usePlanillaMonths(year, month)
  const [selected, setSelected] = useState<PlanillaMonth | null>(null)

  // Create month records if not yet created
  useEffect(() => {
    if (!loadingTemplates && templates.length > 0 && !loadingMonths && months.length === 0) {
      ensureMonths(templates)
    }
  }, [loadingTemplates, loadingMonths, templates.length])

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mis Planillas</h1>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
          <Calendar size={14} />
          {MONTH_NAMES[month]} {year}
        </p>
      </div>

      {/* List */}
      {(loadingTemplates || loadingMonths) ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : months.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 shadow-sm">
          <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
          <p className="font-medium">No hay planillas asignadas</p>
          <p className="text-sm mt-1">Contacta a tu supervisor para que asigne planillas</p>
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
                  <p className="font-semibold text-gray-800 truncate">{tpl?.name ?? 'Planilla'}</p>
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
