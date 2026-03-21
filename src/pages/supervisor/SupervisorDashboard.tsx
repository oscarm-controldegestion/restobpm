import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Users, FileDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getComplianceDot, getComplianceColor, formatDateTime } from '@/lib/utils'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { ChecklistExecution } from '@/types'

interface ModuleScore { code: string; name: string; score: number; count: number }

export default function SupervisorDashboard() {
  const { tenant } = useAuth()
  const [executions, setExecutions]   = useState<ChecklistExecution[]>([])
  const [moduleScores, setModuleScores] = useState<ModuleScore[]>([])
  const [trend, setTrend]             = useState<{ date: string; score: number }[]>([])
  const [openNCs, setOpenNCs]         = useState(0)
  const [loading, setLoading]         = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    if (!tenant) return
    const today = new Date().toISOString().split('T')[0]

    // Ejecuciones de hoy
    const { data: todayExecs } = await supabase
      .from('checklist_executions')
      .select('*, module:bpm_modules(*), executor:profiles!executed_by(full_name, role)')
      .eq('tenant_id', tenant.id)
      .gte('started_at', today + 'T00:00:00')
      .order('completed_at', { ascending: false })

    setExecutions((todayExecs as ChecklistExecution[]) ?? [])

    // Puntajes por módulo (últimos 30 días)
    const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    const { data: allExecs } = await supabase
      .from('checklist_executions')
      .select('module_id, compliance_score, completed_at, module:bpm_modules(code, name)')
      .eq('tenant_id', tenant.id)
      .eq('status', 'completed')
      .gte('started_at', since30)

    if (allExecs) {
      const grouped = new Map<string, { code: string; name: string; scores: number[] }>()
      allExecs.forEach((e: any) => {
        if (!e.module) return
        const key = e.module.code
        if (!grouped.has(key)) grouped.set(key, { code: key, name: e.module.name, scores: [] })
        if (e.compliance_score != null) grouped.get(key)!.scores.push(e.compliance_score)
      })
      setModuleScores(Array.from(grouped.values()).map(g => ({
        code: g.code, name: g.name,
        score: Math.round(g.scores.reduce((a, b) => a + b, 0) / (g.scores.length || 1)),
        count: g.scores.length,
      })))

      // Tendencia diaria últimos 14 días
      const byDate = new Map<string, number[]>()
      allExecs.forEach((e: any) => {
        if (!e.completed_at || e.compliance_score == null) return
        const d = e.completed_at.split('T')[0]
        if (!byDate.has(d)) byDate.set(d, [])
        byDate.get(d)!.push(e.compliance_score)
      })
      const trendData = Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14)
        .map(([date, scores]) => ({
          date: date.slice(5),
          score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        }))
      setTrend(trendData)
    }

    // No conformidades abiertas
    const { count } = await supabase
      .from('non_conformities')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('status', 'open')
    setOpenNCs(count ?? 0)

    setLoading(false)
  }

  const avgScore = executions.length > 0
    ? Math.round(executions.reduce((s, e) => s + (e.compliance_score ?? 0), 0) / executions.length)
    : 0

  const completedToday = executions.filter(e => e.status === 'completed' || e.status === 'approved').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard BPM</h1>
        <p className="text-gray-500 text-sm">Resumen en tiempo real del cumplimiento</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cumplimiento hoy', value: `${avgScore}%`, icon: TrendingUp, color: getComplianceColor(avgScore).text, bg: getComplianceColor(avgScore).bg },
          { label: 'Checklists completados', value: completedToday, icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'No conformidades abiertas', value: openNCs, icon: AlertTriangle, color: openNCs > 0 ? 'text-red-700' : 'text-gray-600', bg: openNCs > 0 ? 'bg-red-50' : 'bg-gray-50' },
          { label: 'Pendientes del día', value: Math.max(0, 5 - completedToday), icon: Clock, color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Semáforo por módulo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Cumplimiento por Módulo (30 días)</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : moduleScores.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {moduleScores.map(m => {
                const { bg, text } = getComplianceColor(m.score)
                return (
                  <div key={m.code} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 w-7 shrink-0">{m.code}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 truncate">{m.name}</span>
                        <span className={`font-bold ${text}`}>{m.score}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${m.score >= 85 ? 'bg-green-500' : m.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${m.score}%` }}
                        />
                      </div>
                    </div>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${getComplianceDot(m.score)}`} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tendencia 14 días */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Tendencia de Cumplimiento</h2>
          {trend.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin datos suficientes</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Cumplimiento']} />
                <Line type="monotone" dataKey="score" stroke="#2E75B6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Checklists del día */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Checklists de Hoy</h2>
        {executions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No hay checklists registrados hoy</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Folio</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Módulo</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Operador</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Hora</th>
                  <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium">Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(e => {
                  const { text } = getComplianceColor(e.compliance_score ?? 0)
                  return (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono text-xs text-gray-500">{e.folio}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-gray-700">{(e.module as any)?.name ?? ''}</span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">
                        {(e.executor as any)?.full_name ?? ''}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs">
                        {e.completed_at ? formatDateTime(e.completed_at) : '—'}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${text}`}>
                        {e.compliance_score ?? 0}%
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
