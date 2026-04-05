/**
 * MantenimientoEquiposView — Programa de Mantenimiento de Equipos
 * Registro de mantenciones preventivas y correctivas.
 * D.S. 977/96 Art. 6 (instalaciones y equipos en buen estado).
 */
import { useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Wrench,
  Info, CheckCircle, AlertTriangle, Calendar, ExternalLink
} from 'lucide-react'
import type { PlanillaMonth, TipoMantenimiento, EstadoEquipo } from '@/types'
import { useMantenimiento } from '@/hooks/usePlanillas'
import { useAuth } from '@/contexts/AuthContext'
import ProgramDocUpload from './ProgramDocUpload'

const TIPO_CONFIG: Record<TipoMantenimiento, { label: string; cls: string }> = {
  preventivo:  { label: 'Preventivo',   cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  correctivo:  { label: 'Correctivo',   cls: 'bg-red-100 text-red-800 border-red-200' },
  calibracion: { label: 'Calibración',  cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  inspeccion:  { label: 'Inspección',   cls: 'bg-gray-100 text-gray-700 border-gray-200' },
}

const ESTADO_CONFIG: Record<EstadoEquipo, { label: string; cls: string; icon: React.ReactNode }> = {
  en_servicio:    { label: 'En servicio',    cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle size={12} /> },
  fuera_servicio: { label: 'Fuera de servicio', cls: 'text-red-700 bg-red-50 border-red-200',  icon: <AlertTriangle size={12} /> },
  en_reparacion:  { label: 'En reparación',  cls: 'text-amber-700 bg-amber-50 border-amber-200',  icon: <Wrench size={12} /> },
}

const INITIAL = {
  fecha_mantenimiento: new Date().toISOString().slice(0, 10),
  equipo_nombre:       '',
  equipo_marca:        '',
  equipo_modelo:       '',
  equipo_n_serie:      '',
  tipo_mantenimiento:  'preventivo' as TipoMantenimiento,
  descripcion_trabajo: '',
  empresa_tecnico:     '',
  nombre_tecnico:      '',
  repuestos_utilizados: '',
  costo:               '',
  estado_equipo:       'en_servicio' as EstadoEquipo,
  fecha_proxima:       '',
  observaciones:       '',
}

export default function MantenimientoEquiposView({ month, readOnly = false }: { month: PlanillaMonth; readOnly?: boolean }) {
  const { profile } = useAuth()
  const { records, loading, saving, addRecord, deleteRecord } = useMantenimiento(month.id)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState(INITIAL)
  const [certFile, setCertFile] = useState<File | null>(null)

  const set = (k: keyof typeof INITIAL, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await addRecord({
      fecha_mantenimiento: form.fecha_mantenimiento,
      equipo_nombre:       form.equipo_nombre,
      equipo_marca:        form.equipo_marca || null,
      equipo_modelo:       form.equipo_modelo || null,
      equipo_n_serie:      form.equipo_n_serie || null,
      tipo_mantenimiento:  form.tipo_mantenimiento,
      descripcion_trabajo: form.descripcion_trabajo,
      empresa_tecnico:     form.empresa_tecnico || null,
      nombre_tecnico:      form.nombre_tecnico || null,
      repuestos_utilizados: form.repuestos_utilizados || null,
      costo:               form.costo ? parseFloat(form.costo) : null,
      estado_equipo:       form.estado_equipo,
      fecha_proxima:       form.fecha_proxima || null,
      observaciones:       form.observaciones || null,
    }, certFile)
    if (ok) { setShowForm(false); setForm(INITIAL); setCertFile(null) }
  }, [form, certFile, addRecord])

  const canDelete = profile?.role === 'admin' || profile?.role === 'supervisor'
  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  // Stats
  const fuera     = records.filter(r => r.estado_equipo === 'fuera_servicio').length
  const reparando = records.filter(r => r.estado_equipo === 'en_reparacion').length

  if (loading) return <div className="flex justify-center py-10 text-gray-400 animate-spin text-2xl">⟳</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Wrench size={20} className="text-orange-600" />
            Mantenimiento de Equipos
          </h2>
          <p className="text-sm text-gray-500">
            {records.length} registro{records.length !== 1 ? 's' : ''}
            {fuera > 0 && <span className="ml-2 text-red-600 font-medium">{fuera} fuera de servicio</span>}
            {reparando > 0 && <span className="ml-2 text-amber-600 font-medium">{reparando} en reparación</span>}
          </p>
        </div>
        {!readOnly && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm">
            <Plus size={16} /> Registrar mantención
          </button>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
        <Info size={14} className="mt-0.5 shrink-0" />
        D.S. 977/96 Art. 6 — Equipos e instalaciones deben mantenerse en buenas condiciones. Registrar mantenciones preventivas y correctivas con evidencia.
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Plus size={16} className="text-orange-600" /> Nueva Mantención
          </h3>

          {/* Equipo */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Identificación del equipo</p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className={lbl}>Nombre del equipo *</label>
                <input type="text" required placeholder="Ej: Cámara frigorífica N°1" className={inp} value={form.equipo_nombre} onChange={e => set('equipo_nombre', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Marca</label>
                <input type="text" placeholder="Ej: Zanussi" className={inp} value={form.equipo_marca} onChange={e => set('equipo_marca', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Modelo</label>
                <input type="text" placeholder="Ej: RS04100" className={inp} value={form.equipo_modelo} onChange={e => set('equipo_modelo', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={lbl}>N° de serie</label>
                <input type="text" placeholder="Ej: ZAN2024-00123" className={inp} value={form.equipo_n_serie} onChange={e => set('equipo_n_serie', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Estado del equipo *</label>
                <select required className={inp} value={form.estado_equipo} onChange={e => set('estado_equipo', e.target.value)}>
                  <option value="en_servicio">✅ En servicio</option>
                  <option value="en_reparacion">🔧 En reparación</option>
                  <option value="fuera_servicio">❌ Fuera de servicio</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mantención */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Fecha de mantención *</label>
              <input type="date" required className={inp} value={form.fecha_mantenimiento} onChange={e => set('fecha_mantenimiento', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Tipo de mantención *</label>
              <select required className={inp} value={form.tipo_mantenimiento} onChange={e => set('tipo_mantenimiento', e.target.value)}>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
                <option value="calibracion">Calibración</option>
                <option value="inspeccion">Inspección</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Próxima mantención</label>
              <input type="date" className={inp} value={form.fecha_proxima} onChange={e => set('fecha_proxima', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl}>Descripción del trabajo realizado *</label>
            <input type="text" required placeholder="Ej: Limpieza de condensador, revisión de sellos, carga de gas refrigerante" className={inp} value={form.descripcion_trabajo} onChange={e => set('descripcion_trabajo', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Empresa / Técnico</label>
              <input type="text" placeholder="Empresa de servicio técnico" className={inp} value={form.empresa_tecnico} onChange={e => set('empresa_tecnico', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Nombre del técnico</label>
              <input type="text" placeholder="Nombre del técnico" className={inp} value={form.nombre_tecnico} onChange={e => set('nombre_tecnico', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Costo (CLP)</label>
              <input type="number" min="0" step="1" placeholder="0" className={inp} value={form.costo} onChange={e => set('costo', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Repuestos utilizados</label>
              <input type="text" placeholder="Ej: Filtro HEPA, correa de transmisión" className={inp} value={form.repuestos_utilizados} onChange={e => set('repuestos_utilizados', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Certificado / Informe técnico</label>
              <ProgramDocUpload label="Adjuntar informe (PDF o imagen)" file={certFile} onChange={setCertFile} />
            </div>
          </div>
          <div>
            <label className={lbl}>Observaciones</label>
            <input type="text" placeholder="Notas adicionales..." className={inp} value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => { setShowForm(false); setForm(INITIAL); setCertFile(null) }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <><span className="animate-spin">⟳</span> Guardando...</> : <><CheckCircle size={15} /> Guardar</>}
            </button>
          </div>
        </form>
      )}

      {records.length === 0 && !showForm ? (
        <div className="text-center py-12 text-gray-400">
          <Wrench size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin registros de mantención.</p>
          {!readOnly && <button onClick={() => setShowForm(true)} className="mt-2 text-orange-600 text-sm hover:underline">+ Registrar primera mantención</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(r => {
            const isExpanded = expanded === r.id
            const tipo   = TIPO_CONFIG[r.tipo_mantenimiento]
            const estado = ESTADO_CONFIG[r.estado_equipo]
            const vence  = r.fecha_proxima ? parseISO(r.fecha_proxima) : null
            const vencido = vence && vence < new Date()
            return (
              <div key={r.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-sm ${r.estado_equipo === 'fuera_servicio' ? 'border-red-200' : vencido ? 'border-amber-200' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${tipo.cls}`}>
                    {tipo.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.equipo_nombre}
                      {r.equipo_marca ? <span className="text-gray-400 font-normal"> · {r.equipo_marca}</span> : null}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {format(parseISO(r.fecha_mantenimiento), 'dd/MM/yyyy')}
                      {r.empresa_tecnico ? ` · ${r.empresa_tecnico}` : ''}
                    </p>
                  </div>
                  <div className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border ${estado.cls}`}>
                    {estado.icon} <span className="hidden sm:inline">{estado.label}</span>
                  </div>
                  {r.fecha_proxima && (
                    <div className={`shrink-0 text-xs hidden sm:flex items-center gap-1 ${vencido ? 'text-amber-600' : 'text-gray-400'}`}>
                      <Calendar size={11} />
                      {format(parseISO(r.fecha_proxima), 'dd/MM/yy')}
                    </div>
                  )}
                  {r.certificado_url && <ExternalLink size={15} className="text-blue-400 shrink-0" />}
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {r.equipo_modelo   && <div><p className="text-xs text-gray-400 uppercase">Modelo</p><p className="font-medium">{r.equipo_modelo}</p></div>}
                      {r.equipo_n_serie  && <div><p className="text-xs text-gray-400 uppercase">N° Serie</p><p className="font-medium">{r.equipo_n_serie}</p></div>}
                      {r.nombre_tecnico  && <div><p className="text-xs text-gray-400 uppercase">Técnico</p><p className="font-medium">{r.nombre_tecnico}</p></div>}
                      {r.costo !== null && r.costo !== undefined && (
                        <div><p className="text-xs text-gray-400 uppercase">Costo</p><p className="font-medium">${r.costo.toLocaleString('es-CL')}</p></div>
                      )}
                      <div className="col-span-2 sm:col-span-4">
                        <p className="text-xs text-gray-400 uppercase">Trabajo realizado</p>
                        <p className="font-medium">{r.descripcion_trabajo}</p>
                      </div>
                      {r.repuestos_utilizados && (
                        <div className="col-span-2"><p className="text-xs text-gray-400 uppercase">Repuestos</p><p className="font-medium">{r.repuestos_utilizados}</p></div>
                      )}
                      {r.fecha_proxima && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-400 uppercase flex items-center gap-1"><Calendar size={10} /> Próxima mantención</p>
                          <p className={`font-medium ${vencido ? 'text-amber-700' : 'text-gray-800'}`}>
                            {format(parseISO(r.fecha_proxima), 'dd/MM/yyyy')}
                            {vencido && <span className="ml-2 text-amber-600 text-xs">⚠ Vencida</span>}
                          </p>
                        </div>
                      )}
                      {r.observaciones && (
                        <div className="col-span-2 sm:col-span-4"><p className="text-xs text-gray-400 uppercase">Observaciones</p><p className="font-medium text-amber-700">{r.observaciones}</p></div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      {r.certificado_url ? (
                        <a href={r.certificado_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                          <ExternalLink size={14} /> {r.certificado_nombre ?? 'Ver informe técnico'}
                        </a>
                      ) : <span className="text-xs text-gray-400">Sin informe adjunto</span>}
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
