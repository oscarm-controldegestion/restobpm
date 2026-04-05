import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, Clock, AlertCircle, ChevronRight,
  ClipboardList, PenLine, CalendarDays,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { PlanillaMonth } from '@/types'

const MONTH_NAMES = [
  '', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

interface PlanillaProgress {
  month:        PlanillaMonth
  totalItems:   number   // total assignable items for this planilla
  filledToday:  number   // entries with day = today's day (daily planillas)
  filledMonth:  number   // entries for monthly checklist items
  isMonthly:    boolean  // all items are monthly frequency
}

/* ── Status chip ─────────────────────────────────────────────────── */
function StatusChip({ status }: { status: PlanillaMonth['status'] }) {
  const cfg = {
    pending:     { label: 'Pendiente',    bg: 'bg-orange-50 text-orange-600' },
    in_progress: { label: 'En Progreso',  bg: 'bg-blue-50 text-blue-600' },
    completed:   { label: 'Completada',   bg: 'bg-purple-50 text-purple-700' },
    signed:      { label: 'Firmada',      bg: 'bg-green-50 text-green-700' },
  }[status] ?? { label: status, bg: 'bg-gray-100 text-gray-500' }

  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.bg}`}>
      {cfg.label}
    </span>
  )
}

/* ── Mini progress bar ───────────────────────────────────────────── */
function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-400' : 'bg-brand-500'
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
      <div
        className={`${color} h-1.5 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────── */
export default function OperatorHome() {
  const { profile, tenant } = useAuth()
  const navigate = useNavigate()

  const today   = new Date()
  const year    = today.getFullYear()
  const month   = today.getMonth() + 1
  const dayNum  = today.getDate()

  const [items, setItems]   = useState<PlanillaProgress[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!tenant || !profile) return
    setLoading(true)

    // 1. Planilla months for this period (assigned to me OR unassigned)
    const { data: months } = await supabase
      .from('planilla_months')
      .select('*, template:planilla_templates(*)')
      .eq('tenant_id', tenant.id)
      .eq('year', year)
      .eq('month', month)
      .order('created_at')

    if (!months?.length) { setItems([]); setLoading(false); return }

    // 2. For each month: load item count and entry counts
    const results: PlanillaProgress[] = []

    for (const m of months as PlanillaMonth[]) {
      // Items assigned to this month (via junction or template default)
      const { data: miRows } = await supabase
        .from('planilla_month_items')
        .select('item:planilla_items(id, frequency)')
        .eq('month_id', m.id)

      const assignedItems = (miRows ?? []).map((r: any) => r.item).filter(Boolean)
      const isMonthly     = assignedItems.length > 0 && assignedItems.every((i: any) => i.frequency === 'monthly')
      const totalItems    = assignedItems.length

      // Entries
      const { data: entries } = await supabase
        .from('planilla_entries')
        .select('value, day, time_slot')
        .eq('month_id', m.id)
        .not('value', 'is', null)

      const filledToday = (entries ?? []).filter(e => e.day === dayNum && !e.time_slot).length
      const filledMonth = (entries ?? []).filter(e => e.day === 1 && !e.time_slot).length

      results.push({ month: m, totalItems, filledToday, filledMonth, isMonthly })
    }

    setItems(results)
    setLoading(false)
  }, [tenant, profile, year, month, dayNum])

  useEffect(() => { load() }, [load])

  /* ── Overall progress summary ─────────────────────────────────── */
  const signed    = items.filter(p => p.month.status === 'signed').length
  const total     = items.length
  const overallPct = total ? Math.round((signed / total) * 100) : 0

  /* ── Per-planilla progress % ──────────────────────────────────── */
  const getPct = (p: PlanillaProgress): number => {
    if (p.month.status === 'signed') return 100
    if (p.totalItems === 0) return 0
    if (p.isMonthly) {
      return Math.round((p.filledMonth / p.totalItems) * 100)
    }
    // daily: progress for today
    return Math.round((p.filledToday / p.totalItems) * 100)
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="max-w-lg mx-auto pb-10">

      {/* Saludo */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">
          ¡Hola, {profile?.full_name.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
          <CalendarDays size={13} />
          {MONTH_NAMES[month]} {year} · Mis planillas asignadas
        </p>
      </div>

      {/* Resumen mensual */}
      <div className="bg-brand-700 rounded-2xl p-5 text-white mb-6 shadow-lg">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-wide font-medium">
              Planillas del mes
            </p>
            <p className="text-4xl font-bold mt-1">
              {overallPct}<span className="text-2xl">%</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">Firmadas</p>
            <p className="text-2xl font-bold">{signed}/{total}</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2.5">
          <div
            className="bg-white rounded-full h-2.5 transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        {overallPct === 100 && total > 0 && (
          <p className="text-green-300 text-sm mt-3 font-medium">
            ✅ ¡Todas las planillas firmadas!
          </p>
        )}
      </div>

      {/* Lista de planillas */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-24 border border-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
          <ClipboardList size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No tienes planillas asignadas este mes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(p => {
            const pct     = getPct(p)
            const isSigned = p.month.status === 'signed'
            const initials = (p.month.template?.name ?? 'P')
              .split(' ')
              .slice(0, 2)
              .map((w: string) => w[0])
              .join('')
              .toUpperCase()

            return (
              <button
                key={p.month.id}
                onClick={() => navigate('/operator/planillas', { state: { selectedMonthId: p.month.id } })}
                className={`w-full bg-white rounded-xl px-4 pt-4 pb-3 flex items-start gap-4 shadow-sm border-2 transition-all active:scale-[0.99] text-left ${
                  isSigned ? 'border-green-200' : 'border-transparent hover:border-brand-200'
                }`}
              >
                {/* Ícono */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                  isSigned ? 'bg-green-100 text-green-700' : 'bg-brand-50 text-brand-700'
                }`}>
                  {isSigned
                    ? <CheckCircle2 size={22} className="text-green-600" />
                    : initials
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {p.month.template?.name}
                      {p.month.label ? ` — ${p.month.label}` : ''}
                    </span>
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <StatusChip status={p.month.status} />
                    {!isSigned && p.totalItems > 0 && (
                      <span className="text-xs text-gray-400">
                        {p.isMonthly
                          ? `${p.filledMonth}/${p.totalItems} ítems`
                          : `Hoy: ${p.filledToday}/${p.totalItems} ítems`
                        }
                      </span>
                    )}
                    {isSigned && p.month.signed_at && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <PenLine size={11} />
                        {new Date(p.month.signed_at).toLocaleDateString('es-CL', { day:'2-digit', month:'short' })}
                      </span>
                    )}
                  </div>

                  {!isSigned && p.totalItems > 0 && (
                    <ProgressBar pct={pct} />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8 px-4">
        Registros conforme D.S. 977/96 RSA · SEREMI de Salud
      </p>
    </div>
  )
}
