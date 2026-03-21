import { useState, useEffect } from 'react'
import { BarChart2, Thermometer, Users, FileText, TrendingUp, Download } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getComplianceColor } from '@/lib/utils'
import type { BpmModule } from '@/types'

type Tab = 'compliance' | 'temperatures' | 'documents'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function Reports() {
  const { tenant } = useAuth()
  const [tab, setTab]           = useState<Tab>('compliance')
  const [modules, setModules]   = useState<BpmModule[]>([])
  const [monthlyData, setMonthlyData] = useState<{ month: string; score: number; count: number }[]>([])
  const [moduleScores, setModuleScores] = useState<{ code: string; name: string; score: number; count: number }[]>([])
  const [tempLogs, setTempLogs] = useState<any[]>([])
  const [docs, setDocs]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [year, setYear]         = useState(new Date().getFullYear())

  useEffect(() => { if (tenant) loadData() }, [tenant, year])

  const loadData = async () => {
    if (!tenant) return
    setLoading(true)

    // Compliance por mes del año seleccionado
    const { data: execs } = await supabase
      .from('checklist_executions')
      .select('compliance_score, completed_at, module_id, module:bpm_modules(code, name)')
      .eq('tenant_id', tenant.id)
      .eq('status', 'completed')
      .gte('started_at', `${year}-01-01`)
      .lte('started_at', `${year}-12-31`)

    if (execs) {
      // Por mes
      const byMonth: Record<number, number[]> = {}
      execs.forEach((e: any) => {
        if (!e.completed_at || e.compliance_score == null) return
        const m = new Date(e.completed_at).getMonth()
        if (!byMonth[m]) byMonth[m] = []
        byMonth[m].push(e.compliance_score)
      })
      setMonthlyData(MONTHS.map((month, i) => {
        const scores = byMonth[i] ?? []
        return {
          month,
          score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          count: scores.length,
        }
      }))

      // Por módulo
      const byModule: Record<string, { code: string; name: string; scores: number[] }> = {}
      execs.forEach((e: any) => {
        if (!e.module || e.compliance_score == null) return
        const k = e.module.code
        if (!byModule[k]) byModule[k] = { code: k, name: e.module.name, scores: [] }
        byModule[k].scores.push(e.compliance_score)
      })
      setModuleScores(Object.values(byModule).map(m => ({
        code: m.code, name: m.name,
        score: Math.round(m.scores.reduce((a,b) => a+b, 0) / m.scores.length),
        count: m.scores.length,
      })).sort((a, b) => b.score - a.score))
    }

    // Logs de temperatura (últimos 30 días)
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data: temps } = await supabase
      .from('temperature_logs')
      .select('*, recorder:profiles!recorded_by(full_name)')
      .eq('tenant_id', tenant.id)
      .gte('recorded_at', since30)
      .order('recorded_at', { ascending: false })
      .limit(50)
    setTempLogs(temps ?? [])

    // Documentos del personal
    const { data: documents } = await supabase
      .from('personnel_documents')
      .select('*, profile:profiles(full_name)')
      .eq('tenant_id', tenant.id)
      .order('expiry_date', { ascending: true })
    setDocs(documents ?? [])

    setLoading(false)
  }

  const TAB_CONFIG = [
    { id: 'compliance' as Tab, label: 'Cumplimiento BPM', icon: BarChart2 },
    { id: 'temperatures' as Tab, label: 'Temperaturas', icon: Thermometer },
    { id: 'documents' as Tab, label: 'Documentos Personal', icon: Users },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes de Cumplimiento</h1>
          <p className="text-gray-500 text-sm">Informes y estadísticas D.S. 977/96 RSA</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${tab === id ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Cumplimiento BPM */}
      {tab === 'compliance' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Año:</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Gráfico de barras mensual */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-800 mb-5">Cumplimiento Mensual {year}</h2>
                <div className="flex items-end gap-2 h-40">
                  {monthlyData.map(({ month, score, count }) => {
                    const { bg } = score > 0
                      ? { bg: score >= 85 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-400' : 'bg-red-500' }
                      : { bg: 'bg-gray-100' }
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500">{score > 0 ? `${score}%` : ''}</span>
                        <div className="w-full relative" style={{ height: 100 }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-t-sm ${bg} transition-all`}
                            style={{ height: score > 0 ? `${score}%` : '4px' }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{month}</span>
                        {count > 0 && <span className="text-xs text-gray-400">{count}</span>}
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> ≥85%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> 70-84%</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> &lt;70%</span>
                </div>
              </div>

              {/* Por módulo */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="font-semibold text-gray-800 mb-4">Cumplimiento por Módulo</h2>
                {moduleScores.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Sin datos para el período seleccionado</p>
                ) : (
                  <div className="space-y-3">
                    {moduleScores.map(m => {
                      const { text } = getComplianceColor(m.score)
                      return (
                        <div key={m.code} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-500 w-8 shrink-0">{m.code}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-700">{m.name}</span>
                              <span className={`font-bold ${text}`}>{m.score}% <span className="text-gray-400 font-normal">({m.count} registros)</span></span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${m.score >= 85 ? 'bg-green-500' : m.score >= 70 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                style={{ width: `${m.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Temperaturas */}
      {tab === 'temperatures' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Registro de Temperaturas (últimos 30 días)</h2>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : tempLogs.length === 0 ? (
            <div className="py-16 text-center">
              <Thermometer size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Sin registros de temperatura</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Fecha</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Ubicación</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Registrado por</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">Temp.</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Rango</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {tempLogs.map(t => (
                  <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-4 text-xs text-gray-500">{new Date(t.recorded_at).toLocaleString('es-CL')}</td>
                    <td className="py-2.5 px-4 text-gray-700">{t.location}</td>
                    <td className="py-2.5 px-4 text-gray-600">{t.recorder?.full_name ?? '—'}</td>
                    <td className="py-2.5 px-4 text-right font-bold">
                      <span className={t.in_range ? 'text-green-700' : 'text-red-700'}>{t.temperature}°C</span>
                    </td>
                    <td className="py-2.5 px-4 text-center text-xs text-gray-400">{t.min_temp}°C – {t.max_temp}°C</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.in_range ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {t.in_range ? 'OK' : 'Alerta'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Documentos personal */}
      {tab === 'documents' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Nómina de Documentos del Personal</h2>
            <p className="text-xs text-gray-400 mt-1">Carnets de manipulador, exámenes y capacitaciones</p>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : docs.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Sin documentos registrados</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Persona</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Tipo</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Emisión</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Vencimiento</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => {
                  const statusColor = {
                    valid:          'bg-green-50 text-green-700',
                    expiring_soon:  'bg-yellow-50 text-yellow-700',
                    expired:        'bg-red-50 text-red-700',
                  }[d.status as string] ?? 'bg-gray-50 text-gray-600'
                  const statusLabel = { valid: 'Vigente', expiring_soon: 'Por vencer', expired: 'Vencido' }[d.status as string] ?? d.status
                  const typeLabel = {
                    food_handler_card: 'Carnet Manipulador',
                    lab_exam: 'Examen Lab.',
                    training: 'Capacitación',
                    other: 'Otro',
                  }[d.document_type as string] ?? d.document_type
                  return (
                    <tr key={d.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-4 font-medium text-gray-800">{d.profile?.full_name ?? '—'}</td>
                      <td className="py-2.5 px-4 text-gray-600">{typeLabel}</td>
                      <td className="py-2.5 px-4 text-xs text-gray-500">{d.issued_date ? new Date(d.issued_date).toLocaleDateString('es-CL') : '—'}</td>
                      <td className="py-2.5 px-4 text-xs text-gray-500">{d.expiry_date ? new Date(d.expiry_date).toLocaleDateString('es-CL') : '—'}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
