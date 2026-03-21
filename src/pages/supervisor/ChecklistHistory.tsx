import { useState, useEffect } from 'react'
import { Search, Filter, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDateTime, getComplianceColor } from '@/lib/utils'
import type { ChecklistExecution, BpmModule, Profile } from '@/types'

const STATUS_CONFIG = {
  completed:   { label: 'Completado',   icon: CheckCircle2, color: 'text-green-700 bg-green-50' },
  approved:    { label: 'Aprobado',     icon: CheckCircle2, color: 'text-blue-700 bg-blue-50' },
  in_progress: { label: 'En progreso',  icon: Clock,        color: 'text-yellow-700 bg-yellow-50' },
  rejected:    { label: 'Rechazado',    icon: XCircle,      color: 'text-red-700 bg-red-50' },
} as const

export default function ChecklistHistory() {
  const { tenant } = useAuth()
  const [executions, setExecutions] = useState<ChecklistExecution[]>([])
  const [modules, setModules]       = useState<BpmModule[]>([])
  const [operators, setOperators]   = useState<Profile[]>([])
  const [loading, setLoading]       = useState(true)
  const [filters, setFilters]       = useState({
    module_id: '', operator_id: '', status: '', date_from: '', date_to: '',
  })

  useEffect(() => { loadMeta() }, [])
  useEffect(() => { if (tenant) loadExecutions(filters) }, [tenant])

  const loadMeta = async () => {
    if (!tenant) return
    const [{ data: mods }, { data: ops }] = await Promise.all([
      supabase.from('bpm_modules').select('*').eq('active', true).order('order_index'),
      supabase.from('profiles').select('*').eq('tenant_id', tenant.id).eq('active', true),
    ])
    setModules((mods as BpmModule[]) ?? [])
    setOperators((ops as Profile[]) ?? [])
  }

  const loadExecutions = async (f = filters) => {
    if (!tenant) return
    setLoading(true)
    let q = supabase
      .from('checklist_executions')
      .select('*, module:bpm_modules(*), executor:profiles!executed_by(full_name, role)')
      .eq('tenant_id', tenant.id)
      .order('started_at', { ascending: false })
      .limit(200)
    if (f.module_id)   q = q.eq('module_id', f.module_id)
    if (f.operator_id) q = q.eq('executed_by', f.operator_id)
    if (f.status)      q = q.eq('status', f.status)
    if (f.date_from)   q = q.gte('started_at', f.date_from + 'T00:00:00')
    if (f.date_to)     q = q.lte('started_at', f.date_to + 'T23:59:59')
    const { data } = await q
    setExecutions((data as ChecklistExecution[]) ?? [])
    setLoading(false)
  }

  const clearFilters = () => {
    const empty = { module_id: '', operator_id: '', status: '', date_from: '', date_to: '' }
    setFilters(empty)
    loadExecutions(empty)
  }

  const scores = executions.filter(e => e.compliance_score != null)
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, e) => s + (e.compliance_score ?? 0), 0) / scores.length)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Historial de Checklists</h1>
        <p className="text-gray-500 text-sm">Listado completo con filtros por módulo, fecha y operador</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={15} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <select
            value={filters.module_id}
            onChange={e => setFilters({ ...filters, module_id: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los módulos</option>
            {modules.map(m => <option key={m.id} value={m.id}>{m.code} – {m.name}</option>)}
          </select>
          <select
            value={filters.operator_id}
            onChange={e => setFilters({ ...filters, operator_id: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los operadores</option>
            {operators.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los estados</option>
            <option value="completed">Completado</option>
            <option value="approved">Aprobado</option>
            <option value="in_progress">En progreso</option>
            <option value="rejected">Rechazado</option>
          </select>
          <input type="date" value={filters.date_from}
            onChange={e => setFilters({ ...filters, date_from: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <input type="date" value={filters.date_to}
            onChange={e => setFilters({ ...filters, date_to: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => loadExecutions(filters)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-700 text-white text-sm font-semibold rounded-lg hover:bg-brand-900"
          >
            <Search size={14} /> Buscar
          </button>
          <button onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Resumen */}
      {!loading && executions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Registros', value: executions.length, color: 'text-gray-800' },
            { label: 'Cumplimiento promedio', value: avgScore != null ? `${avgScore}%` : '—', color: avgScore != null ? getComplianceColor(avgScore).text : 'text-gray-400' },
            { label: 'Completados', value: executions.filter(e => e.status === 'completed' || e.status === 'approved').length, color: 'text-green-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : executions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No hay checklists que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Folio</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Módulo</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Operador</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Fecha</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Estado</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(e => {
                  const st = STATUS_CONFIG[e.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.in_progress
                  const StIcon = st.icon
                  const score = e.compliance_score
                  return (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{e.folio ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-700">{(e.module as any)?.code}</span>
                        <span className="text-gray-400 text-xs ml-1">{(e.module as any)?.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{(e.executor as any)?.full_name ?? '—'}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(e.started_at)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                          <StIcon size={11} />
                          {st.label}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${score != null ? getComplianceColor(score).text : 'text-gray-400'}`}>
                        {score != null ? `${score}%` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
