import { useCallback } from 'react'
import type { PlanillaItem, PlanillaValue, PlanillaMonth } from '@/types'

const FREQ_LABEL: Record<string, string> = {
  daily:   'D',
  weekly:  'S',
  monthly: 'M',
}
const FREQ_COLOR: Record<string, string> = {
  daily:   'text-blue-600',
  weekly:  'text-purple-600',
  monthly: 'text-orange-600',
}

const VALUE_CYCLE: (PlanillaValue | null)[] = [null, 'C', 'NC', 'NA']
const VALUE_STYLE: Record<string, string> = {
  C:  'bg-green-500 text-white font-bold',
  NC: 'bg-red-500 text-white font-bold',
  NA: 'bg-gray-300 text-gray-600 font-bold',
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

interface Props {
  planillaMonth: PlanillaMonth
  items: PlanillaItem[]
  entryMap: (itemId: string, day: number) => PlanillaValue | null
  onSetValue: (itemId: string, day: number, value: PlanillaValue | null) => void
  readonly?: boolean
}

export default function PlanillaGrid({ planillaMonth, items, entryMap, onSetValue, readonly }: Props) {
  const { year, month } = planillaMonth
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month
  const currentDay = isCurrentMonth ? today.getDate() : -1
  const totalDays = daysInMonth(year, month)
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)

  const handleTap = useCallback((itemId: string, day: number, current: PlanillaValue | null) => {
    if (readonly) return
    const idx = VALUE_CYCLE.indexOf(current)
    const next = VALUE_CYCLE[(idx + 1) % VALUE_CYCLE.length]
    onSetValue(itemId, day, next)
  }, [onSetValue, readonly])

  // Compliance summary per item
  const itemCompliance = useCallback((item: PlanillaItem) => {
    let c = 0, nc = 0, na = 0, filled = 0
    for (const d of days) {
      const v = entryMap(item.id, d)
      if (v === 'C')  { c++; filled++ }
      if (v === 'NC') { nc++; filled++ }
      if (v === 'NA') { na++; filled++ }
    }
    return { c, nc, na, filled, total: days.length }
  }, [days, entryMap])

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-max text-xs border-collapse">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="sticky left-0 z-20 bg-gray-800 text-left px-3 py-2 min-w-[180px] max-w-[220px] font-semibold border-r border-gray-600">
              Ítem / Zona
            </th>
            <th className="px-2 py-2 font-semibold border-r border-gray-600 min-w-[36px] text-center">Fr.</th>
            {days.map(d => (
              <th
                key={d}
                className={`px-1 py-2 font-semibold min-w-[28px] text-center border-r border-gray-600 ${
                  d === currentDay ? 'bg-amber-500 text-gray-900' : ''
                }`}
              >
                {d}
              </th>
            ))}
            <th className="px-2 py-2 font-semibold min-w-[80px] text-center bg-gray-700">Cumpl.</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, rowIdx) => {
            const stats = itemCompliance(item)
            const pct = stats.filled > 0 ? Math.round((stats.c / stats.filled) * 100) : null

            return (
              <tr
                key={item.id}
                className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {/* Item name — sticky */}
                <td className={`sticky left-0 z-10 border-r border-gray-200 px-3 py-1.5 font-medium text-gray-800 truncate max-w-[220px] ${
                  rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}>
                  {item.name}
                </td>

                {/* Frequency badge */}
                <td className={`text-center border-r border-gray-200 py-1.5 font-bold ${FREQ_COLOR[item.frequency]}`}>
                  {FREQ_LABEL[item.frequency]}
                </td>

                {/* Day cells */}
                {days.map(d => {
                  const val = entryMap(item.id, d)
                  const isPast = d < currentDay || !isCurrentMonth
                  const isFuture = isCurrentMonth && d > currentDay

                  return (
                    <td
                      key={d}
                      onClick={() => handleTap(item.id, d, val)}
                      className={`border-r border-gray-100 text-center transition-colors select-none ${
                        readonly || isFuture ? 'cursor-default' : 'cursor-pointer hover:brightness-90'
                      } ${d === currentDay ? 'border-l-2 border-r-2 border-amber-400' : ''}`}
                    >
                      <div className={`mx-auto w-6 h-6 rounded flex items-center justify-center text-xs ${
                        val ? VALUE_STYLE[val] : isPast && !val ? 'bg-red-100 text-red-300' : 'bg-gray-100 text-gray-300'
                      }`}>
                        {val ?? (isPast ? '·' : '')}
                      </div>
                    </td>
                  )
                })}

                {/* Compliance summary */}
                <td className="text-center px-2 py-1.5 border-l border-gray-200 bg-gray-50">
                  {pct !== null ? (
                    <span className={`font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {pct}%
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>

        {/* Legend */}
        <tfoot>
          <tr className="bg-gray-100 border-t border-gray-300">
            <td colSpan={2} className="sticky left-0 bg-gray-100 px-3 py-2 text-gray-500 font-medium">
              Leyenda:
            </td>
            {days.map(d => <td key={d} className="border-r border-gray-200" />)}
            <td className="px-2 py-2 text-xs text-gray-500">
              <div className="flex flex-col gap-1">
                <span><span className="inline-block w-4 h-4 rounded bg-green-500 mr-1 align-middle" />C: Cumple</span>
                <span><span className="inline-block w-4 h-4 rounded bg-red-500 mr-1 align-middle" />NC: No Cumple</span>
                <span><span className="inline-block w-4 h-4 rounded bg-gray-300 mr-1 align-middle" />NA: No Aplica</span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
