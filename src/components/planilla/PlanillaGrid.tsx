import { useCallback, useState, useRef } from 'react'
import type { PlanillaItem, PlanillaValue, PlanillaMonth, TimeSlot } from '@/types'

const FREQ_LABEL: Record<string, string> = { daily: 'D', weekly: 'S', monthly: 'M' }
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

// Temperature color based on threshold (cold chain: ≤ -18 OK, fridge 0-8 OK, etc.)
function tempCellStyle(val: number | null): string {
  if (val === null) return 'bg-gray-100 text-gray-300'
  return 'bg-blue-50 text-blue-800 font-semibold'
}

interface TempCellProps {
  value: number | null
  onSave: (v: number | null) => void
  readonly?: boolean
  isPast: boolean
  isFuture: boolean
}

function TempCell({ value, onSave, readonly, isPast, isFuture }: TempCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    if (readonly || isFuture) return
    setDraft(value !== null ? String(value) : '')
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const commit = () => {
    setEditing(false)
    const n = parseFloat(draft)
    if (draft === '' || draft === '-') {
      onSave(null)
    } else if (!isNaN(n)) {
      onSave(n)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        className="w-10 h-5 text-center text-xs border border-blue-400 rounded bg-white outline-none px-0.5"
      />
    )
  }

  return (
    <div
      onClick={startEdit}
      className={`w-10 h-5 rounded flex items-center justify-center text-xs leading-none
        ${readonly || isFuture ? 'cursor-default' : 'cursor-pointer hover:brightness-90'}
        ${value !== null ? tempCellStyle(value) : isPast ? 'bg-red-100 text-red-300' : 'bg-gray-100 text-gray-300'}`}
    >
      {value !== null ? `${value}°` : isPast ? '·' : ''}
    </div>
  )
}

interface Props {
  planillaMonth: PlanillaMonth
  items: PlanillaItem[]
  entryMap: (itemId: string, day: number) => PlanillaValue | null
  tempMap: (itemId: string, day: number, slot: TimeSlot) => number | null
  onSetValue: (itemId: string, day: number, value: PlanillaValue | null) => void
  onSetNumericValue?: (itemId: string, day: number, slot: TimeSlot, value: number | null) => void
  readonly?: boolean
}

export default function PlanillaGrid({
  planillaMonth, items, entryMap, tempMap, onSetValue, onSetNumericValue, readonly
}: Props) {
  const { year, month } = planillaMonth
  const today           = new Date()
  const isCurrentMonth  = today.getFullYear() === year && (today.getMonth() + 1) === month
  const currentDay      = isCurrentMonth ? today.getDate() : -1
  const totalDays       = daysInMonth(year, month)
  const days            = Array.from({ length: totalDays }, (_, i) => i + 1)

  const handleTap = useCallback((itemId: string, day: number, current: PlanillaValue | null) => {
    if (readonly) return
    const idx  = VALUE_CYCLE.indexOf(current)
    const next = VALUE_CYCLE[(idx + 1) % VALUE_CYCLE.length]
    onSetValue(itemId, day, next)
  }, [onSetValue, readonly])

  // Compliance % per compliance-type item
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

  // For temperature: count filled slots (2 per day)
  const tempCompletion = useCallback((item: PlanillaItem) => {
    let filled = 0
    const total = days.length * 2
    for (const d of days) {
      if (tempMap(item.id, d, 'morning') !== null) filled++
      if (tempMap(item.id, d, 'afternoon') !== null) filled++
    }
    return { filled, total }
  }, [days, tempMap])

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-max text-xs border-collapse">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="sticky left-0 z-20 bg-gray-800 text-left px-3 py-2 min-w-[180px] max-w-[220px] font-semibold border-r border-gray-600">
              Ítem / Equipo
            </th>
            <th className="px-2 py-2 font-semibold border-r border-gray-600 min-w-[36px] text-center">Fr.</th>
            {days.map(d => (
              <th
                key={d}
                className={`px-1 py-2 font-semibold min-w-[44px] text-center border-r border-gray-600 ${
                  d === currentDay ? 'bg-amber-500 text-gray-900' : ''
                }`}
              >
                {d}
              </th>
            ))}
            <th className="px-2 py-2 font-semibold min-w-[70px] text-center bg-gray-700">
              Cumpl.
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, rowIdx) => {
            const isTemp  = item.value_type === 'temperature'
            const bgEven  = rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'

            if (isTemp) {
              const comp = tempCompletion(item)
              return (
                <tr key={item.id} className={bgEven}>
                  {/* Item name — sticky */}
                  <td className={`sticky left-0 z-10 border-r border-gray-200 px-3 py-1 font-medium text-gray-800 truncate max-w-[220px] ${bgEven}`}>
                    <div className="flex items-center gap-1">
                      <span className="truncate">{item.name}</span>
                      {item.equipment_number && (
                        <span className="shrink-0 text-xs bg-blue-100 text-blue-700 px-1 rounded font-mono">
                          #{item.equipment_number}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-blue-500 font-normal">Temperatura °C</div>
                  </td>

                  {/* Frequency */}
                  <td className={`text-center border-r border-gray-200 py-1 font-bold ${FREQ_COLOR[item.frequency]}`}>
                    {FREQ_LABEL[item.frequency]}
                  </td>

                  {/* Day cells — 2 stacked (M/T) */}
                  {days.map(d => {
                    const isPast   = d < currentDay || !isCurrentMonth
                    const isFuture = isCurrentMonth && d > currentDay
                    return (
                      <td
                        key={d}
                        className={`border-r border-gray-100 text-center px-0.5 py-1 ${
                          d === currentDay ? 'border-l-2 border-r-2 border-amber-400 bg-amber-50/30' : ''
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 items-center">
                          <div className="flex items-center gap-0.5">
                            <span className="text-[9px] text-gray-400 w-3">M</span>
                            <TempCell
                              value={tempMap(item.id, d, 'morning')}
                              onSave={v => onSetNumericValue?.(item.id, d, 'morning', v)}
                              readonly={readonly}
                              isPast={isPast}
                              isFuture={isFuture}
                            />
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span className="text-[9px] text-gray-400 w-3">T</span>
                            <TempCell
                              value={tempMap(item.id, d, 'afternoon')}
                              onSave={v => onSetNumericValue?.(item.id, d, 'afternoon', v)}
                              readonly={readonly}
                              isPast={isPast}
                              isFuture={isFuture}
                            />
                          </div>
                        </div>
                      </td>
                    )
                  })}

                  {/* Completion */}
                  <td className="text-center px-2 py-1 border-l border-gray-200 bg-gray-50">
                    <span className={`font-bold text-xs ${comp.filled >= comp.total ? 'text-green-600' : comp.filled > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                      {comp.filled}/{comp.total}
                    </span>
                  </td>
                </tr>
              )
            }

            // ── Compliance row ──────────────────────────────────────────────
            const stats = itemCompliance(item)
            const pct   = stats.filled > 0 ? Math.round((stats.c / stats.filled) * 100) : null

            return (
              <tr key={item.id} className={bgEven}>
                <td className={`sticky left-0 z-10 border-r border-gray-200 px-3 py-1.5 font-medium text-gray-800 truncate max-w-[220px] ${bgEven}`}>
                  {item.name}
                </td>
                <td className={`text-center border-r border-gray-200 py-1.5 font-bold ${FREQ_COLOR[item.frequency]}`}>
                  {FREQ_LABEL[item.frequency]}
                </td>

                {days.map(d => {
                  const val      = entryMap(item.id, d)
                  const isPast   = d < currentDay || !isCurrentMonth
                  const isFuture = isCurrentMonth && d > currentDay
                  return (
                    <td
                      key={d}
                      onClick={() => handleTap(item.id, d, val)}
                      className={`border-r border-gray-100 text-center transition-colors select-none ${
                        readonly || isFuture ? 'cursor-default' : 'cursor-pointer hover:brightness-90'
                      } ${d === currentDay ? 'border-l-2 border-r-2 border-amber-400' : ''}`}
                    >
                      <div className={`mx-auto w-8 h-6 rounded flex items-center justify-center text-xs ${
                        val ? VALUE_STYLE[val] : isPast && !val ? 'bg-red-100 text-red-300' : 'bg-gray-100 text-gray-300'
                      }`}>
                        {val ?? (isPast ? '·' : '')}
                      </div>
                    </td>
                  )
                })}

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
                <span><span className="inline-block w-4 h-4 rounded bg-blue-100 mr-1 align-middle" />M/T: Mañana/Tarde °C</span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
