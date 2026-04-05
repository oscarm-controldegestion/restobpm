/**
 * HigieneManipuladoresView
 *
 * Replica the Excel "REGISTRO SEMANAL DE HIGIENE DE MANIPULADORES DE ALIMENTOS":
 *   - Rows   = workers (N°, Nombre, Turno)
 *   - Columns = each criteria × day-of-month
 *   - Cell value = S / N (toggleable)
 *
 * Week navigation lets users browse the month one week at a time.
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, UserPlus, Loader2 } from 'lucide-react'
import type { PlanillaItem, Worker } from '@/types'
import { useWorkers, useHigieneEntries } from '@/hooks/usePlanillas'

const DAY_ABBR = ['', 'L', 'M', 'M', 'J', 'V', 'S', 'D']  // 1=Mon…7=Sun (ISO)

/** Returns the days-of-month for a given ISO week within a year/month */
function weekDays(year: number, month: number, weekOffset: number): number[] {
  // Find the first day of the month
  const firstDay = new Date(year, month - 1, 1)
  // ISO day-of-week: Mon=1 … Sun=7
  const isoDow = ((firstDay.getDay() + 6) % 7) + 1   // convert JS 0=Sun to ISO 1=Mon
  const firstMonday = 1 - (isoDow - 1)                 // may be negative (prev month)
  const days: number[] = []
  for (let i = 0; i < 7; i++) {
    const d = firstMonday + weekOffset * 7 + i
    if (d >= 1 && d <= new Date(year, month, 0).getDate()) days.push(d)
  }
  return days
}

function totalWeeks(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay    = new Date(year, month - 1, 1)
  const isoDow      = ((firstDay.getDay() + 6) % 7) + 1
  return Math.ceil((daysInMonth + isoDow - 1) / 7)
}

// ── Cell toggle ───────────────────────────────────────────────────────────────
function HigieneCell({
  value, onClick, readOnly
}: { value: 'S' | 'N' | null; onClick: () => void; readOnly: boolean }) {
  const base = 'w-8 h-8 rounded text-xs font-bold border transition-all flex items-center justify-center'
  if (value === 'S') return (
    <button onClick={onClick} disabled={readOnly}
      className={`${base} bg-green-500 text-white border-transparent`}>S</button>
  )
  if (value === 'N') return (
    <button onClick={onClick} disabled={readOnly}
      className={`${base} bg-red-500 text-white border-transparent`}>N</button>
  )
  return (
    <button onClick={onClick} disabled={readOnly}
      className={`${base} bg-white border-gray-200 text-gray-300 hover:border-gray-400`}>–</button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  monthId: string
  year: number
  month: number
  items: PlanillaItem[]       // the 4 hygiene criteria
  readOnly?: boolean
}

export default function HigieneManipuladoresView({
  monthId, year, month, items, readOnly = false
}: Props) {
  const { workers, loading: wLoading } = useWorkers()
  const { getValue, setValue, loading: eLoading } = useHigieneEntries(monthId)

  const today = new Date()
  const todayDay = today.getFullYear() === year && today.getMonth() + 1 === month
    ? today.getDate() : -1

  // Week navigation
  const maxWeeks   = totalWeeks(year, month)
  const [weekIdx, setWeekIdx] = useState(() => {
    if (todayDay < 0) return 0
    // Start on the week containing today
    const firstDay = new Date(year, month - 1, 1)
    const isoDow   = ((firstDay.getDay() + 6) % 7) + 1
    return Math.floor((todayDay + isoDow - 2) / 7)
  })
  const days = weekDays(year, month, weekIdx)

  const handleToggle = (workerId: string, itemId: string, day: number) => {
    if (readOnly) return
    const cur = getValue(workerId, itemId, day)
    const next = cur === null ? 'S' : cur === 'S' ? 'N' : null
    setValue(workerId, itemId, day, next)
  }

  if (wLoading || eLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
      </div>
    )
  }

  if (workers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
        <UserPlus size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500 text-sm font-medium">No hay trabajadores registrados</p>
        <p className="text-gray-400 text-xs mt-1">
          Agrega los manipuladores en <strong>Configuración → Trabajadores</strong>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* ── Week navigator ── */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
        <button
          onClick={() => setWeekIdx(w => Math.max(0, w - 1))}
          disabled={weekIdx === 0}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-gray-700">
          Semana {weekIdx + 1} de {maxWeeks}
          {days.length > 0 && (
            <span className="text-gray-400 ml-2 font-normal">
              (días {days[0]}–{days[days.length - 1]})
            </span>
          )}
        </span>
        <button
          onClick={() => setWeekIdx(w => Math.min(maxWeeks - 1, w + 1))}
          disabled={weekIdx >= maxWeeks - 1}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Grid (horizontal scroll) ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            {/* Row 1: criteria group headers */}
            <tr className="bg-brand-700 text-white">
              <th className="border border-brand-800 px-2 py-2 text-left min-w-[28px]">N°</th>
              <th className="border border-brand-800 px-2 py-2 text-left min-w-[130px]">Nombre</th>
              <th className="border border-brand-800 px-2 py-2 text-center min-w-[48px]">Turno</th>
              {items.map(item => (
                <th
                  key={item.id}
                  colSpan={days.length}
                  className="border border-brand-800 px-2 py-1.5 text-center font-semibold"
                >
                  <span className="block max-w-[160px] truncate mx-auto" title={item.name ?? (item as any).label}>
                    {item.name ?? (item as any).label}
                  </span>
                </th>
              ))}
              <th className="border border-brand-800 px-2 py-2 text-center min-w-[52px]">Firma</th>
            </tr>

            {/* Row 2: day numbers per criteria */}
            <tr className="bg-brand-700/80 text-white/80">
              <th className="border border-brand-800 py-1" />
              <th className="border border-brand-800 py-1" />
              <th className="border border-brand-800 py-1" />
              {items.map(item =>
                days.map(d => {
                  const date = new Date(year, month - 1, d)
                  const iso  = ((date.getDay() + 6) % 7) + 1  // 1=Mon…7=Sun
                  const isToday = d === todayDay
                  return (
                    <th
                      key={`${item.id}-${d}`}
                      className={`border border-brand-800 py-1 text-center w-8 font-normal ${isToday ? 'bg-yellow-400/30' : ''}`}
                    >
                      <div className="text-[10px] opacity-70">{DAY_ABBR[iso]}</div>
                      <div className="font-semibold">{d}</div>
                    </th>
                  )
                })
              )}
              <th className="border border-brand-800 py-1" />
            </tr>
          </thead>

          <tbody>
            {workers.map((worker, idx) => (
              <tr
                key={worker.id}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {/* N° */}
                <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-500 font-mono">
                  {idx + 1}
                </td>

                {/* Nombre + RUT */}
                <td className="border border-gray-200 px-2 py-1.5">
                  <div className="font-medium text-gray-800 whitespace-nowrap">{worker.name}</div>
                  <div className="text-gray-400 text-[10px]">{worker.rut}</div>
                </td>

                {/* Turno */}
                <td className="border border-gray-200 px-1 py-1.5 text-center">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    worker.shift === 'AM'    ? 'bg-blue-100 text-blue-700'   :
                    worker.shift === 'PM'    ? 'bg-orange-100 text-orange-700' :
                                               'bg-purple-100 text-purple-700'
                  }`}>
                    {worker.shift}
                  </span>
                </td>

                {/* Criteria × day cells */}
                {items.map(item =>
                  days.map(d => {
                    const val = getValue(worker.id, item.id, d)
                    const isToday = d === todayDay
                    return (
                      <td
                        key={`${item.id}-${d}`}
                        className={`border border-gray-200 px-0.5 py-0.5 text-center ${isToday ? 'bg-yellow-50' : ''}`}
                      >
                        <HigieneCell
                          value={val}
                          readOnly={readOnly}
                          onClick={() => handleToggle(worker.id, item.id, d)}
                        />
                      </td>
                    )
                  })
                )}

                {/* Firma (placeholder) */}
                <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-300 text-[10px]">
                  ______
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center">
        S = Sí cumple &nbsp;·&nbsp; N = No cumple &nbsp;·&nbsp; – = Sin registro
      </p>
    </div>
  )
}
