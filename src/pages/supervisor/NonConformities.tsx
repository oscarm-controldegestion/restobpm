import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import type { NonConformity, Profile } from '@/types'

const SEVERITY = {
  critical: { label: 'Crítica',  color: 'text-red-700 bg-red-100 border-red-200' },
  high:     { label: 'Alta',     color: 'text-orange-700 bg-orange-100 border-orange-200' },
  medium:   { label: 'Media',    color: 'text-yellow-700 bg-yellow-100 border-yellow-200' },
  low:      { label: 'Baja',     color: 'text-gray-600 bg-gray-100 border-gray-200' },
} as const

const NC_STATUS = {
  open:        { label: 'Abierta',      color: 'text-red-700 bg-red-50',    icon: AlertTriangle },
  in_progress: { label: 'En progreso',  color: 'text-yellow-700 bg-yellow-50', icon: Clock },
  resolved:    { label: 'Resuelta',     color: 'text-blue-700 bg-blue-50',  icon: CheckCircle2 },
  verified:    { label: 'Verificada',   color: 'text-green-700 bg-green-50', icon: CheckCircle2 },
} as const

export default function NonConformities() {
  const { tenant, profile } = useAuth()
  const [ncs, setNcs]           = useState<NonConformity[]>([])
  const [operators, setOperators] = useState<Profile[]>([])
  const [loading, setLoading]   = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => { if (tenant) { loadNCs(); loadOperators() } }, [tenant])

  const loadNCs = async () => {
    if (!tenant) return
    setLoading(true)
    let q = supabase
      .from('non_conformities')
      .select('*, item:bpm_items(code, name, module:bpm_modules(code, name)), detector:profiles!detected_by(full_name)')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
    if (filterStatus)   q = q.eq('status', filterStatus)
    if (filterSeverity) q = q.eq('severity', filterSeverity)
    const { data } = await q
    setNcs((data as NonConformity[]) ?? [])
    setLoading(false)
  }

  const loadOperators = async () => {
    if (!tenant) return
    const { data } = await supabase.from('profiles').select('*').eq('tenant_id', tenant.id).eq('active', true)
    setOperators((data as Profile[]) ?? [])
  }

  const updateStatus = async (nc: NonConformity, newStatus: string) => {
    setUpdatingId(nc.id)
    await supabase.from('non_conformities').update({ status: newStatus }).eq('id', nc.id)
    setNcs(prev => prev.map(n => n.id === nc.id ? { ...n, status: newStatus as any } : n))
    setUpdatingId(null)
  }

  const counts = {
    open:        ncs.filter(n => n.status === 'open').length,
    in_progress: ncs.filter(n => n.status === 'in_progress').length,
    resolved:    ncs.filter(n => n.status === 'resolved' || n.status === 'verified').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">No Conformidades</h1>
        <p className="text-gray-500 text-sm">Seguimiento de desviaciones y acciones correctivas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Abiertas', value: counts.open, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'En progreso', value: counts.in_progress, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Resueltas', value: counts.resolved, color: 'text-green-700', bg: 'bg-green-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-600 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setTimeout(loadNCs, 0) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todos los estados</option>
          <option value="open">Abierta</option>
          <option value="in_progress">En progreso</option>
          <option value="resolved">Resuelta</option>
          <option value="verified">Verificada</option>
        </select>
        <select
          value={filterSeverity}
          onChange={e => { setFilterSeverity(e.target.value); setTimeout(loadNCs, 0) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Toda severidad</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-100" />)
        ) : ncs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">
            <CheckCircle2 size={32} className="text-green-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Sin no conformidades registradas</p>
          </div>
        ) : ncs.map(nc => {
          const sev = SEVERITY[nc.severity as keyof typeof SEVERITY] ?? SEVERITY.low
          const st  = NC_STATUS[nc.status as keyof typeof NC_STATUS] ?? NC_STATUS.open
          const StIcon = st.icon
          const isExpanded = expanded === nc.id
          return (
            <div key={nc.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(isExpanded ? null : nc.id)}
              >
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${sev.color}`}>
                  {sev.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {(nc.item as any)?.code} – {(nc.item as any)?.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{nc.description}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${st.color}`}>
                  <StIcon size={11} />
                  {st.label}
                </span>
                <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                  {formatDateTime(nc.created_at)}
                </span>
                {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-gray-500">Módulo:</span>
                      <span className="ml-2 text-gray-700">{(nc.item as any)?.module?.code} – {(nc.item as any)?.module?.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Detectado por:</span>
                      <span className="ml-2 text-gray-700">{(nc.detector as any)?.full_name ?? '—'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-xs text-gray-500">Descripción:</span>
                      <p className="mt-1 text-gray-700">{nc.description}</p>
                    </div>
                  </div>

                  {/* Cambio de estado */}
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-xs font-medium text-gray-500">Cambiar estado:</span>
                    {(['open', 'in_progress', 'resolved', 'verified'] as const).map(s => (
                      <button
                        key={s}
                        disabled={nc.status === s || updatingId === nc.id}
                        onClick={() => updateStatus(nc, s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40
                          ${nc.status === s ? NC_STATUS[s].color + ' cursor-default' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        {NC_STATUS[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
