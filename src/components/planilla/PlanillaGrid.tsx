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

// Compliance M/T cycle: null → C (Cumple) → NC (No Cumple) → CL (Cerrado) → null
const CMT_CYCLE: (PlanillaValue | null)[] = [null, 'C', 'NC', 'CL']
const CMT_STYLE: Record<string, string> = {
  C:  'bg-green-500 text-white font-bold',
  NC: 'bg-red-500 text-white font-bold',
  CL: 'bg-green-100 text-green-700 font-bold border border-green-300',
}
const CMT_LABEL: Record<string, string> = {
  C: 'C',
  NC: 'NC',
  CL: 'C',  // Cerrado shows as "C"
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

// ── Numeric temperature cell ──────────────────────────────────────────────────
interface TempCellProps {
  value: number | 'C' | null
  onSave: (v: number | null) => void
  onMarkClosed?: () => void
  readonly?: boolean
  isPast: boolean
  isFuture: boolean
  isToday: boolean
}

function TempCell({ value, onSave, onMarkClosed, readonly, isPast, isFuture, isToday }: TempCellProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    if (readonly || isFuture) return
    // If currently 'C' (cerrado), open edit to allow changing
    setDraft(value !== null && value !== 'C' ? String(value) : '')
    setEditing(true)
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
  }

  const commit = () => {
    setEditing(false)
    if (draft === '' || draft === '-') { onSave(null); return }
    const n = parseFloat(draft.replace(',', '.'))
    if (!isNaN(n)) onSave(n)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  const handleMarkClosed = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditing(false)
    onMarkClosed?.()
  }

  if (editing) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          className="w-12 h-7 text-center text-xs border-2 border-blue-400 rounded bg-white outline-none font-mono"
        />
        {onMarkClosed && (
          <button
            onMouseDown={handleMarkClosed}
            className="text-[9px] text-gray-500 hover:text-green-700 hover:bg-green-50 px-1 rounded leading-tight whitespace-nowrap border border-gray-200 hover:border-green-300"
          >
            Cerrado
          </button>
        )}
      </div>
    )
  }

  // 'C' = Cerrado → green badge (counts as compliant)
  if (value === 'C') {
    return (
      <div
        onClick={startEdit}
        title={!readonly && !isFuture ? 'Cerrado — toca para editar' : 'Cerrado'}
        className={`w-12 h-7 rounded flex items-center justify-center text-xs font-bold leading-none transition-colors
          bg-green-100 text-green-700 border border-green-300
          ${!readonly && !isFuture ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : 'cursor-default'}`}
      >
        C
      </div>
    )
  }

  const filled = value !== null
  const cellBase = 'w-12 h-7 rounded flex items-center justify-center text-xs font-mono leading-none transition-colors'
  let cellStyle = ''
  if (filled)         cellStyle = 'bg-blue-100 text-blue-800 font-bold border border-blue-200'
  else if (isFuture)  cellStyle = 'bg-gray-50 text-gray-200'
  else if (isToday)   cellStyle = 'bg-amber-50 border border-amber-200 text-amber-300'
  else if (isPast)    cellStyle = 'bg-red-50 border border-red-100 text-red-300'  // no reading = non-compliance
  else                cellStyle = 'bg-gray-50 text-gray-300'

  return (
    <div
      onClick={startEdit}
      title={!readonly && !isFuture ? 'Toca para ingresar temperatura (°C)' : undefined}
      className={`${cellBase} ${cellStyle} ${!readonly && !isFuture ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : 'cursor-default'}`}
    >
      {filled ? `${value}°` : (isPast && !isFuture ? '—' : '')}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  planillaMonth: PlanillaMonth
  items: PlanillaItem[]
  entryMap: (itemId: string, day: number) => PlanillaValue | null
  tempMap: (itemId: string, day: number, slot: TimeSlot) => number | 'C' | null
  complianceMTMap?: (itemId: string, day: number, slot: TimeSlot) => PlanillaValue | null
  onSetValue: (itemId: string, day: number, value: PlanillaValue | null) => void
  onSetNumericValue?: (itemId: string, day: number, slot: TimeSlot, value: number | null) => void
  onMarkTempClosed?: (itemId: string, day: number, slot: TimeSlot) => void
  onSetComplianceMTValue?: (itemId: string, day: number, slot: TimeSlot, value: PlanillaValue | null) => void
  readonly?: boolean
}

// ── Grid ──────────────────────────────────────────────────────────────────────
export default function PlanillaGrid({
  planillaMonth, items, entryMap, tempMap, complianceMTMap, onSetValue, onSetNumericValue, onMarkTempClosed, onSetComplianceMTValue, readonly
}: Props) {
  const { year, month } = planillaMonth
  const today           = new Date()
  const isCurrentMonth  = today.getFullYear() === year && (today.getMonth() + 1) === month
  const currentDay      = isCurrentMonth ? today.getDate() : -1
  const totalDays       = daysInMonth(year, month)
  const days            = Array.from({ length: totalDays }, (_, i) => i + 1)

  const hasTemp         = items.some(i => i.value_type === 'temperature')
  const hasCompliance   = items.some(i => i.value_type === 'compliance')
  const hasComplianceMT = items.some(i => i.value_type === 'compliance_mt')

  const handleTap = useCallback((itemId: string, day: number, current: PlanillaValue | null) => {
    if (readonly) return
    const idx  = VALUE_CYCLE.indexOf(current)
    const next = VALUE_CYCLE[(idx + 1) % VALUE_CYCLE.length]
    onSetValue(itemId, day, next)
  }, [onSetValue, readonly])

  const handleCMTTap = useCallback((itemId: string, day: number, slot: TimeSlot, current: PlanillaValue | null) => {
    if (readonly) return
    const idx  = CMT_CYCLE.indexOf(current)
    const next = CMT_CYCLE[(idx + 1) % CMT_CYCLE.length]
    onSetComplianceMTValue?.(itemId, day, slot, next)
  }, [onSetComplianceMTValue, readonly])

  const itemCompliance = useCallback((item: PlanillaItem) => {
    let c = 0, filled = 0
    for (const d of days) {
      const v = entryMap(item.id, d)
      if (v) { filled++; if (v === 'C') c++ }
    }
    return { c, filled, total: days.length }
  }, [days, entryMap])

  // Count 'C' (cerrado) as filled/compliant for temperature
  const slotCompletion = useCallback((itemId: string, slot: TimeSlot) => {
    let filled = 0
    for (const d of days) { if (tempMap(itemId, d, slot) !== null) filled++ }
    return { filled, total: days.length }
  }, [days, tempMap])

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-max text-xs border-collapse">

        {/* ── HEADER ── */}
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="sticky left-0 z-20 bg-gray-800 text-left px-3 py-2 min-w-[210px] max-w-[250px] font-semibold border-r border-gray-600">
              Ítem
            </th>
            <th className="px-2 py-2 font-semibold border-r border-gray-600 min-w-[28px] text-center text-gray-400 text-[10px]">Fr.</th>
            {days.map(d => (
              <th
                key={d}
                className={`px-0 py-2 font-semibold min-w-[52px] text-center border-r border-gray-600 ${
                  d === currentDay ? 'bg-amber-500 text-gray-900' : ''
                }`}
              >
                {d}
              </th>
            ))}
            <th className="px-2 py-2 font-semibold min-w-[64px] text-center bg-gray-700 text-[10px] uppercase tracking-wide">
              Registro
            </th>
          </tr>
        </thead>

        {/* ── BODY ── */}
        <tbody>
          {items.map((item, rowIdx) => {
            const isTemp = item.value_type === 'temperature'
            const bg     = rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'

            if (isTemp) {
              // ── Temperature item → 2 rows (M and T) ──────────────────────
              const mStats = slotCompletion(item.id, 'morning')
              const tStats = slotCompletion(item.id, 'afternoon')
              const itemLabel = `${item.equipment_number ? `#${item.equipment_number} — ` : ''}${item.name}`

              return (
                <>
                  {/* Mañana row */}
                  <tr key={`${item.id}-m`} className={bg}>
                    <td className={`sticky left-0 z-10 border-r border-gray-200 px-2 py-1.5 ${bg}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white text-[11px] font-extrabold shadow-sm">
                          M
                        </span>
                        <span className="truncate font-semibold text-gray-800 text-xs">{itemLabel}</span>
                      </div>
                    </td>
                    <td className={`text-center border-r border-gray-200 font-bold ${FREQ_COLOR[item.frequency]}`}>
                      {FREQ_LABEL[item.frequency]}
                    </td>
                    {days.map(d => {
                      const isPast   = isCurrentMonth ? d < currentDay : year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1)
                      const isFuture = isCurrentMonth && d > currentDay
                      const isToday  = d === currentDay
                      return (
                        <td key={d} className={`border-r border-gray-100 px-0.5 py-1 ${isToday ? 'bg-amber-50/40' : ''}`}>
                          <div className="flex justify-center">
                            <TempCell
                              value={tempMap(item.id, d, 'morning')}
                              onSave={v => onSetNumericValue?.(item.id, d, 'morning', v)}
                              onMarkClosed={!readonly && !isFuture ? () => onMarkTempClosed?.(item.id, d, 'morning') : undefined}
                              readonly={readonly}
                              isPast={isPast}
                              isFuture={isFuture}
                              isToday={isToday}
                            />
                          </div>
                        </td>
                      )
                    })}
                    <td className="text-center px-1 py-1 border-l border-gray-200 bg-gray-50 whitespace-nowrap">
                      <span className={`font-bold text-xs ${mStats.filled >= mStats.total ? 'text-green-600' : mStats.filled > 0 ? 'text-amber-600' : 'text-red-400'}`}>
                        {mStats.filled}/{mStats.total}
                      </span>
                    </td>
                  </tr>

                  {/* Tarde row */}
                  <tr key={`${item.id}-t`} className={`${bg} border-b-2 border-gray-200`}>
                    <td className={`sticky left-0 z-10 border-r border-gray-200 px-2 py-1.5 ${bg}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md bg-orange-500 text-white text-[11px] font-extrabold shadow-sm">
                          T
                        </span>
                        <span className="truncate text-gray-500 italic text-xs">{itemLabel}</span>
                      </div>
                    </td>
                    <td className="text-center border-r border-gray-200 text-gray-300">—</td>
                    {days.map(d => {
                      const isPast   = isCurrentMonth ? d < currentDay : year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1)
                      const isFuture = isCurrentMonth && d > currentDay
                      const isToday  = d === currentDay
                      return (
                        <td key={d} className={`border-r border-gray-100 px-0.5 py-1 ${isToday ? 'bg-amber-50/40' : ''}`}>
                          <div className="flex justify-center">
                            <TempCell
                              value={tempMap(item.id, d, 'afternoon')}
                              onSave={v => onSetNumericValue?.(item.id, d, 'afternoon', v)}
                              onMarkClosed={!readonly && !isFuture ? () => onMarkTempClosed?.(item.id, d, 'afternoon') : undefined}
                              readonly={readonly}
                              isPast={isPast}
                              isFuture={isFuture}
                              isToday={isToday}
                            />
                          </div>
                        </td>
                      )
                    })}
                    <td className="text-center px-1 py-1 border-l border-gray-200 bg-gray-50 whitespace-nowrap">
                      <span className={`font-bold text-xs ${tStats.filled >= tStats.total ? 'text-green-600' : tStats.filled > 0 ? 'text-amber-600' : 'text-red-400'}`}>
                        {tStats.filled}/{tStats.total}
                      </span>
                    </td>
                  </tr>
                </>
              )
            }

            // ── Compliance M/T item → 2 rows (M and T) with C/NC/CL ──────
            if (item.value_type === 'compliance_mt') {
              const cmtMapFn = complianceMTMap ?? (() => null)
              const mFilled  = days.filter(d => cmtMapFn(item.id, d, 'morning') !== null).length
              const tFilled  = days.filter(d => cmtMapFn(item.id, d, 'afternoon') !== null).length
              const itemLabel = `${item.equipment_number ? `#${item.equipment_number} — ` : ''}${item.name}`

              return (
                <>
                  {/* Mañana row */}
                  <tr key={`${item.id}-m`} className={bg}>
                    <td className={`sticky left-0 z-10 border-r border-gray-200 px-2 py-1.5 ${bg}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white text-[11px] font-extrabold shadow-sm">
                          M
                        </span>
                        <span className="truncate font-semibold text-gray-800 text-xs">{itemLabel}</span>
                      </div>
                    </td>
                    <td className={`text-center border-r border-gray-200 font-bold ${FREQ_COLOR[item.frequency]}`}>
                      {FREQ_LABEL[item.frequency]}
                    </td>
                    {days.map(d => {
                      const val    = cmtMapFn(item.id, d, 'morning')
                      const isPast   = isCurrentMonth ? d < currentDay : year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1)
                      const isFuture = isCurrentMonth && d > currentDay
                      return (
                        <td
                          key={d}
                          onClick={() => !readonly && !isFuture && handleCMTTap(item.id, d, 'morning', val)}
                          className={`border-r border-gray-100 text-center select-none transition-colors ${
                            !readonly && !isFuture ? 'cursor-pointer' : 'cursor-default'
                          } ${d === currentDay ? 'bg-amber-50/40' : ''}`}
                        >
                          <div className={`mx-auto w-9 h-7 rounded flex items-center justify-center text-xs ${
                            val ? CMT_STYLE[val]
                                : isPast ? 'bg-red-50 text-red-300 border border-red-100'
                                : 'bg-gray-100 text-gray-300'
                          }`}>
                            {val ? CMT_LABEL[val] : (isPast ? '—' : '')}
                          </div>
                        </td>
                      )
                    })}
                    <td className="text-center px-1 py-1 border-l border-gray-200 bg-gray-50 whitespace-nowrap">
                      <span className={`font-bold text-xs ${mFilled >= days.length ? 'text-green-600' : mFilled > 0 ? 'text-amber-600' : 'text-red-400'}`}>
                        {mFilled}/{days.length}
                      </span>
                    </td>
                  </tr>

                  {/* Tarde row */}
                  <tr key={`${item.id}-t`} className={`${bg} border-b-2 border-gray-200`}>
                    <td className={`sticky left-0 z-10 border-r border-gray-200 px-2 py-1.5 ${bg}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md bg-orange-500 text-white text-[11px] font-extrabold shadow-sm">
                          T
                        </span>
                        <span className="truncate text-gray-500 italic text-xs">{itemLabel}</span>
                      </div>
                    </td>
                    <td className="text-center border-r border-gray-200 text-gray-300">—</td>
                    {days.map(d => {
                      const val    = cmtMapFn(item.id, d, 'afternoon')
                      const isPast   = isCurrentMonth ? d < currentDay : year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1)
                      const isFuture = isCurrentMonth && d > currentDay
                      return (
                        <td
                          key={d}
                          onClick={() => !readonly && !isFuture && handleCMTTap(item.id, d, 'afternoon', val)}
                          className={`border-r border-gray-100 text-center select-none transition-colors ${
                            !readonly && !isFuture ? 'cursor-pointer' : 'cursor-default'
                          } ${d === currentDay ? 'bg-amber-50/40' : ''}`}
                        >
                          <div className={`mx-auto w-9 h-7 rounded flex items-center justify-center text-xs ${
                            val ? CMT_STYLE[val]
                                : isPast ? 'bg-red-50 text-red-300 border border-red-100'
                                : 'bg-gray-100 text-gray-300'
                          }`}>
                            {val ? CMT_LABEL[val] : (isPast ? '—' : '')}
                          </div>
                        </td>
                      )
                    })}
                    <td className="text-center px-1 py-1 border-l border-gray-200 bg-gray-50 whitespace-nowrap">
                      <span className={`font-bold text-xs ${tFilled >= days.length ? 'text-green-600' : tFilled > 0 ? 'text-amber-600' : 'text-red-400'}`}>
                        {tFilled}/{days.length}
                      </span>
                    </td>
                  </tr>
                </>
              )
            }

            // ── Compliance row (C / NC / NA) ──────────────────────────────
            const stats = itemCompliance(item)
            const pct   = stats.filled > 0 ? Math.round((stats.c / stats.filled) * 100) : null

            return (
              <tr key={item.id} className={bg}>
                <td className={`sticky left-0 z-10 border-r border-gray-200 px-3 py-2 font-medium text-gray-800 truncate max-w-[250px] ${bg}`}>
                  {item.name}
                </td>
                <td className={`text-center border-r border-gray-200 font-bold ${FREQ_COLOR[item.frequency]}`}>
                  {FREQ_LABEL[item.frequency]}
                </td>
                {days.map(d => {
                  const val      = entryMap(item.id, d)
                  const isPast   = isCurrentMonth ? d < currentDay : year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1)
                  const isFuture = isCurrentMonth && d > currentDay
                  return (
                    <td
                      key={d}
                      onClick={() => !readonly && !isFuture && handleTap(item.id, d, val)}
                      className={`border-r border-gray-100 text-center select-none transition-colors ${
                        !readonly && !isFuture ? 'cursor-pointer' : 'cursor-default'
                      } ${d === currentDay ? 'bg-amber-50/40' : ''}`}
                    >
                      <div className={`mx-auto w-9 h-7 rounded flex items-center justify-center text-xs ${
                        val ? VALUE_STYLE[val]
                            : isPast ? 'bg-red-50 text-red-300 border border-red-100'
                            : 'bg-gray-100 text-gray-300'
                      }`}>
                        {val ?? (isPast ? '—' : '')}
                      </div>
                    </td>
                  )
                })}
                <td className="text-center px-2 py-2 border-l border-gray-200 bg-gray-50">
                  {pct !== null
                    ? <span className={`font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                    : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>

        {/* ── LEGEND ── */}
        <tfoot>
          <tr className="bg-gray-100 border-t-2 border-gray-300">
            <td colSpan={2} className="sticky left-0 bg-gray-100 px-3 py-3 font-semibold text-gray-600 text-xs align-top">
              Leyenda
            </td>
            {days.map(d => <td key={d} className="border-r border-gray-200" />)}
            <td className="px-3 py-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-600">
                {hasTemp && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-blue-600 text-white text-[10px] font-bold shrink-0">M</span>
                      <span>Mañana</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-orange-500 text-white text-[10px] font-bold shrink-0">T</span>
                      <span>Tarde</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-4 rounded bg-blue-100 border border-blue-200 shrink-0" />
                      <span>Temp. registrada</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-4 rounded bg-red-50 border border-red-100 shrink-0" />
                      <span>Sin registro</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-4 rounded bg-green-100 border border-green-300 shrink-0" />
                      <span>Cerrado (cumple)</span>
                    </div>
                  </>
                )}
                {hasCompliance && (
                  <>
                    {hasTemp && <div className="col-span-2 border-t border-gray-200 pt-1 mt-0.5 font-semibold text-gray-700">Cumplimiento (C/NC/NA)</div>}
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-4 rounded bg-green-500 shrink-0" />
                      <span>Cumple</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-4 rounded bg-red-500 shrink-0" />
                      <span>No Cumple</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-4 rounded bg-gray-300 shrink-0" />
                      <span>No Aplica</span>
                    </div>
                  </>
                )}
                {hasComplianceMT && (
                  <>
                    {(hasTemp || hasCompliance) && <div className="col-span-2 border-t border-gray-200 pt-1 mt-0.5 font-semibold text-gray-700">Revisión (C/NC + Cerrado)</div>}
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-blue-600 text-white text-[10px] font-bold shrink-0">M</span>
                      <span>Mañana</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-orange-500 text-white text-[10px] font-bold shrink-0">T</span>
                      <span>Tarde</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-4 rounded bg-green-500 shrink-0" />
                      <span>Cumple</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-4 rounded bg-red-500 shrink-0" />
                      <span>No Cumple</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-5 h-4 rounded bg-green-100 border border-green-300 shrink-0" />
                      <span>Cerrado</span>
                    </div>
                  </>
                )}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
