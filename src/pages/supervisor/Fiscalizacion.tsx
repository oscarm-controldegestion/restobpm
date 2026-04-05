/**
 * Archivo de Fiscalización — SEREMI de Salud
 *
 * Muestra el contenido completo de las planillas del rango seleccionado:
 * - Planillas del mes anterior (o rango elegido): firmadas / completadas
 * - Mes actual: lo que se lleve avanzado
 * - Cada ítem con su estado (C / NC / NA / sin registro)
 * - Documentos adjuntos al final de cada planilla
 * - Sin indicadores de cumplimiento
 * - Imprimible, compartible por WhatsApp y correo
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Printer, Mail, MessageCircle, Calendar, Building2,
  CheckCircle2, XCircle, MinusCircle, Circle,
  FileText, Image as ImageIcon, ExternalLink, ShieldCheck
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { usePlanillaMonthsRange } from '@/hooks/usePlanillas'
import type { PlanillaItem, PlanillaEntry, PlanillaDocument, PlanillaMonth } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function prevMonth(y: number, m: number) {
  if (m === 1) return { year: y - 1, month: 12 }
  return { year: y, month: m - 1 }
}

// ─── Month/Year selector ──────────────────────────────────────────────────────
function MonthSelect({ label, year, month, onChange }: {
  label: string; year: number; month: number
  onChange: (y: number, m: number) => void
}) {
  const years = [2024, 2025, 2026, 2027]
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex gap-1">
        <select
          value={month}
          onChange={e => onChange(year, Number(e.target.value))}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
        >
          {MONTH_NAMES.slice(1).map((name, i) => (
            <option key={i} value={i + 1}>{name}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => onChange(Number(e.target.value), month)}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  )
}

// ─── Single planilla block ────────────────────────────────────────────────────
function PlanillaBlock({ pm }: { pm: PlanillaMonth }) {
  const [items,     setItems]     = useState<PlanillaItem[]>([])
  const [entries,   setEntries]   = useState<PlanillaEntry[]>([])
  const [documents, setDocuments] = useState<PlanillaDocument[]>([])

  useEffect(() => {
    // Load items (respecting month_items assignments if any)
    const loadItems = async () => {
      const { data: mItems } = await supabase
        .from('planilla_month_items').select('item_id').eq('month_id', pm.id)
      const assignedIds = (mItems ?? []).map((r: any) => r.item_id)

      const { data: allItems } = await supabase
        .from('planilla_items').select('*')
        .eq('template_id', pm.template_id).eq('active', true).order('order_index')
      const all = (allItems ?? []) as PlanillaItem[]
      setItems(assignedIds.length > 0 ? all.filter(i => assignedIds.includes(i.id)) : all)
    }

    const loadEntries = async () => {
      const { data } = await supabase
        .from('planilla_entries').select('*').eq('month_id', pm.id)
      setEntries((data ?? []) as PlanillaEntry[])
    }

    const loadDocs = async () => {
      const { data } = await supabase
        .from('planilla_documents').select('*, item:planilla_items(name)')
        .eq('month_id', pm.id)
      setDocuments((data ?? []) as any)
    }

    loadItems(); loadEntries(); loadDocs()
  }, [pm.id, pm.template_id])

  const isMonthly = items.length > 0 && items.every(i => i.frequency === 'monthly')

  // Get status for an item
  const getVal = (itemId: string, day = 1) => {
    // For monthly items use day=1; for daily get all filled entries
    const e = entries.find(e =>
      e.item_id === itemId &&
      (isMonthly ? e.day === 1 : true) &&
      e.time_slot === null &&
      e.value !== null
    )
    return e?.value ?? null
  }

  // For daily planillas: count entries per item per day
  const getDailyEntries = (itemId: string): Array<{ day: number; value: string | null }> => {
    const byDay: Record<number, string | null> = {}
    for (const e of entries) {
      if (e.item_id === itemId && e.time_slot === null && e.value !== null) {
        byDay[e.day] = e.value
      }
    }
    const daysInMonth = new Date(pm.year, pm.month, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1, value: byDay[i + 1] ?? null
    }))
  }

  const statusCfg: Record<string, { label: string; cls: string }> = {
    pending:     { label: 'Pendiente',  cls: 'bg-gray-100 text-gray-600' },
    in_progress: { label: 'En curso',   cls: 'bg-blue-100 text-blue-700' },
    completed:   { label: 'Completada', cls: 'bg-green-100 text-green-700' },
    signed:      { label: 'Firmada',    cls: 'bg-purple-100 text-purple-700' },
  }
  const cfg = statusCfg[pm.status] ?? statusCfg.pending

  return (
    <div className="mb-6 border border-gray-700 print:border-gray-400 rounded-lg overflow-hidden print:break-inside-avoid">
      {/* Header */}
      <div className="bg-gray-800 print:bg-gray-100 px-4 py-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-white print:text-black">
            {pm.template?.name ?? 'Planilla'}
            {pm.label ? <span className="font-normal text-gray-300 print:text-gray-600"> — {pm.label}</span> : null}
          </h3>
          <p className="text-sm text-gray-400 print:text-gray-600 mt-0.5">
            {MONTH_NAMES[pm.month]} {pm.year}
            {pm.area_id && ' · Área asignada'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.cls}`}>
            {cfg.label}
          </span>
          {pm.status === 'signed' && pm.signed_at && (
            <span className="text-xs text-gray-400 print:text-gray-600">
              Firmada el {new Date(pm.signed_at).toLocaleDateString('es-CL', {
                day: '2-digit', month: 'long', year: 'numeric'
              })}
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3">
        {isMonthly ? (
          // Monthly checklist
          <div className="divide-y divide-gray-700 print:divide-gray-300">
            {items.map((item, idx) => {
              const val = getVal(item.id)
              const doc = (documents as any[]).find((d: any) => d.item_id === item.id)
              return (
                <div key={item.id} className="flex items-start gap-3 py-2">
                  <span className="text-gray-500 text-xs w-5 pt-0.5 flex-shrink-0">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-200 print:text-black">{item.name}</span>
                    {/* Attached doc */}
                    {doc && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {doc.file_type === 'pdf'
                          ? <FileText  className="w-3 h-3 text-red-400 flex-shrink-0" />
                          : <ImageIcon className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        }
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 print:text-blue-700 truncate max-w-[200px]"
                          title={doc.file_name}
                        >
                          {doc.file_name}
                          <ExternalLink className="inline w-2.5 h-2.5 ml-0.5" />
                        </a>
                      </div>
                    )}
                    {item.requires_document && !doc && (
                      <p className="text-xs text-amber-500 mt-0.5">⚠ Documento pendiente</p>
                    )}
                  </div>
                  {/* Status */}
                  <div className="flex-shrink-0">
                    {val === 'C'  && <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500 print:text-green-700"><CheckCircle2 className="w-4 h-4" /> C</span>}
                    {val === 'NC' && <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500   print:text-red-700"  ><XCircle      className="w-4 h-4" /> NC</span>}
                    {val === 'NA' && <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400  print:text-gray-600" ><MinusCircle  className="w-4 h-4" /> NA</span>}
                    {!val         && <span className="inline-flex items-center gap-1 text-xs text-gray-600 print:text-gray-400"            ><Circle       className="w-4 h-4" /> —</span>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Daily planilla — compact table
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-xs border-collapse min-w-[600px] print:min-w-0">
              <thead>
                <tr>
                  <th className="text-left py-1 pr-2 text-gray-400 print:text-gray-600 font-medium w-1/3">Ítem</th>
                  {Array.from({ length: new Date(pm.year, pm.month, 0).getDate() }, (_, i) => (
                    <th key={i} className="w-6 text-center text-gray-500 print:text-gray-500 font-normal pb-1">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 print:divide-gray-300">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="py-1 pr-2 text-gray-300 print:text-black align-top">
                      {item.name}
                      {item.equipment_number && (
                        <span className="text-gray-500 ml-1">#{item.equipment_number}</span>
                      )}
                    </td>
                    {getDailyEntries(item.id).map(({ day, value }) => (
                      <td key={day} className="text-center py-1 align-middle">
                        {value === 'C'  && <span className="text-green-500 print:text-green-700 font-bold">C</span>}
                        {value === 'NC' && <span className="text-red-500   print:text-red-700   font-bold">NC</span>}
                        {value === 'NA' && <span className="text-gray-500  print:text-gray-500">NA</span>}
                        {value === 'CL' && <span className="text-blue-500  print:text-blue-700  font-bold">CL</span>}
                        {!value         && <span className="text-gray-700  print:text-gray-300">·</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length === 0 && (
          <p className="text-sm text-gray-500 italic py-2">Sin ítems configurados.</p>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Fiscalizacion() {
  const { tenant } = useAuth()
  const now = new Date()
  const curYear  = now.getFullYear()
  const curMonth = now.getMonth() + 1
  const prev = prevMonth(curYear, curMonth)

  // Default range: last month → current month
  const [fromYear,  setFromYear]  = useState(prev.year)
  const [fromMonth, setFromMonth] = useState(prev.month)
  const [toYear,    setToYear]    = useState(curYear)
  const [toMonth,   setToMonth]   = useState(curMonth)

  const { months, loading } = usePlanillaMonthsRange(fromYear, fromMonth, toYear, toMonth)

  const periodLabel = fromYear === toYear && fromMonth === toMonth
    ? `${MONTH_NAMES[fromMonth]} ${fromYear}`
    : `${MONTH_NAMES[fromMonth]} ${fromYear} – ${MONTH_NAMES[toMonth]} ${toYear}`

  const shareText = encodeURIComponent(
    `Archivo de Fiscalización SEREMI de Salud\n${tenant?.name ?? ''}\nPeríodo: ${periodLabel}\n\nRestoBPM — www.restobpm.cl`
  )
  const whatsappUrl = `https://wa.me/?text=${shareText}`
  const mailtoUrl   = `mailto:?subject=${encodeURIComponent(`Archivo Fiscalización – ${tenant?.name} – ${periodLabel}`)}&body=${shareText}`

  // Group months by (year, month) then by template within each period
  const periods = (() => {
    const map = new Map<string, PlanillaMonth[]>()
    for (const m of months) {
      const key = `${m.year}-${String(m.month).padStart(2,'0')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  })()

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 print:bg-white print:text-black">

      {/* ── Toolbar (hidden in print) ── */}
      <div className="print:hidden sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Archivo de Fiscalización
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Planillas completas para fiscalización SEREMI de Salud
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <MonthSelect
              label="Desde"
              year={fromYear} month={fromMonth}
              onChange={(y, m) => { setFromYear(y); setFromMonth(m) }}
            />
            <MonthSelect
              label="Hasta"
              year={toYear} month={toMonth}
              onChange={(y, m) => { setToYear(y); setToMonth(m) }}
            />

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
            <a
              href={whatsappUrl}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href={mailtoUrl}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
            >
              <Mail className="w-4 h-4" />
              Correo
            </a>
          </div>
        </div>
      </div>

      {/* ── Print cover ── */}
      <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Archivo de Fiscalización</h1>
            <h2 className="text-xl font-semibold mt-1">{tenant?.name}</h2>
            {(tenant as any)?.rut     && <p className="text-sm text-gray-600 mt-1">RUT: {(tenant as any).rut}</p>}
            {(tenant as any)?.address && <p className="text-sm text-gray-600">Dirección: {(tenant as any).address}</p>}
            {(tenant as any)?.phone   && <p className="text-sm text-gray-600">Teléfono: {(tenant as any).phone}</p>}
          </div>
          <div className="text-right text-sm text-gray-600">
            <p className="font-bold text-base">{periodLabel}</p>
            <p>Emitido: {new Date().toLocaleDateString('es-CL', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}</p>
            <p className="mt-2 text-xs italic">RestoBPM · www.restobpm.cl</p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 print:px-0 print:py-0">
        {loading ? (
          <div className="text-center py-20 text-gray-400 print:hidden">
            Cargando planillas...
          </div>
        ) : periods.length === 0 ? (
          <div className="text-center py-20 text-gray-500 print:hidden">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay planillas registradas para el período seleccionado.</p>
          </div>
        ) : (
          periods.map(([key, pms]) => {
            const [y, m] = key.split('-').map(Number)
            const isCurrent = y === curYear && m === curMonth

            return (
              <section key={key} className="mb-10 print:mb-8">
                {/* Period heading */}
                <div className="flex items-center gap-3 mb-4 print:mb-3">
                  <Calendar className="w-5 h-5 text-blue-400 print:text-blue-700" />
                  <h2 className="text-lg font-bold text-white print:text-black">
                    {MONTH_NAMES[m]} {y}
                  </h2>
                  {isCurrent && (
                    <span className="text-xs bg-blue-900 print:bg-blue-100 text-blue-300 print:text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      Mes en curso
                    </span>
                  )}
                  <div className="flex-1 border-t border-gray-700 print:border-gray-400" />
                </div>

                {/* Planillas for this period */}
                {pms.map(pm => (
                  <PlanillaBlock key={pm.id} pm={pm} />
                ))}
              </section>
            )
          })
        )}
      </div>

      {/* Print footer */}
      <div className="hidden print:block fixed bottom-0 left-0 right-0 border-t border-gray-300 py-2 px-4 text-xs text-gray-400 text-center">
        {tenant?.name} · Archivo de Fiscalización · {periodLabel} · RestoBPM
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 11px; }
          .print\\:hidden  { display: none !important; }
          .print\\:block   { display: block !important; }
          @page { margin: 1.5cm; size: A4 portrait; }
        }
      `}</style>
    </div>
  )
}
