/**
 * Fiscalizacion — Archivo de Fiscalización SEREMI de Salud
 *
 * Consolidated view for supervisor/admin showing:
 *  - All planilla compliance data for the selected month
 *  - All uploaded documents (RS, contracts, manuals, etc.)
 *  - Print/PDF, WhatsApp share, and email share options
 */

import { useState, useMemo } from 'react'
import {
  Printer, Mail, Share2, FileText, Image as ImageIcon,
  CheckCircle, XCircle, MinusCircle, Calendar, Building2,
  ExternalLink, Download, MessageCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePlanillaMonths } from '@/hooks/usePlanillas'
import { useAllPlanillaDocuments } from '@/hooks/usePlanillas'
import { usePlanillaItemsForMonth } from '@/hooks/usePlanillas'
import { usePlanillaEntries } from '@/hooks/usePlanillas'

// ─── Month/Year picker ────────────────────────────────────────────────────────
function MonthPicker({
  year, month, onChange
}: { year: number; month: number; onChange: (y: number, m: number) => void }) {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-400" />
      <select
        value={month}
        onChange={e => onChange(year, Number(e.target.value))}
        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
      >
        {months.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={e => onChange(Number(e.target.value), month)}
        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
      >
        {[2024, 2025, 2026, 2027].map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Single planilla compliance summary ───────────────────────────────────────
function PlanillaComplianceBlock({ monthId, templateId, label }: {
  monthId: string; templateId: string; label: string | null
}) {
  const { items } = usePlanillaItemsForMonth(monthId, templateId)
  const { entries } = usePlanillaEntries(monthId)

  const stats = useMemo(() => {
    let c = 0, nc = 0, na = 0, empty = 0
    for (const item of items) {
      const e = entries.find(e => e.item_id === item.id && e.day === 1 && e.time_slot === null)
        ?? entries.find(e => e.item_id === item.id)  // fallback for daily items
      if (!e || e.value === null) { empty++; continue }
      if (e.value === 'C') c++
      else if (e.value === 'NC') nc++
      else na++
    }
    const total = items.length
    const pct = total > 0 ? Math.round((c / (total - na)) * 100) : 0
    return { c, nc, na, empty, total, pct }
  }, [items, entries])

  if (items.length === 0) return null

  return (
    <div className="mb-4 print:mb-3">
      <h4 className="text-sm font-semibold text-gray-300 mb-2 print:text-black">
        {label || 'Sin etiqueta'}
      </h4>
      <div className="grid grid-cols-4 gap-2 text-xs mb-2 print:gap-1">
        <div className="bg-green-900/30 border border-green-700 rounded p-2 text-center print:border-green-600">
          <div className="font-bold text-green-400 text-lg print:text-black">{stats.c}</div>
          <div className="text-gray-400 print:text-gray-600">Cumple</div>
        </div>
        <div className="bg-red-900/30 border border-red-700 rounded p-2 text-center print:border-red-600">
          <div className="font-bold text-red-400 text-lg print:text-black">{stats.nc}</div>
          <div className="text-gray-400 print:text-gray-600">No Cumple</div>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded p-2 text-center">
          <div className="font-bold text-gray-400 text-lg print:text-black">{stats.na}</div>
          <div className="text-gray-400 print:text-gray-600">N/A</div>
        </div>
        <div className="bg-blue-900/30 border border-blue-700 rounded p-2 text-center print:border-blue-600">
          <div className="font-bold text-blue-400 text-lg print:text-black">{isNaN(stats.pct) ? '-' : `${stats.pct}%`}</div>
          <div className="text-gray-400 print:text-gray-600">Cumplimiento</div>
        </div>
      </div>

      {/* Item detail */}
      <div className="divide-y divide-gray-700 print:divide-gray-300 text-xs">
        {items.map(item => {
          const e = entries.find(en => en.item_id === item.id && en.day === 1 && en.time_slot === null)
            ?? entries.find(en => en.item_id === item.id)
          const val = e?.value ?? null
          return (
            <div key={item.id} className="flex items-center gap-2 py-1">
              {val === 'C'  && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
              {val === 'NC' && <XCircle     className="w-3.5 h-3.5 text-red-500   flex-shrink-0" />}
              {val === 'NA' && <MinusCircle className="w-3.5 h-3.5 text-gray-500  flex-shrink-0" />}
              {!val         && <div className="w-3.5 h-3.5 rounded-full border border-gray-600 flex-shrink-0" />}
              <span className={`flex-1 ${!val ? 'text-gray-500' : 'text-gray-300 print:text-black'}`}>
                {item.name}
              </span>
              {val && (
                <span className={`font-bold ${
                  val === 'C' ? 'text-green-500' : val === 'NC' ? 'text-red-500' : 'text-gray-400'
                } print:text-black`}>
                  {val}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Fiscalizacion() {
  const { tenant } = useAuth()
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { months, loading: monthsLoading } = usePlanillaMonths(year, month)
  const { documents, loading: docsLoading } = useAllPlanillaDocuments(year, month)

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const periodLabel = `${monthNames[month - 1]} ${year}`

  // Group months by template for display
  const groupedMonths = useMemo(() => {
    const map = new Map<string, typeof months>()
    for (const m of months) {
      const key = m.template_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return map
  }, [months])

  // Share text
  const shareText = encodeURIComponent(
    `Archivo de Fiscalización SEREMI de Salud\n${tenant?.name ?? ''}\nPeriodo: ${periodLabel}\n\nGenerado desde RestoBPM`
  )
  const whatsappUrl = `https://wa.me/?text=${shareText}`
  const mailtoUrl   = `mailto:?subject=${encodeURIComponent(`Archivo Fiscalización - ${tenant?.name} - ${periodLabel}`)}&body=${shareText}`

  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 print:bg-white print:text-black">
      {/* ── Header (hidden in print) ── */}
      <div className="print:hidden sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Archivo de Fiscalización
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Para uso en fiscalización SEREMI de Salud
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <MonthPicker year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-sm font-medium transition-colors"
              title="Imprimir / Guardar como PDF"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm font-medium transition-colors"
              title="Compartir por WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>

            <a
              href={mailtoUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors"
              title="Enviar por correo"
            >
              <Mail className="w-4 h-4" />
              Correo
            </a>
          </div>
        </div>
      </div>

      {/* ── Print header (only in print) ── */}
      <div className="hidden print:block mb-6 border-b-2 border-gray-800 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Archivo de Fiscalización</h1>
            <p className="text-lg font-semibold mt-1">{tenant?.name}</p>
            {tenant?.rut     && <p className="text-sm text-gray-600">RUT: {tenant.rut}</p>}
            {tenant?.address && <p className="text-sm text-gray-600">Dirección: {tenant.address}</p>}
            {tenant?.phone   && <p className="text-sm text-gray-600">Teléfono: {tenant.phone}</p>}
          </div>
          <div className="text-right text-sm text-gray-600">
            <p className="font-bold text-base">{periodLabel}</p>
            <p>Generado: {new Date().toLocaleDateString('es-CL')}</p>
            <p className="mt-2 text-xs">RestoBPM — www.restobpm.cl</p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-6 print:px-0 print:py-0">
        {monthsLoading ? (
          <div className="text-center py-16 text-gray-400 print:hidden">Cargando...</div>
        ) : months.length === 0 ? (
          <div className="text-center py-16 text-gray-500 print:hidden">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay planillas registradas para {periodLabel}.</p>
          </div>
        ) : (
          <>
            {/* ── Section 1: Planilla compliance ── */}
            <section className="mb-8 print:mb-6">
              <h2 className="text-lg font-bold mb-4 border-b border-gray-700 print:border-gray-400 pb-2 print:text-black">
                1. Cumplimiento de Planillas
              </h2>

              {Array.from(groupedMonths.entries()).map(([templateId, tplMonths]) => {
                const templateName = tplMonths[0].template?.name ?? templateId
                return (
                  <div key={templateId} className="mb-6 print:mb-4">
                    <h3 className="text-base font-semibold text-blue-400 mb-3 print:text-blue-700">
                      {templateName}
                    </h3>
                    {tplMonths.map(pm => (
                      <PlanillaComplianceBlock
                        key={pm.id}
                        monthId={pm.id}
                        templateId={pm.template_id}
                        label={pm.label}
                      />
                    ))}
                  </div>
                )
              })}
            </section>

            {/* ── Section 2: Documents ── */}
            <section className="mb-8 print:mb-6">
              <h2 className="text-lg font-bold mb-4 border-b border-gray-700 print:border-gray-400 pb-2 print:text-black">
                2. Documentos y Resoluciones Sanitarias
              </h2>

              {docsLoading ? (
                <p className="text-gray-400 text-sm">Cargando documentos...</p>
              ) : documents.length === 0 ? (
                <p className="text-gray-500 text-sm italic">
                  No hay documentos cargados para este período.
                </p>
              ) : (
                <div className="divide-y divide-gray-700 print:divide-gray-300">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-start gap-3 py-3 print:py-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {doc.file_type === 'pdf'
                          ? <FileText  className="w-5 h-5 text-red-400 print:text-red-600" />
                          : <ImageIcon className="w-5 h-5 text-blue-400 print:text-blue-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 print:text-black">
                          {doc.item_name}
                        </p>
                        <p className="text-xs text-gray-500 print:text-gray-600">
                          {doc.template_name}
                          {doc.file_name && ` · ${doc.file_name}`}
                          {doc.file_size && ` · ${(doc.file_size / 1024).toFixed(0)} KB`}
                        </p>
                        <p className="text-xs text-gray-600 print:text-gray-500">
                          Cargado: {new Date(doc.uploaded_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="print:hidden flex-shrink-0 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 border border-blue-700 rounded hover:border-blue-500 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver
                      </a>
                      {/* Print: show URL as text */}
                      <span className="hidden print:block text-xs text-gray-500 flex-shrink-0 max-w-[160px] truncate">
                        {doc.file_url}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Section 3: Summary ── */}
            <section>
              <h2 className="text-lg font-bold mb-4 border-b border-gray-700 print:border-gray-400 pb-2 print:text-black">
                3. Resumen del Período
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm print:grid-cols-3">
                <div className="bg-gray-800 print:bg-gray-100 rounded p-3">
                  <div className="text-2xl font-bold text-blue-400 print:text-black">{months.length}</div>
                  <div className="text-gray-400 print:text-gray-600 text-xs mt-1">Planillas activas</div>
                </div>
                <div className="bg-gray-800 print:bg-gray-100 rounded p-3">
                  <div className="text-2xl font-bold text-green-400 print:text-black">{documents.length}</div>
                  <div className="text-gray-400 print:text-gray-600 text-xs mt-1">Documentos cargados</div>
                </div>
                <div className="bg-gray-800 print:bg-gray-100 rounded p-3">
                  <div className="text-2xl font-bold text-gray-300 print:text-black">{periodLabel}</div>
                  <div className="text-gray-400 print:text-gray-600 text-xs mt-1">Período</div>
                </div>
              </div>
            </section>

            {/* Print footer */}
            <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
              Documento generado por RestoBPM · {tenant?.name} · {new Date().toLocaleString('es-CL')}
            </div>
          </>
        )}
      </div>

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 12px; }
          .print\\:hidden { display: none !important; }
          .print\\:block  { display: block !important; }
          .print\\:text-black { color: black !important; }
          @page { margin: 1.5cm; size: A4 portrait; }
        }
      `}</style>
    </div>
  )
}
