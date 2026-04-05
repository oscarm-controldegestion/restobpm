import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList, Bell, BellOff, ChevronRight, ArrowLeft,
  Calendar, AlertTriangle, CheckCircle, Download
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  usePlanillaTemplates,
  usePlanillaMonths,
  usePlanillaItems,
  usePlanillaEntries,
  usePlanillaAlerts,
} from '@/hooks/usePlanillas'
import PlanillaGrid from '@/components/planilla/PlanillaGrid'
import type { PlanillaMonth, PlanillaTemplate } from '@/types'

const MONTH_NAMES = [
  '', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

const STATUS_CONFIG = {
  pending:     { label: 'Pendiente',  color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  in_progress: { label: 'En curso',   color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  completed:   { label: 'Completada', color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  signed:      { label: 'Firmada',    color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
}

const ALERT_TYPE_CONFIG = {
  not_started: { label: 'Sin iniciar',    icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
  incomplete:  { label: 'Incompleta',     icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  overdue:     { label: 'Vencida',        icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
}

// ── Compliance bar ─────────────────────────────────────────────────────────────
function ComplianceBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Detail view (read-only grid) ───────────────────────────────────────────────
function PlanillaDetail({
  planillaMonth, onBack
}: { planillaMonth: PlanillaMonth; onBack: () => void }) {
  const { items, loading: loadingItems } = usePlanillaItems(planillaMonth.template_id)
  const { entryMap, entries } = usePlanillaEntries(planillaMonth.id)

  const totalCells  = items.length * new Date(planillaMonth.year, planillaMonth.month, 0).getDate()
  const filledCells = entries.filter(e => e.value !== null).length
  const cCells      = entries.filter(e => e.value === 'C').length
  const compliance  = filledCells > 0 ? Math.round((cCells / filledCells) * 100) : 0

  if (loadingItems) return <div className="flex items-center justify-center py-20 text-gray-400">Cargando…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 text-lg">{planillaMonth.template?.name}</h2>
          <p className="text-sm text-gray-500">{MONTH_NAMES[planillaMonth.month]} {planillaMonth.year}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CONFIG[planillaMonth.status].color}`}>
          {STATUS_CONFIG[planillaMonth.status].label}
        </span>
      </div>

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

      {planillaMonth.status === 'signed' && planillaMonth.signed_at && (
        <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700">
          <CheckCircle size={16} />
          <span>Firmada el {new Date(planillaMonth.signed_at).toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' })}</span>
        </div>
      )}

      <PlanillaGrid
        planillaMonth={planillaMonth}
        items={items}
        entryMap={entryMap}
        onSetValue={() => {}}
        readonly
      />
    </div>
  )
}

// ── Per-template stats card ────────────────────────────────────────────────────
function TemplateCard({
  template, months, onView, onAlert
}: {
  template: PlanillaTemplate
  months: PlanillaMonth[]
  onView: (m: PlanillaMonth) => void
  onAlert: (m: PlanillaMonth) => void
}) {
  const month = months.find(m => m.template_id === template.id)
  if (!month) return null
  const cfg = STATUS_CONFIG[month.status]

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-50">
        <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
          <ClipboardList size={18} className="text-brand-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{template.name}</p>
          <p className="text-xs text-gray-400 truncate">{template.description}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex divide-x divide-gray-100">
        <button
          onClick={() => onView(month)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-brand-700 hover:bg-brand-50 transition-colors font-medium"
        >
          <ChevronRight size={14} />
          Ver planilla
        </button>
        {month.status === 'pending' && (
          <button
            onClick={() => onAlert(month)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors font-medium"
          >
            <Bell size={14} />
            Alertar
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PlanillasDashboard() {
  const today = new Date()
  const [year]  = useState(today.getFullYear())
  const [month] = useState(today.getMonth() + 1)
  const { tenant } = useAuth()

  const { templates, loading: loadingTpl } = usePlanillaTemplates()
  const { months, loading: loadingMonths, ensureMonths } = usePlanillaMonths(year, month)
  const { alerts, markSeen, createAlert } = usePlanillaAlerts()
  const [selected, setSelected] = useState<PlanillaMonth | null>(null)
  const [alertSent, setAlertSent] = useState<string | null>(null)

  useEffect(() => {
    if (!loadingTpl && templates.length > 0 && !loadingMonths && months.length === 0) {
      ensureMonths(templates)
    }
  }, [loadingTpl, loadingMonths, templates.length])

  // Compliance summary across all templates
  const [stats, setStats] = useState<{ signed: number; completed: number; inProgress: number; pending: number }>({
    signed: 0, completed: 0, inProgress: 0, pending: 0
  })
  useEffect(() => {
    const s = { signed: 0, completed: 0, inProgress: 0, pending: 0 }
    for (const m of months) {
      if (m.status === 'signed') s.signed++
      else if (m.status === 'completed') s.completed++
      else if (m.status === 'in_progress') s.inProgress++
      else s.pending++
    }
    setStats(s)
  }, [months])

  const handleAlert = async (m: PlanillaMonth) => {
    await createAlert(m.id, 'not_started')
    setAlertSent(m.id)
    setTimeout(() => setAlertSent(null), 3000)
  }

  if (selected) {
    const fresh = months.find(m => m.id === selected.id) ?? selected
    return (
      <PlanillaDetail
        planillaMonth={{ ...fresh, template: selected.template }}
        onBack={() => setSelected(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Planillas del Mes</h1>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
          <Calendar size={14} />
          {MONTH_NAMES[month]} {year}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Firmadas',   value: stats.signed,     color: 'text-purple-600 bg-purple-50 border-purple-200' },
          { label: 'Completadas', value: stats.completed,  color: 'text-green-600 bg-green-50 border-green-200' },
          { label: 'En curso',   value: stats.inProgress, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Pendientes', value: stats.pending,     color: 'text-red-600 bg-red-50 border-red-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts panel */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-200">
            <Bell size={16} className="text-amber-600" />
            <h2 className="font-semibold text-amber-800 text-sm">{alerts.length} Alerta{alerts.length > 1 ? 's' : ''} sin resolver</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {alerts.slice(0, 5).map(alert => {
              const typeCfg = ALERT_TYPE_CONFIG[alert.type]
              const Icon = typeCfg.icon
              const tpl = templates.find(t => t.id === (alert.month as any)?.template_id)
              return (
                <div key={alert.id} className={`flex items-center gap-3 px-4 py-3 border-l-4 ${alert.type === 'not_started' ? 'border-red-400' : 'border-amber-400'}`}>
                  <Icon size={16} className={alert.type === 'not_started' ? 'text-red-500 shrink-0' : 'text-amber-500 shrink-0'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {(alert.month as any)?.template?.name ?? tpl?.name ?? 'Planilla'}
                    </p>
                    <p className="text-xs text-gray-500">{typeCfg.label}{alert.day ? ` — Día ${alert.day}` : ''}</p>
                  </div>
                  <button
                    onClick={() => markSeen(alert.id)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Marcar como vista"
                  >
                    <BellOff size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Alert sent toast */}
      {alertSent && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <Bell size={15} />
          Alerta enviada al operador
        </div>
      )}

      {/* Planilla cards */}
      <div>
        <h2 className="font-semibold text-gray-700 text-sm mb-3">Estado por planilla</h2>
        {(loadingTpl || loadingMonths) ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(tpl => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                months={months}
                onView={m => setSelected({ ...m, template: tpl })}
                onAlert={handleAlert}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
