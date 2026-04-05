/**
 * CapacitacionView — Programa de Capacitación del Personal
 * Registra capacitaciones con tema, instructor, participantes,
 * evaluación y evidencia documental. D.S. 977/96 Art. 52.
 */
import { useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Plus, Trash2, ChevronDown, ChevronUp, GraduationCap,
  Info, CheckCircle, Users, Clock, ExternalLink
} from 'lucide-react'
import type { PlanillaMonth, TipoInstructor, EvaluacionResult } from '@/types'
import { useCapacitacion } from '@/hooks/usePlanillas'
import { useAuth } from '@/contexts/AuthContext'
import ProgramDocUpload from './ProgramDocUpload'

const EVAL_CONFIG: Record<EvaluacionResult, { label: string; cls: string }> = {
  aprobado:       { label: 'Aprobado',        cls: 'bg-green-100 text-green-800 border-green-200' },
  reprobado:      { label: 'Reprobado',       cls: 'bg-red-100 text-red-800 border-red-200' },
  pendiente:      { label: 'Pendiente',       cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  sin_evaluacion: { label: 'Sin evaluación',  cls: 'bg-gray-100 text-gray-600 border-gray-200' },
}
const INSTRUCTOR_LABELS: Record<TipoInstructor, string> = {
  interno: 'Instructor interno', externo: 'Instructor externo', online: 'Online / E-learning',
}

const INITIAL = {
  fecha:               new Date().toISOString().slice(0, 10),
  tema:                '',
  objetivos:           '',
  tipo_instructor:     'interno' as TipoInstructor,
  nombre_instructor:   '',
  empresa_instructor:  '',
  duracion_horas:      '',
  n_participantes:     '',
  lista_participantes: '',
  evaluacion:          'pendiente' as EvaluacionResult,
  puntaje_promedio:    '',
  observaciones:       '',
}

export default function CapacitacionView({ month, readOnly = false }: { month: PlanillaMonth; readOnly?: boolean }) {
  const { profile } = useAuth()
  const { records, loading, saving, addRecord, deleteRecord } = useCapacitacion(month.id)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState(INITIAL)
  const [certFile, setCertFile]         = useState<File | null>(null)
  const [materialFile, setMaterialFile] = useState<File | null>(null)

  const set = (k: keyof typeof INITIAL, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await addRecord({
      fecha:               form.fecha,
      tema:                form.tema,
      objetivos:           form.objetivos || null,
      tipo_instructor:     form.tipo_instructor,
      nombre_instructor:   form.nombre_instructor || null,
      empresa_instructor:  form.empresa_instructor || null,
      duracion_horas:      form.duracion_horas ? parseFloat(form.duracion_horas) : null,
      n_participantes:     form.n_participantes ? parseInt(form.n_participantes) : null,
      lista_participantes: form.lista_participantes || null,
      evaluacion:          form.evaluacion,
      puntaje_promedio:    form.puntaje_promedio ? parseFloat(form.puntaje_promedio) : null,
      observaciones:       form.observaciones || null,
    }, certFile, materialFile)
    if (ok) { setShowForm(false); setForm(INITIAL); setCertFile(null); setMaterialFile(null) }
  }, [form, certFile, materialFile, addRecord])

  const canDelete = profile?.role === 'admin' || profile?.role === 'supervisor'
  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none'
  const lbl = 'block text-xs font-medium text-gray-600 mb-1'

  if (loading) return <div className="flex justify-center py-10 text-gray-400 animate-spin text-2xl">⟳</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <GraduationCap size={20} className="text-emerald-600" />
            Programa de Capacitación
          </h2>
          <p className="text-sm text-gray-500">{records.length} capacitación{records.length !== 1 ? 'es' : ''}</p>
        </div>
        {!readOnly && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm">
            <Plus size={16} /> Registrar capacitación
          </button>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
        <Info size={14} className="mt-0.5 shrink-0" />
        D.S. 977/96 Art. 52 — Todo manipulador debe recibir capacitación periódica en higiene y BPM. Registrar tema, asistentes y resultado de evaluación.
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Plus size={16} className="text-emerald-600" /> Nueva Capacitación
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Fecha *</label>
              <input type="date" required className={inp} value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Tema / Nombre de la capacitación *</label>
              <input type="text" required placeholder="Ej: Higiene personal y BPM en manipulación de alimentos" className={inp} value={form.tema} onChange={e => set('tema', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl}>Objetivos / Descripción</label>
            <input type="text" placeholder="¿Qué se espera lograr con esta capacitación?" className={inp} value={form.objetivos} onChange={e => set('objetivos', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Tipo de instructor *</label>
              <select required className={inp} value={form.tipo_instructor} onChange={e => set('tipo_instructor', e.target.value)}>
                <option value="interno">Interno</option>
                <option value="externo">Externo / Empresa</option>
                <option value="online">Online / E-learning</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Nombre del instructor</label>
              <input type="text" placeholder="Nombre completo" className={inp} value={form.nombre_instructor} onChange={e => set('nombre_instructor', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Empresa / Plataforma</label>
              <input type="text" placeholder="Ej: OTEC Capacita, Sence..." className={inp} value={form.empresa_instructor} onChange={e => set('empresa_instructor', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Duración (horas)</label>
              <input type="number" step="0.5" min="0" placeholder="Ej: 2.0" className={inp} value={form.duracion_horas} onChange={e => set('duracion_horas', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>N° de participantes</label>
              <input type="number" min="0" placeholder="Ej: 8" className={inp} value={form.n_participantes} onChange={e => set('n_participantes', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Evaluación</label>
              <select className={inp} value={form.evaluacion} onChange={e => set('evaluacion', e.target.value)}>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">✅ Aprobado</option>
                <option value="reprobado">❌ Reprobado</option>
                <option value="sin_evaluacion">Sin evaluación</option>
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Lista de participantes</label>
            <input type="text" placeholder="Ej: María González, Juan Pérez, Ana Rodríguez" className={inp} value={form.lista_participantes} onChange={e => set('lista_participantes', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Certificado / Lista de asistencia</label>
              <ProgramDocUpload label="Adjuntar certificado (PDF o imagen)" file={certFile} onChange={setCertFile} />
            </div>
            <div>
              <label className={lbl}>Material de apoyo</label>
              <ProgramDocUpload label="Adjuntar material (PDF o imagen)" file={materialFile} onChange={setMaterialFile} />
            </div>
          </div>
          <div>
            <label className={lbl}>Observaciones</label>
            <input type="text" placeholder="Notas adicionales..." className={inp} value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={() => { setShowForm(false); setForm(INITIAL); setCertFile(null); setMaterialFile(null) }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
              {saving ? <><span className="animate-spin">⟳</span> Guardando...</> : <><CheckCircle size={15} /> Guardar</>}
            </button>
          </div>
        </form>
      )}

      {records.length === 0 && !showForm ? (
        <div className="text-center py-12 text-gray-400">
          <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin capacitaciones registradas.</p>
          {!readOnly && <button onClick={() => setShowForm(true)} className="mt-2 text-emerald-600 text-sm hover:underline">+ Registrar primera capacitación</button>}
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(r => {
            const isExpanded = expanded === r.id
            const eval_ = EVAL_CONFIG[r.evaluacion]
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${eval_.cls}`}>
                    {eval_.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.tema}</p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(r.fecha), 'dd/MM/yyyy')}
                      {r.n_participantes ? ` · ${r.n_participantes} participantes` : ''}
                      {r.duracion_horas ? ` · ${r.duracion_horas}h` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-xs text-gray-400 hidden sm:block">
                    {INSTRUCTOR_LABELS[r.tipo_instructor]}
                  </div>
                  {(r.certificado_url || r.material_url) && (
                    <ExternalLink size={15} className="text-blue-400 shrink-0" />
                  )}
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {r.nombre_instructor && <div><p className="text-xs text-gray-400 uppercase">Instructor</p><p className="font-medium">{r.nombre_instructor}</p></div>}
                      {r.empresa_instructor && <div><p className="text-xs text-gray-400 uppercase">Empresa</p><p className="font-medium">{r.empresa_instructor}</p></div>}
                      {r.duracion_horas && <div><p className="text-xs text-gray-400 uppercase flex items-center gap-1"><Clock size={10} />Duración</p><p className="font-medium">{r.duracion_horas} horas</p></div>}
                      {r.n_participantes && <div><p className="text-xs text-gray-400 uppercase flex items-center gap-1"><Users size={10} />Participantes</p><p className="font-medium">{r.n_participantes}</p></div>}
                      {r.puntaje_promedio !== null && r.puntaje_promedio !== undefined && (
                        <div><p className="text-xs text-gray-400 uppercase">Puntaje promedio</p><p className="font-medium">{r.puntaje_promedio}%</p></div>
                      )}
                      {r.objetivos && <div className="col-span-2 sm:col-span-4"><p className="text-xs text-gray-400 uppercase">Objetivos</p><p className="font-medium">{r.objetivos}</p></div>}
                      {r.lista_participantes && <div className="col-span-2 sm:col-span-4"><p className="text-xs text-gray-400 uppercase">Asistentes</p><p className="font-medium text-gray-700">{r.lista_participantes}</p></div>}
                      {r.observaciones && <div className="col-span-2 sm:col-span-4"><p className="text-xs text-gray-400 uppercase">Observaciones</p><p className="font-medium text-amber-700">{r.observaciones}</p></div>}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200">
                      <div className="flex gap-3">
                        {r.certificado_url && (
                          <a href={r.certificado_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                            <ExternalLink size={14} /> {r.certificado_nombre ?? 'Certificado'}
                          </a>
                        )}
                        {r.material_url && (
                          <a href={r.material_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                            <ExternalLink size={14} /> {r.material_nombre ?? 'Material'}
                          </a>
                        )}
                        {!r.certificado_url && !r.material_url && (
                          <span className="text-xs text-gray-400">Sin documentos adjuntos</span>
                        )}
                      </div>
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
