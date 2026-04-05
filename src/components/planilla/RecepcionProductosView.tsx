import { useState, useRef, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus, Trash2, Camera, Upload, X, ChevronDown, ChevronUp,
  Thermometer, AlertTriangle, CheckCircle, Info, Eye
} from 'lucide-react'
import type { PlanillaMonth, ReceptionEstado } from '@/types'
import { useProductReception } from '@/hooks/usePlanillas'
import { useAuth } from '@/contexts/AuthContext'

// ─── Estado badge ─────────────────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: ReceptionEstado }) {
  const map: Record<ReceptionEstado, { label: string; cls: string }> = {
    conforme:     { label: 'Conforme',      cls: 'bg-green-100 text-green-800 border-green-200' },
    no_conforme:  { label: 'No Conforme',   cls: 'bg-red-100 text-red-800 border-red-200' },
    observacion:  { label: 'Observación',   cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  }
  const { label, cls } = map[estado]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {label}
    </span>
  )
}

// ─── Temperature indicator ────────────────────────────────────────────────────
function TempBadge({ temp, min, max }: { temp: number | null; min: number | null; max: number | null }) {
  if (temp === null) return <span className="text-gray-400 text-sm">—</span>
  const inRange = (min === null || temp >= min) && (max === null || temp <= max)
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${inRange ? 'text-emerald-600' : 'text-red-600'}`}>
      <Thermometer size={14} />
      {temp}°C
      {!inRange && <AlertTriangle size={14} />}
    </span>
  )
}

// ─── Photo preview modal ──────────────────────────────────────────────────────
function PhotoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white hover:text-gray-300">
          <X size={28} />
        </button>
        <img src={url} alt="Evidencia fotográfica" className="w-full rounded-lg shadow-2xl" />
      </div>
    </div>
  )
}

// ─── Entry form ───────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  fecha_recepcion:  new Date().toISOString().slice(0, 16),
  proveedor:        '',
  producto:         '',
  marca:            '',
  cantidad:         '',
  unidad:           'kg',
  temperatura:      '',
  temperatura_min:  '',
  temperatura_max:  '',
  fecha_vencimiento: '',
  lote:             '',
  estado:           'conforme' as ReceptionEstado,
  observaciones:    '',
  recibido_por:     '',
}

function EntryForm({
  onSave,
  onCancel,
  saving,
  defaultRecibidoPor,
}: {
  onSave: (fields: typeof INITIAL_FORM, photo: File | null) => Promise<void>
  onCancel: () => void
  saving: boolean
  defaultRecibidoPor: string
}) {
  const [form, setForm]             = useState({ ...INITIAL_FORM, recibido_por: defaultRecibidoPor })
  const [photoFile, setPhotoFile]   = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const cameraRef     = useRef<HTMLInputElement>(null)

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleFile = (file: File) => {
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = e => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(form, photoFile)
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none'
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
      <h3 className="font-semibold text-gray-800 text-base flex items-center gap-2">
        <Plus size={18} className="text-blue-600" />
        Nueva Recepción de Producto
      </h3>

      {/* Row 1: fecha + proveedor + producto */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Fecha y hora *</label>
          <input type="datetime-local" required className={inputCls}
            value={form.fecha_recepcion}
            onChange={e => set('fecha_recepcion', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Proveedor *</label>
          <input type="text" required placeholder="Ej: Proveedor Lácteos S.A." className={inputCls}
            value={form.proveedor} onChange={e => set('proveedor', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Producto *</label>
          <input type="text" required placeholder="Ej: Leche entera" className={inputCls}
            value={form.producto} onChange={e => set('producto', e.target.value)} />
        </div>
      </div>

      {/* Row 2: marca + cantidad + unidad */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Marca</label>
          <input type="text" placeholder="Ej: Colún" className={inputCls}
            value={form.marca} onChange={e => set('marca', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Cantidad</label>
          <input type="number" step="0.01" min="0" placeholder="0.00" className={inputCls}
            value={form.cantidad} onChange={e => set('cantidad', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Unidad</label>
          <select className={inputCls} value={form.unidad} onChange={e => set('unidad', e.target.value)}>
            {['kg', 'g', 'L', 'mL', 'unidades', 'cajas', 'sacos', 'bandejas'].map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: temperatura */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-blue-50 rounded-lg">
        <div>
          <label className={labelCls}>Temperatura medida (°C)</label>
          <input type="number" step="0.1" placeholder="Ej: 4.5" className={inputCls}
            value={form.temperatura} onChange={e => set('temperatura', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Mín. aceptable (°C)</label>
          <input type="number" step="0.1" placeholder="Ej: 0" className={inputCls}
            value={form.temperatura_min} onChange={e => set('temperatura_min', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Máx. aceptable (°C)</label>
          <input type="number" step="0.1" placeholder="Ej: 8" className={inputCls}
            value={form.temperatura_max} onChange={e => set('temperatura_max', e.target.value)} />
        </div>
      </div>

      {/* Row 4: vencimiento + lote + recibido_por */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Fecha de vencimiento</label>
          <input type="date" className={inputCls}
            value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>N° Lote</label>
          <input type="text" placeholder="Ej: L2024-001" className={inputCls}
            value={form.lote} onChange={e => set('lote', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Recibido por</label>
          <input type="text" placeholder="Nombre del operador" className={inputCls}
            value={form.recibido_por} onChange={e => set('recibido_por', e.target.value)} />
        </div>
      </div>

      {/* Row 5: estado + observaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Estado *</label>
          <select required className={inputCls}
            value={form.estado}
            onChange={e => set('estado', e.target.value as ReceptionEstado)}>
            <option value="conforme">✅ Conforme</option>
            <option value="no_conforme">❌ No Conforme</option>
            <option value="observacion">⚠️ Observación</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Observaciones</label>
          <input type="text" placeholder="Notas adicionales..." className={inputCls}
            value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
        </div>
      </div>

      {/* Row 6: foto */}
      <div>
        <label className={labelCls}>Evidencia fotográfica</label>
        <div className="flex items-start gap-3">
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Vista previa" className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
              <button type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {/* Gallery / File picker */}
              <button type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                <Upload size={16} />
                Subir foto
              </button>
              {/* Camera capture */}
              <button type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 hover:bg-blue-100">
                <Camera size={16} />
                Cámara
              </button>
            </div>
          )}
          {/* Hidden inputs */}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Toma o sube una foto del producto, etiqueta o termómetro como evidencia (máx. 5 MB, JPG/PNG/WebP).
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={saving}
          className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
          {saving ? (
            <><span className="animate-spin">⟳</span> Guardando...</>
          ) : (
            <><CheckCircle size={15} /> Guardar recepción</>
          )}
        </button>
      </div>
    </form>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────
interface Props {
  month: PlanillaMonth
  readOnly?: boolean
}

export default function RecepcionProductosView({ month, readOnly = false }: Props) {
  const { profile } = useAuth()
  const { entries, loading, saving, addEntry, deleteEntry } = useProductReception(month.id)
  const [showForm, setShowForm]     = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [photoModal, setPhotoModal] = useState<string | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)

  const handleSave = useCallback(async (fields: typeof INITIAL_FORM, photo: File | null) => {
    const payload = {
      fecha_recepcion:   fields.fecha_recepcion ? new Date(fields.fecha_recepcion).toISOString() : new Date().toISOString(),
      proveedor:         fields.proveedor,
      producto:          fields.producto,
      marca:             fields.marca || null,
      cantidad:          fields.cantidad ? parseFloat(fields.cantidad) : null,
      unidad:            fields.unidad,
      temperatura:       fields.temperatura ? parseFloat(fields.temperatura) : null,
      temperatura_min:   fields.temperatura_min ? parseFloat(fields.temperatura_min) : null,
      temperatura_max:   fields.temperatura_max ? parseFloat(fields.temperatura_max) : null,
      fecha_vencimiento: fields.fecha_vencimiento || null,
      lote:              fields.lote || null,
      estado:            fields.estado,
      observaciones:     fields.observaciones || null,
      recibido_por:      fields.recibido_por || null,
      photo_url:         null,
      photo_taken_at:    null,
    }
    const ok = await addEntry(payload, photo)
    if (ok) setShowForm(false)
  }, [addEntry])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    setDeleting(id)
    await deleteEntry(id)
    setDeleting(null)
  }

  const canDelete = profile?.role === 'admin' || profile?.role === 'supervisor'

  const monthLabel = `${month.label ?? ''} ${format(new Date(month.year, month.month - 1), 'MMMM yyyy', { locale: es })}`

  if (loading) return (
    <div className="flex justify-center py-10 text-gray-400">
      <div className="animate-spin text-2xl">⟳</div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Recepción de Productos</h2>
          <p className="text-sm text-gray-500 capitalize">{monthLabel} · {entries.length} registro{entries.length !== 1 ? 's' : ''}</p>
        </div>
        {!readOnly && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
            <Plus size={16} />
            Nueva recepción
          </button>
        )}
      </div>

      {/* Info legal */}
      <div className="flex items-start gap-2 p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-700">
        <Info size={14} className="mt-0.5 shrink-0" />
        Conforme a D.S. N° 977/96 Arts. 6 y 69 — cadena de frío y trazabilidad de materias primas.
      </div>

      {/* Form */}
      {showForm && (
        <EntryForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          saving={saving}
          defaultRecibidoPor={profile?.full_name ?? ''}
        />
      )}

      {/* Entries list */}
      {entries.length === 0 && !showForm ? (
        <div className="text-center py-12 text-gray-400">
          <Camera size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Sin registros de recepción este mes.</p>
          {!readOnly && (
            <button onClick={() => setShowForm(true)} className="mt-3 text-blue-600 text-sm hover:underline">
              + Agregar primera recepción
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => {
            const expanded = expandedId === entry.id
            const outOfRange = entry.temperatura !== null && (
              (entry.temperatura_min !== null && entry.temperatura < entry.temperatura_min) ||
              (entry.temperatura_max !== null && entry.temperatura > entry.temperatura_max)
            )

            return (
              <div key={entry.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-sm ${outOfRange ? 'border-red-200' : 'border-gray-200'}`}>
                {/* Summary row */}
                <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expanded ? null : entry.id)}>
                  {/* Estado */}
                  <div className="shrink-0">
                    <EstadoBadge estado={entry.estado} />
                  </div>
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {entry.producto}
                      {entry.marca ? <span className="text-gray-500 font-normal"> · {entry.marca}</span> : null}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {entry.proveedor}
                      {entry.cantidad ? ` · ${entry.cantidad} ${entry.unidad}` : ''}
                      {entry.lote ? ` · Lote: ${entry.lote}` : ''}
                    </p>
                  </div>
                  {/* Temp + date */}
                  <div className="shrink-0 text-right hidden sm:block">
                    <TempBadge temp={entry.temperatura} min={entry.temperatura_min} max={entry.temperatura_max} />
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(parseISO(entry.fecha_recepcion), 'dd/MM/yy HH:mm')}
                    </p>
                  </div>
                  {/* Photo thumb */}
                  {entry.photo_url && (
                    <button type="button"
                      onClick={e => { e.stopPropagation(); setPhotoModal(entry.photo_url!) }}
                      className="shrink-0 ml-1 rounded overflow-hidden border border-gray-200">
                      <img src={entry.photo_url} alt="foto" className="h-10 w-10 object-cover" />
                    </button>
                  )}
                  {/* Chevron */}
                  <div className="shrink-0 text-gray-400">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Fecha recepción</p>
                        <p className="font-medium">{format(parseISO(entry.fecha_recepcion), "dd/MM/yyyy HH:mm")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Proveedor</p>
                        <p className="font-medium">{entry.proveedor}</p>
                      </div>
                      {entry.fecha_vencimiento && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Vencimiento</p>
                          <p className="font-medium">{format(parseISO(entry.fecha_vencimiento), 'dd/MM/yyyy')}</p>
                        </div>
                      )}
                      {entry.temperatura !== null && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Temperatura</p>
                          <p className={`font-medium ${outOfRange ? 'text-red-600' : 'text-emerald-600'}`}>
                            {entry.temperatura}°C
                            {entry.temperatura_min !== null && entry.temperatura_max !== null && (
                              <span className="text-gray-400 font-normal"> ({entry.temperatura_min}–{entry.temperatura_max}°C)</span>
                            )}
                          </p>
                        </div>
                      )}
                      {entry.recibido_por && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Recibido por</p>
                          <p className="font-medium">{entry.recibido_por}</p>
                        </div>
                      )}
                      {entry.observaciones && (
                        <div className="col-span-2 sm:col-span-4">
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Observaciones</p>
                          <p className="font-medium text-amber-700">{entry.observaciones}</p>
                        </div>
                      )}
                    </div>

                    {/* Photo + actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                      <div>
                        {entry.photo_url ? (
                          <button
                            onClick={() => setPhotoModal(entry.photo_url!)}
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                            <Eye size={14} /> Ver fotografía
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Sin evidencia fotográfica</span>
                        )}
                      </div>
                      {canDelete && !readOnly && (
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deleting === entry.id}
                          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 disabled:opacity-50">
                          <Trash2 size={14} />
                          {deleting === entry.id ? 'Eliminando...' : 'Eliminar'}
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

      {/* Photo modal */}
      {photoModal && <PhotoModal url={photoModal} onClose={() => setPhotoModal(null)} />}
    </div>
  )
}
