import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ClipboardList, Bell, BellOff, ChevronRight, ArrowLeft,
  Calendar, AlertTriangle, CheckCircle, Plus, Pencil,
  Trash2, Thermometer, ClipboardCheck, UserCheck, Settings, X,
  Save, MapPin,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  usePlanillaTemplates,
  usePlanillaMonths,
  usePlanillaItems,
  usePlanillaItemsAll,
  usePlanillaItemsForMonth,
  usePlanillaEntries,
  usePlanillaAlerts,
  useTenantOperators,
  useAreas,
  assignPlanillaMonth,
  assignPlanillaArea,
  createPlanillaItem,
  updatePlanillaItem,
  deletePlanillaItem,
  usePlanillaMonthItems,
} from '@/hooks/usePlanillas'
import PlanillaGrid from '@/components/planilla/PlanillaGrid'
import ChecklistView from '@/components/planilla/ChecklistView'
import type { PlanillaMonth, PlanillaTemplate, PlanillaItem, PlanillaFrequency, PlanillaValueType, Area } from '@/types'

const MONTH_NAMES = [
  '', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

const STATUS_CONFIG = {
  pending:     { label: 'Pendiente',  color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  in_progress: { label: 'En curso',   color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  completed:   { label: 'Completada', color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  signed:      { label: 'Firmada',    color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
}

const ALERT_TYPE_CONFIG = {
  not_started: { label: 'Sin iniciar', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
  incomplete:  { label: 'Incompleta',  icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  overdue:     { label: 'Vencida',     icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
}

// ── Read-only detail view ─────────────────────────────────────────────────────
function PlanillaDetail({ planillaMonth, onBack }: { planillaMonth: PlanillaMonth; onBack: () => void }) {
  const { items, loading: loadingItems } = usePlanillaItemsForMonth(planillaMonth.id, planillaMonth.template_id)
  const { entryMap, tempMap, complianceMTMap, entries }   = usePlanillaEntries(planillaMonth.id)

  const isMonthlyChecklist = items.length > 0 && items.every(i => i.frequency === 'monthly')

  const totalCells  = items.filter(i => i.value_type === 'compliance').length
    * new Date(planillaMonth.year, planillaMonth.month, 0).getDate()
  const filledCells = entries.filter(e => e.value !== null && e.time_slot === null).length
  const cCells      = entries.filter(e => e.value === 'C' && e.time_slot === null).length
  const compliance  = filledCells > 0 ? Math.round((cCells / filledCells) * 100) : 0

  if (loadingItems) return <div className="flex items-center justify-center py-20 text-gray-400">Cargando…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 text-lg">
            {planillaMonth.template?.name}
            {planillaMonth.label ? ` — ${planillaMonth.label}` : ''}
          </h2>
          <p className="text-sm text-gray-500">{MONTH_NAMES[planillaMonth.month]} {planillaMonth.year}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CONFIG[planillaMonth.status].color}`}>
          {STATUS_CONFIG[planillaMonth.status].label}
        </span>
      </div>

      {!isMonthlyChecklist && totalCells > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Completadas', value: `${filledCells}/${totalCells}`, color: 'text-blue-600' },
            { label: 'Cumplimiento', value: `${compliance}%`, color: compliance >= 80 ? 'text-green-600' : compliance >= 50 ? 'text-amber-600' : 'text-red-600' },
            { label: 'No Cumple', value: entries.filter(e => e.value === 'NC').length, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {planillaMonth.status === 'signed' && planillaMonth.signed_at && (
        <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700">
          <CheckCircle size={16} />
          <span>Firmada el {new Date(planillaMonth.signed_at).toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' })}</span>
        </div>
      )}

      {isMonthlyChecklist ? (
        <ChecklistView
          monthId={planillaMonth.id}
          items={items}
          readOnly={false}
          canDeleteDocs={true}
        />
      ) : (
        <PlanillaGrid
          planillaMonth={planillaMonth}
          items={items}
          entryMap={entryMap}
          tempMap={tempMap}
          complianceMTMap={complianceMTMap}
          onSetValue={() => {}}
          readonly
        />
      )}
    </div>
  )
}

// ── Item form modal ───────────────────────────────────────────────────────────
function ItemFormModal({
  templateId,
  item,
  maxOrder,
  onSave,
  onClose,
}: {
  templateId: string
  item: PlanillaItem | null
  maxOrder: number
  onSave: () => void
  onClose: () => void
}) {
  const [name,           setName]           = useState(item?.name ?? '')
  const [equipmentNumber, setEquipmentNumber] = useState(item?.equipment_number ?? '')
  const [valueType,      setValueType]      = useState<PlanillaValueType>(item?.value_type ?? 'compliance')
  const [frequency,      setFrequency]      = useState<PlanillaFrequency>(item?.frequency ?? 'daily')
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    if (item) {
      await updatePlanillaItem(item.id, {
        name: name.trim(),
        equipment_number: equipmentNumber.trim() || null,
        value_type: valueType,
        frequency,
      })
    } else {
      await createPlanillaItem({
        template_id: templateId,
        name: name.trim(),
        equipment_number: equipmentNumber.trim() || null,
        value_type: valueType,
        frequency,
        order_index: maxOrder + 1,
        active: true,
      })
    }
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{item ? 'Editar ítem' : 'Nuevo ítem'}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del ítem *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Cámara frigorífica N°1"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">N° de equipo (opcional)</label>
            <input
              type="text"
              value={equipmentNumber}
              onChange={e => setEquipmentNumber(e.target.value)}
              placeholder="Ej: 1, 2, A…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de valor</label>
            <div className="grid grid-cols-3 gap-2">
              {(['compliance', 'temperature', 'compliance_mt'] as PlanillaValueType[]).map(vt => (
                <button
                  key={vt}
                  onClick={() => setValueType(vt)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    valueType === vt
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {vt === 'compliance' ? <ClipboardCheck size={15} /> : vt === 'temperature' ? <Thermometer size={15} /> : <ClipboardCheck size={15} />}
                  {vt === 'compliance' ? 'C / NC / NA' : vt === 'temperature' ? 'Temperatura °C' : 'C / NC (M/T)'}
                </button>
              ))}
            </div>
            {valueType === 'temperature' && (
              <p className="text-xs text-blue-600 mt-1.5">Se registran lecturas de mañana y tarde en grados °C (puede ser negativo)</p>
            )}
            {valueType === 'compliance_mt' && (
              <p className="text-xs text-blue-600 mt-1.5">Cumple / No Cumple con registro mañana y tarde. Incluye opción Cerrado.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Frecuencia</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value as PlanillaFrequency)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
            >
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
          {error && <p className="text-red-600 text-xs">{error}</p>}
        </div>
        <div className="p-4 flex gap-3 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-900 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Save size={15} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Item management panel ─────────────────────────────────────────────────────
function ItemConfigPanel({ template }: { template: PlanillaTemplate }) {
  const { items, loading, reload } = usePlanillaItemsAll(template.id)
  const [editItem, setEditItem] = useState<PlanillaItem | null | 'new'>('new' as never)
  const [showForm, setShowForm] = useState(false)
  const [formItem, setFormItem] = useState<PlanillaItem | null>(null)

  const openNew  = () => { setFormItem(null); setShowForm(true) }
  const openEdit = (item: PlanillaItem) => { setFormItem(item); setShowForm(true) }

  const handleDelete = async (item: PlanillaItem) => {
    if (!confirm(`¿Desactivar el ítem "${item.name}"?`)) return
    await deletePlanillaItem(item.id)
    reload()
  }

  const maxOrder = items.reduce((m, i) => Math.max(m, i.order_index), 0)

  if (loading) return <div className="py-8 text-center text-gray-400">Cargando ítems…</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">{template.name}</p>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 text-white rounded-lg text-xs font-semibold hover:bg-brand-900 transition-colors"
        >
          <Plus size={13} /> Agregar ítem
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
          No hay ítems. Agrega el primero.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${idx < items.length - 1 ? 'border-b border-gray-50' : ''} ${!item.active ? 'opacity-50' : ''}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.value_type === 'temperature' ? 'bg-blue-50' : item.value_type === 'compliance_mt' ? 'bg-purple-50' : 'bg-green-50'}`}>
                {item.value_type === 'temperature'
                  ? <Thermometer size={13} className="text-blue-600" />
                  : <ClipboardCheck size={13} className="text-green-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {item.equipment_number ? `#${item.equipment_number} — ` : ''}{item.name}
                </p>
                <p className="text-xs text-gray-400">
                  {item.value_type === 'temperature' ? 'Temperatura °C (M/T)' : item.value_type === 'compliance_mt' ? 'C/NC (M/T)' : 'C/NC/NA'} · {item.frequency === 'daily' ? 'Diaria' : item.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
                  {!item.active ? ' · Inactivo' : ''}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                  <Pencil size={13} />
                </button>
                {item.active && (
                  <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ItemFormModal
          templateId={template.id}
          item={formItem}
          maxOrder={maxOrder}
          onSave={reload}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

// ── Area management panel ─────────────────────────────────────────────────────
function AreaConfigPanel() {
  const { areas, loading, createArea, updateArea, deleteArea } = useAreas()
  const [showForm, setShowForm]   = useState(false)
  const [editItem, setEditItem]   = useState<Area | null>(null)
  const [name, setName]           = useState('')
  const [desc, setDesc]           = useState('')
  const [saving, setSaving]       = useState(false)

  const openNew = () => { setEditItem(null); setName(''); setDesc(''); setShowForm(true) }
  const openEdit = (a: Area) => { setEditItem(a); setName(a.name); setDesc(a.description ?? ''); setShowForm(true) }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    if (editItem) {
      await updateArea(editItem.id, name, desc || null)
    } else {
      await createArea(name, desc || null)
    }
    setSaving(false)
    setShowForm(false)
  }

  if (loading) return <div className="py-6 text-center text-gray-400 text-sm">Cargando áreas…</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Áreas del establecimiento</p>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 text-white rounded-lg text-xs font-semibold hover:bg-brand-900 transition-colors"
        >
          <Plus size={13} /> Nueva área
        </button>
      </div>

      {showForm && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-brand-800">{editItem ? 'Editar área' : 'Nueva área'}</p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del área (ej: Cocina, Almacén, Cámara fría)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <input
            type="text"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Descripción (opcional)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 py-2 bg-brand-700 text-white rounded-lg text-xs font-semibold hover:bg-brand-900 disabled:opacity-60 flex items-center justify-center gap-1"
            >
              <Save size={12} /> {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {areas.length === 0 && !showForm ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
          No hay áreas creadas. Agrega la primera.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {areas.map((area, idx) => (
            <div key={area.id} className={`flex items-center gap-3 px-4 py-3 ${idx < areas.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <MapPin size={13} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{area.name}</p>
                {area.description && <p className="text-xs text-gray-400 truncate">{area.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(area)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => deleteArea(area.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Create / Edit planilla modal ─────────────────────────────────────────────
function PlanillaFormModal({
  template,
  editMonth,
  areas,
  operators,
  allItems,
  existingItemIds,
  onSave,
  onClose,
}: {
  template: PlanillaTemplate
  editMonth: PlanillaMonth | null // null = creating new
  areas: Area[]
  operators: { id: string; full_name: string }[]
  allItems: PlanillaItem[]
  existingItemIds: string[] // item_ids already assigned (for edit mode)
  onSave: (label: string, areaId: string | null, operatorId: string | null, itemIds: string[]) => Promise<void>
  onClose: () => void
}) {
  const [label, setLabel]       = useState(editMonth?.label ?? '')
  const [areaId, setAreaId]     = useState(editMonth?.area_id ?? '')
  const [operatorId, setOperatorId] = useState(editMonth?.assigned_to ?? '')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(
    new Set(existingItemIds.length > 0 ? existingItemIds : allItems.map(i => i.id))
  )
  const [saving, setSaving] = useState(false)

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedItems.size === allItems.length) setSelectedItems(new Set())
    else setSelectedItems(new Set(allItems.map(i => i.id)))
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(
      label.trim() || '',
      areaId || null,
      operatorId || null,
      Array.from(selectedItems)
    )
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-gray-800">{editMonth ? 'Editar planilla' : 'Nueva planilla'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{template.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Etiqueta / Nombre</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ej: Cocina, Sushi, Línea 1…"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
          </div>

          {/* Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Área</label>
            <select
              value={areaId}
              onChange={e => setAreaId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">— Sin área —</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Operator */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Operador asignado</label>
            <select
              value={operatorId}
              onChange={e => setOperatorId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="">— Sin asignar —</option>
              {operators.map(op => <option key={op.id} value={op.id}>{op.full_name}</option>)}
            </select>
          </div>

          {/* Item selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600">Ítems incluidos</label>
              <button onClick={toggleAll} className="text-xs text-brand-700 hover:underline">
                {selectedItems.size === allItems.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {allItems.map((item, idx) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 ${idx < allItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-700 focus:ring-brand-300"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.value_type === 'temperature' ? 'Temperatura' : item.value_type === 'compliance_mt' ? 'C/NC (M/T)' : 'C/NC/NA'}
                      {item.equipment_number ? ` · Equipo ${item.equipment_number}` : ''}
                    </p>
                  </div>
                </label>
              ))}
              {allItems.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No hay ítems creados para esta planilla</p>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">{selectedItems.size} de {allItems.length} ítems seleccionados</p>
          </div>
        </div>

        <div className="p-4 flex gap-3 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || selectedItems.size === 0}
            className="flex-1 py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-900 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Save size={15} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Planilla instance row (one per area/worker) ──────────────────────────────
function PlanillaInstanceRow({
  pm, areas, operators, onView, onAlert, onEdit, onReload,
}: {
  pm: PlanillaMonth
  areas: Area[]
  operators: { id: string; full_name: string }[]
  onView: (m: PlanillaMonth) => void
  onAlert: (m: PlanillaMonth) => void
  onEdit: (m: PlanillaMonth) => void
  onReload: () => void
}) {
  const cfg = STATUS_CONFIG[pm.status]
  const area = areas.find(a => a.id === pm.area_id)
  const operator = operators.find(o => o.id === pm.assigned_to)

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {pm.label || area?.name || 'Sin etiqueta'}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {operator ? operator.full_name : 'Sin asignar'}
          {area && pm.label ? ` · ${area.name}` : ''}
        </p>
      </div>
      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
        {cfg.label}
      </span>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => onEdit(pm)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="Editar">
          <Pencil size={13} />
        </button>
        <button onClick={() => onView(pm)} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-600 hover:text-brand-700 transition-colors" title="Ver planilla">
          <ChevronRight size={14} />
        </button>
        {pm.status === 'pending' && (
          <button onClick={() => onAlert(pm)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors" title="Alertar">
            <Bell size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Template card with multiple instances ────────────────────────────────────
function TemplateCard({
  template, months, areas, operators, onView, onAlert, onReload, onCreateNew, onEditMonth,
}: {
  template: PlanillaTemplate
  months: PlanillaMonth[]
  areas: Area[]
  operators: { id: string; full_name: string }[]
  onView: (m: PlanillaMonth) => void
  onAlert: (m: PlanillaMonth) => void
  onReload: () => void
  onCreateNew: (template: PlanillaTemplate) => void
  onEditMonth: (m: PlanillaMonth) => void
}) {
  const templateMonths = months.filter(m => m.template_id === template.id)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-50">
        <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
          <ClipboardList size={18} className="text-brand-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{template.name}</p>
          <p className="text-xs text-gray-400 truncate">{template.description}</p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
          {templateMonths.length} planilla{templateMonths.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Instance list */}
      {templateMonths.length > 0 ? (
        <div>
          {templateMonths.map(pm => (
            <PlanillaInstanceRow
              key={pm.id}
              pm={pm}
              areas={areas}
              operators={operators}
              onView={onView}
              onAlert={onAlert}
              onEdit={onEditMonth}
              onReload={onReload}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-gray-400 text-sm">
          No hay planillas creadas para este mes
        </div>
      )}

      {/* Add new button */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => onCreateNew(template)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-brand-700 hover:bg-brand-50 transition-colors font-medium"
        >
          <Plus size={14} /> Agregar planilla
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PlanillasDashboard() {
  const today = new Date()
  const [year]  = useState(today.getFullYear())
  const [month] = useState(today.getMonth() + 1)
  const [tab, setTab] = useState<'planillas' | 'items' | 'areas'>('planillas')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const { templates, loading: loadingTpl } = usePlanillaTemplates()
  const { months, loading: loadingMonths, ensureMonths, reload: reloadMonths, createMonth, deleteMonth } = usePlanillaMonths(year, month)
  const { operators } = useTenantOperators()
  const { areas } = useAreas()
  const { alerts, markSeen, createAlert } = usePlanillaAlerts()
  const [selected, setSelected] = useState<PlanillaMonth | null>(null)
  const [alertSent, setAlertSent] = useState<string | null>(null)
  const location = useLocation()

  // Modal state for creating/editing planillas
  const [formTemplate, setFormTemplate] = useState<PlanillaTemplate | null>(null)
  const [formEditMonth, setFormEditMonth] = useState<PlanillaMonth | null>(null)
  const [formItems, setFormItems] = useState<PlanillaItem[]>([])
  const [formExistingItemIds, setFormExistingItemIds] = useState<string[]>([])

  // Reset to list view when sidebar navigates to this same route
  useEffect(() => { setSelected(null) }, [location.key])

  // No longer auto-create months — users create them manually now

  const [stats, setStats] = useState({ signed: 0, completed: 0, inProgress: 0, pending: 0 })
  useEffect(() => {
    const s = { signed: 0, completed: 0, inProgress: 0, pending: 0 }
    for (const m of months) {
      if (m.status === 'signed') s.signed++
      else if (m.status === 'completed') s.completed++
      else if (m.status === 'in_progress') s.inProgress++
      else s.pending++
    }
    setStats(s)
  }, [months])

  const handleAlert = async (m: PlanillaMonth) => {
    await createAlert(m.id, 'not_started')
    setAlertSent(m.id)
    setTimeout(() => setAlertSent(null), 3000)
  }

  // Open create modal
  const handleCreateNew = async (template: PlanillaTemplate) => {
    // Load items for the template
    const { data } = await supabase
      .from('planilla_items')
      .select('*')
      .eq('template_id', template.id)
      .eq('active', true)
      .order('order_index')
    setFormItems((data ?? []) as PlanillaItem[])
    setFormExistingItemIds([])
    setFormTemplate(template)
    setFormEditMonth(null)
  }

  // Open edit modal
  const handleEditMonth = async (pm: PlanillaMonth) => {
    const tpl = templates.find(t => t.id === pm.template_id)
    if (!tpl) return
    // Load items for the template
    const { data: items } = await supabase
      .from('planilla_items')
      .select('*')
      .eq('template_id', tpl.id)
      .eq('active', true)
      .order('order_index')
    // Load existing assigned items
    const { data: monthItems } = await supabase
      .from('planilla_month_items')
      .select('item_id')
      .eq('month_id', pm.id)
    setFormItems((items ?? []) as PlanillaItem[])
    setFormExistingItemIds((monthItems ?? []).map((mi: any) => mi.item_id))
    setFormTemplate(tpl)
    setFormEditMonth(pm)
  }

  // Save create/edit
  const handleFormSave = async (label: string, areaId: string | null, operatorId: string | null, itemIds: string[]) => {
    if (formEditMonth) {
      // Update existing
      await Promise.all([
        supabase.from('planilla_months').update({
          label: label || null,
          area_id: areaId,
          assigned_to: operatorId,
        }).eq('id', formEditMonth.id),
        // Sync items
        (async () => {
          await supabase.from('planilla_month_items').delete().eq('month_id', formEditMonth.id)
          if (itemIds.length > 0 && itemIds.length < formItems.length) {
            // Only insert if not all items selected (all = default behavior)
            await supabase.from('planilla_month_items').insert(
              itemIds.map(itemId => ({ month_id: formEditMonth.id, item_id: itemId }))
            )
          }
        })(),
      ])
    } else if (formTemplate) {
      // Create new
      const saveItemIds = itemIds.length < formItems.length ? itemIds : []
      await createMonth(formTemplate.id, label || null, areaId, operatorId, saveItemIds)
    }
    setFormTemplate(null)
    setFormEditMonth(null)
    reloadMonths()
  }

  // If viewing a specific planilla detail
  if (selected) {
    const fresh = months.find(m => m.id === selected.id) ?? selected
    return (
      <PlanillaDetail
        planillaMonth={{ ...fresh, template: selected.template }}
        onBack={() => setSelected(null)}
      />
    )
  }

  const activeTemplate = templates.find(t => t.id === selectedTemplate) ?? templates[0] ?? null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Planillas del Mes</h1>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
          <Calendar size={14} />
          {MONTH_NAMES[month]} {year}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {([
          ['planillas', 'Planillas',      ClipboardList],
          ['items',     'Ítems',          Settings],
          ['areas',     'Áreas',          MapPin],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── PLANILLAS TAB ── */}
      {tab === 'planillas' && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Firmadas',    value: stats.signed,     color: 'text-purple-600 bg-purple-50 border-purple-200' },
              { label: 'Completadas', value: stats.completed,  color: 'text-green-600 bg-green-50 border-green-200' },
              { label: 'En curso',    value: stats.inProgress, color: 'text-blue-600 bg-blue-50 border-blue-200' },
              { label: 'Pendientes',  value: stats.pending,    color: 'text-red-600 bg-red-50 border-red-200' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Alerts panel */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-200">
                <Bell size={16} className="text-amber-600" />
                <h2 className="font-semibold text-amber-800 text-sm">
                  {alerts.length} Alerta{alerts.length > 1 ? 's' : ''} sin resolver
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {alerts.slice(0, 5).map(alert => {
                  const typeCfg = ALERT_TYPE_CONFIG[alert.type]
                  const Icon    = typeCfg.icon
                  const tpl     = templates.find(t => t.id === (alert.month as any)?.template_id)
                  return (
                    <div key={alert.id} className={`flex items-center gap-3 px-4 py-3 border-l-4 ${alert.type === 'not_started' ? 'border-red-400' : 'border-amber-400'}`}>
                      <Icon size={16} className={alert.type === 'not_started' ? 'text-red-500 shrink-0' : 'text-amber-500 shrink-0'} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {(alert.month as any)?.template?.name ?? tpl?.name ?? 'Planilla'}
                        </p>
                        <p className="text-xs text-gray-500">{typeCfg.label}{alert.day ? ` — Día ${alert.day}` : ''}</p>
                      </div>
                      <button
                        onClick={() => markSeen(alert.id)}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Marcar como vista"
                      >
                        <BellOff size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {alertSent && (
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <Bell size={15} /> Alerta enviada al operador
            </div>
          )}

          {/* Planilla cards */}
          <div>
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Estado por planilla</h2>
            {(loadingTpl || loadingMonths) ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map(tpl => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    months={months}
                    areas={areas}
                    operators={operators}
                    onView={m => setSelected({ ...m, template: tpl })}
                    onAlert={handleAlert}
                    onReload={reloadMonths}
                    onCreateNew={handleCreateNew}
                    onEditMonth={handleEditMonth}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ITEMS TAB ── */}
      {tab === 'items' && (
        <div className="space-y-4">
          {/* Template selector */}
          {templates.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    (selectedTemplate ?? templates[0]?.id) === tpl.id
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          )}

          {activeTemplate && <ItemConfigPanel template={activeTemplate} />}
        </div>
      )}

      {/* ── AREAS TAB ── */}
      {tab === 'areas' && <AreaConfigPanel />}

      {/* ── CREATE/EDIT PLANILLA MODAL ── */}
      {formTemplate && (
        <PlanillaFormModal
          template={formTemplate}
          editMonth={formEditMonth}
          areas={areas}
          operators={operators}
          allItems={formItems}
          existingItemIds={formExistingItemIds}
          onSave={handleFormSave}
          onClose={() => { setFormTemplate(null); setFormEditMonth(null) }}
        />
      )}
    </div>
  )
}
