/**
 * FumigacionView — Programa de Fumigación
 * Registro de fumigaciones con empresa, producto SAG, áreas, certificado
 * Periodo: mensual | bimestral | trimestral  (D.S. 977/96 Art. 14)
 */
import { useState, useCallback } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Shield,
  Info, Calendar, CheckCircle, AlertTriangle, ExternalLink, FileText
} from 'lucide-react'
import type { PlanillaMonth, FumigacionPeriodo } from '@/types'
import { useFumigacion } from '@/hooks/usePlanillas'
import { useAuth } from '@/contexts/AuthContext'
import ProgramDocUpload from './ProgramDocUpload'

const PERIODO_LABELS: Record<FumigacionPeriodo, string> = {
  mensual: 'Mensual', bimestral: 'Bimestral', trimestral: 'Trimestral',
}
const PERIODO_COLORS: Record<FumigacionPeriodo, string> = {
  mensual: 'bg-purple-100 text-purple-800 border-purple-200',
  bimestral: 'bg-blue-100 text-blue-800 border-blue-200',
  trimestral: 'bg-indigo-100 text-indigo-800 border-indigo-200',
}

const INITIAL = {
  fecha_fumigacion:  new Date().toISOString().slice(0, 10),
  empresa_fumigadora: '',
  nombre_tecnico:    '',
  n_registro_sag:    '',
  producto_utilizado: '',
  dosis:             '',
  areas_tratadas:    '',
  plagas_objetivo:   '',
  periodo:           'mensual' as FumigacionPeriodo,
  fecha_proxima:     '',
  observaciones:     '',
}

function calcProxima(fecha: string, periodo: FumigacionPeriodo): string {
  if (!fecha) return ''
  const days = periodo === 'mensual' ? 30 : periodo === 'bimestral' ? 60 : 90
  return format(addDays(parseISO(fecha), days), 'yyyy-MM-dd')
}

export default function FumigacionView({ month, readOnly = false }: { month: PlanillaMonth; readOnly?: boolean }) {
  const { profile } = useAuth()
  const { records, loading, saving, addRecord, deleteRecord } = useFumigacion(month.id)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState(INITIAL)
  const [certFile, setCertFile] = useState<File | null>(null)

  const set = (k: keyof typeof INITIAL, v: string) =>
    setForm(prev => {
      const next = { ...prev, [k]: v }
      if ((k === 'fecha_fumigacion' || k === 'periodo') && next.fecha_fumigacion)
        next.fecha_proxima = calcProxima(next.fecha_fumigacion, next.periodo as FumigacionPeriodo)
      return next
    })

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await addRecord({
      fecha_fumigacion:  form.fecha_fumigacion,
      empresa_fumigadora: form.empresa_fumigadora,
      nombre_tecnico:    form.nombre_tecnico || null,
      n_registro_sag:    form.n_registro_sag || null,
      producto_utilizado: form.producto_utilizado || null,
      dosis:             form.dosis || null,
      areas_tratadas:    form.areas_tratadas || null,
      plagas_objetivo:   form.plagas_objetivo || null,
      periodo:           form.periodo as FumigacionPeriodo,
      fecha_proxima:     form.fecha_proxima || null,
      observaciones:     form.observaciones || null,
    }, certFile)
    if (ok) { setShowForm(false); setForm(INITIAL); setCertFile(null) }
  }, [form, certFile, addRecord])

  const canDelete = profile?.role === 'admin' || profile?.role === 'supervisor'
  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  if (loading) return <div className="flex justify-center py-10 text-gray-400 animate-spin text-2xl">⟳</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Shield size={20} className="text-purple-600" />
            Programa de Fumigación
          </h2>
          <p className="text-sm text-gray-500">{records.length} registro{records.length !== 1 ? 's' : ''}</p>
        </div>
        {!readOnly && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 shadow-sm">
            <Plus size={16} /> Nueva fumigación
          </button>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700">
        <Info size={14} className="mt-0.5 shrink-0" />
        D.S. 977/96 Art. 14 — Control de plagas obligatorio. Registrar empresa, producto (N° SAG), áreas y periodicidad.
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Plus size={16} className="text-purple-600" /> Nueva Fumigación
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Fecha *</label>
              <input type="date" required className={inp} value={form.fecha_fumigacion} onChange={e => set('fecha_fumigacion', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Empresa fumigadora *</label>
              <input type="text" required placeholder="Ej: PestControl SpA" className={inp} value={form.empresa_fumigadora} onChange={e => set('empresa_fumigadora', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Técnico aplicador</label>
              <input type="text" placeholder="Nombre del técnico" className={inp} value={form.nombre_tecnico} onChange={e => set('nombre_tecnico', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>N° Registro SAG</label>
              <input type="text" placeholder="Ej: SAG-12345" className={inp} value={form.n_registro_sag} onChange={e => set('n_registro_sag', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Producto utilizado</label>
              <input type="text" placeholder="Ej: Cipermetrina 5%" className={inp} value={form.producto_utilizado} onChange={e => set('producto_utilizado', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Dosis / Concentración</label>
              <input type="text" placeholder="Ej: 10 mL/L agua" className={inp} value={form.dosis} onChange={e => set('dosis', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Áreas tratadas</label>
              <input type="text" placeholder="Ej: Cocina, bodega, baños, perímetro" className={inp} value={form.areas_tratadas} onChange={e => set('areas_tratadas', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Plagas objetivo</label>
              <input type="text" placeholder="Ej: Cucarachas, roedores, mosquitos" className={inp} value={form.plagas_objetivo} onChange={e => set('plagas_objetivo', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Periodicidad *</label>
              <select required className={inp} value={form.periodo} onChange={e => set('periodo', e.target.value)}>
                <option value="mensual">Mensual (cada 30 días)</option>
                <option value="bimestral">Bimestral (cada 60 días)</option>
                <option value="trimestral">Trimestral (cada 90 días)</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Próxima fumigación</label>
              <input type="date" className={inp} value={form.fecha_proxima} onChange={e => set('fecha_proxima', e.target.value)} />
            </div>
            <div className="flex items-end">
              <div className="w-full">
                <label className={lbl}>Certificado / Comprobante</label>
                <ProgramDocUpload label="Adjuntar PDF o imagen" file={certFile} onChange={setCertFile} />
              </div>
            </div>
          </div>
          <div>
            <label className={lbl}>Observaciones</label>
            <input type="text" placeholder="Condiciones especiales, restricciones de acceso..." className={inp} value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => { setShowForm(false); setForm(INITIAL); setCertFile(null) }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <><span className="animate-spin">⟳</span> Guardando...</> : <><CheckCircle size={15} /> Guardar</>}
            </button>
          </div>
        </form>
      )}

      {records.length === 0 && !showForm ? (
        <div className="text-center py-12 text-gray-400">
          <Shield size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin registros de fumigación.</p>
          {!readOnly && <button onClick={() => setShowForm(true)} className="mt-2 text-purple-600 text-sm hover:underline">+ Registrar primera fumigación</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(r => {
            const isExpanded = expanded === r.id
            const vence = r.fecha_proxima ? parseISO(r.fecha_proxima) : null
            const vencido = vence && vence < new Date()
            return (
              <div key={r.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm ${vencido ? 'border-red-200' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${PERIODO_COLORS[r.periodo]}`}>
                    {PERIODO_LABELS[r.periodo]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.empresa_fumigadora}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(r.fecha_fumigacion), 'dd/MM/yyyy')}
                      {r.producto_utilizado ? ` · ${r.producto_utilizado}` : ''}
                    </p>
                  </div>
                  {r.fecha_proxima && (
                    <div className={`shrink-0 text-right hidden sm:block ${vencido ? 'text-red-600' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-1 text-xs">
                        {vencido ? <AlertTriangle size={12} /> : <Calendar size={12} />}
                        Próx: {format(parseISO(r.fecha_proxima), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  )}
                  {r.certificado_url && <FileText size={16} className="text-blue-500 shrink-0" aria-label="Certificado adjunto" />}
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {r.nombre_tecnico && <div><p className="text-xs text-gray-400 uppercase">Técnico</p><p className="font-medium">{r.nombre_tecnico}</p></div>}
                      {r.n_registro_sag && <div><p className="text-xs text-gray-400 uppercase">Reg. SAG</p><p className="font-medium">{r.n_registro_sag}</p></div>}
                      {r.producto_utilizado && <div><p className="text-xs text-gray-400 uppercase">Producto</p><p className="font-medium">{r.producto_utilizado}</p></div>}
                      {r.dosis && <div><p className="text-xs text-gray-400 uppercase">Dosis</p><p className="font-medium">{r.dosis}</p></div>}
                      {r.areas_tratadas && <div className="col-span-2"><p className="text-xs text-gray-400 uppercase">Áreas tratadas</p><p className="font-medium">{r.areas_tratadas}</p></div>}
                      {r.plagas_objetivo && <div className="col-span-2"><p className="text-xs text-gray-400 uppercase">Plagas objetivo</p><p className="font-medium">{r.plagas_objetivo}</p></div>}
                      {r.observaciones && <div className="col-span-2 sm:col-span-4"><p className="text-xs text-gray-400 uppercase">Observaciones</p><p className="font-medium text-amber-700">{r.observaciones}</p></div>}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      {r.certificado_url ? (
                        <a href={r.certificado_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                          <ExternalLink size={14} /> {r.certificado_nombre ?? 'Ver certificado'}
                        </a>
                      ) : <span className="text-xs text-gray-400">Sin certificado adjunto</span>}
                      {canDelete && !readOnly && (
                        <button onClick={() => { if (confirm('¿Eliminar registro?')) { setDeleting(r.id); deleteRecord(r.id).finally(() => setDeleting(null)) } }}
                          disabled={deleting === r.id}
                          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 disabled:opacity-50">
                          <Trash2 size={14} /> {deleting === r.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
