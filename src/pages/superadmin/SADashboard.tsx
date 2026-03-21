import { useState, useEffect } from 'react'
import { Building2, Users, CreditCard, TrendingUp, Activity, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  planBreakdown: Record<string, number>
  recentTenants: any[]
}

const PLAN_COLOR: Record<string, string> = {
  free:       'text-gray-400  bg-gray-800',
  basic:      'text-blue-400  bg-blue-900/40',
  pro:        'text-indigo-400 bg-indigo-900/40',
  enterprise: 'text-amber-400 bg-amber-900/40',
}

export default function SADashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    const [
      { data: tenants },
      { count: userCount },
      { data: recent },
    ] = await Promise.all([
      supabase.from('tenants').select('*'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('tenants').select('id, name, plan, type, created_at').order('created_at', { ascending: false }).limit(5),
    ])

    const planBreakdown: Record<string, number> = {}
    tenants?.forEach(t => { planBreakdown[t.plan] = (planBreakdown[t.plan] ?? 0) + 1 })

    setStats({
      totalTenants:  tenants?.length ?? 0,
      activeTenants: tenants?.filter(t => t.active).length ?? 0,
      totalUsers:    userCount ?? 0,
      planBreakdown,
      recentTenants: recent ?? [],
    })
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Global</h1>
        <p className="text-gray-400 text-sm mt-1">Vista general de todas las empresas en RestoBPM</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-5 animate-pulse h-24" />
        )) : [
          { label: 'Empresas totales',   value: stats!.totalTenants,  icon: Building2,   color: 'text-indigo-400' },
          { label: 'Empresas activas',   value: stats!.activeTenants, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Usuarios totales',   value: stats!.totalUsers,    icon: Users,        color: 'text-blue-400' },
          { label: 'Plan Pro/Enterprise',value: (stats!.planBreakdown['pro'] ?? 0) + (stats!.planBreakdown['enterprise'] ?? 0), icon: TrendingUp, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <Icon size={20} className={`${color} mb-3`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Distribución de planes */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <CreditCard size={15} /> Distribución de planes
          </h2>
          {loading ? (
            <div className="space-y-2">{Array(4).fill(0).map((_,i) => <div key={i} className="h-8 bg-gray-700 rounded animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {['enterprise','pro','basic','free'].map(plan => {
                const count = stats!.planBreakdown[plan] ?? 0
                const pct = stats!.totalTenants > 0 ? Math.round(count / stats!.totalTenants * 100) : 0
                const planLabel = { free: 'Gratuito', basic: 'Básico', pro: 'Profesional', enterprise: 'Empresa' }[plan] ?? plan
                return (
                  <div key={plan} className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium min-w-[80px] text-center ${PLAN_COLOR[plan]}`}>{planLabel}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-white w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Empresas recientes */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Activity size={15} /> Empresas recientes
          </h2>
          {loading ? (
            <div className="space-y-2">{Array(4).fill(0).map((_,i) => <div key={i} className="h-10 bg-gray-700 rounded animate-pulse" />)}</div>
          ) : stats!.recentTenants.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Sin empresas registradas</p>
          ) : (
            <div className="space-y-2">
              {stats!.recentTenants.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString('es-CL')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLOR[t.plan] ?? PLAN_COLOR.free}`}>
                    {{ free:'Gratis', basic:'Básico', pro:'Pro', enterprise:'Empresa' }[t.plan as string] ?? t.plan}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
