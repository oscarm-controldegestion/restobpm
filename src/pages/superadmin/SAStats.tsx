import { useState, useEffect } from 'react'
import { BarChart2, CheckCircle2, AlertTriangle, Thermometer } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SAStats() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const [
      { count: execCount },
      { count: ncCount },
      { count: tempCount },
    ] = await Promise.all([
      supabase.from('checklist_executions').select('*', { count: 'exact', head: true }),
      supabase.from('non_conformities').select('*', { count: 'exact', head: true }),
      supabase.from('temperature_logs').select('*', { count: 'exact', head: true }),
    ])

    // Checklists por día (últimos 30 días)
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data: recent } = await supabase
      .from('checklist_executions')
      .select('completed_at, compliance_score')
      .eq('status', 'completed')
      .gte('completed_at', since)
      .order('completed_at')

    // Agrupar por día
    const byDay: Record<string, number[]> = {}
    ;(recent ?? []).forEach((e: any) => {
      if (!e.completed_at) return
      const d = e.completed_at.slice(0, 10)
      if (!byDay[d]) byDay[d] = []
      if (e.compliance_score != null) byDay[d].push(e.compliance_score)
    })

    setData({ execCount, ncCount, tempCount, byDay })
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Métricas globales</h1>
        <p className="text-gray-400 text-sm mt-1">Actividad de toda la plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? Array(3).fill(0).map((_,i) => <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse border border-gray-700" />) : [
          { label: 'Checklists ejecutados', value: data.execCount ?? 0, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'No conformidades', value: data.ncCount ?? 0, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Registros de temperatura', value: data.tempCount ?? 0, icon: Thermometer, color: 'text-blue-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <Icon size={20} className={`${color} mb-3`} />
            <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Actividad últimos 30 días */}
      {!loading && data?.byDay && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-5 flex items-center gap-2">
            <BarChart2 size={15} /> Checklists completados (últimos 30 días)
          </h2>
          {Object.keys(data.byDay).length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Sin actividad en el período</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {Object.entries(data.byDay).slice(-30).map(([date, scores]) => {
                const avg = (scores as number[]).length > 0
                  ? Math.round((scores as number[]).reduce((a, b) => a + b, 0) / (scores as number[]).length)
                  : 0
                const count = (scores as number[]).length
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-0.5" title={`${date}: ${count} checklists, ${avg}% promedio`}>
                    <div
                      className="w-full rounded-t-sm bg-indigo-500/70 hover:bg-indigo-400 transition-colors"
                      style={{ height: `${Math.max(4, (count / Math.max(...Object.values(data.byDay).map((s: any) => s.length))) * 100)}%` }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
