import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, AlertCircle, ChevronRight, Thermometer, ClipboardCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { frequencyLabel, frequencyColor } from '@/lib/utils'
import type { BpmModule } from '@/types'

interface TaskStatus { module: BpmModule; done: boolean; score?: number; lastDone?: string }

const MODULE_ICONS: Record<string, React.ElementType> = {
  IF: ClipboardCheck, IS: ClipboardCheck, PM: ClipboardCheck,
  CS: ClipboardCheck, PF: Thermometer,
}

export default function OperatorHome() {
  const { profile, tenant } = useAuth()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<TaskStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodayTasks()
  }, [])

  const loadTodayTasks = async () => {
    if (!tenant) return
    const today = new Date().toISOString().split('T')[0]

    // Cargar módulos activos
    const { data: modules } = await supabase
      .from('bpm_modules')
      .select('*')
      .eq('active', true)
      .order('order_index')

    if (!modules) return

    // Verificar cuáles ya se ejecutaron hoy
    const { data: executions } = await supabase
      .from('checklist_executions')
      .select('module_id, compliance_score, completed_at, status')
      .eq('tenant_id', tenant.id)
      .eq('executed_by', profile!.id)
      .gte('started_at', today + 'T00:00:00')
      .in('status', ['completed', 'approved'])

    const doneMap = new Map(executions?.map(e => [e.module_id, e]) ?? [])

    setTasks(modules.map(m => ({
      module: m,
      done: doneMap.has(m.id),
      score: doneMap.get(m.id)?.compliance_score,
      lastDone: doneMap.get(m.id)?.completed_at,
    })))
    setLoading(false)
  }

  const done  = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct   = total ? Math.round((done / total) * 100) : 0

  return (
    <div className="max-w-lg mx-auto">
      {/* Saludo */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          ¡Hola, {profile?.full_name.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">Estas son tus tareas de hoy</p>
      </div>

      {/* Progreso del día */}
      <div className="bg-brand-700 rounded-2xl p-5 text-white mb-6 shadow-lg">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-wide font-medium">Progreso del día</p>
            <p className="text-4xl font-bold mt-1">{pct}<span className="text-2xl">%</span></p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs">Completadas</p>
            <p className="text-2xl font-bold">{done}/{total}</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2.5">
          <div
            className="bg-white rounded-full h-2.5 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && (
          <p className="text-green-300 text-sm mt-3 font-medium">
            ✅ ¡Todas las tareas completadas!
          </p>
        )}
      </div>

      {/* Lista de tareas */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(({ module, done, score }) => {
            const Icon = MODULE_ICONS[module.code] || ClipboardCheck
            return (
              <button
                key={module.id}
                onClick={() => navigate(`/operator/checklist/${module.code}`)}
                className={`w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border-2 transition-all active:scale-[0.98] text-left ${
                  done ? 'border-green-200' : 'border-transparent hover:border-brand-200'
                }`}
              >
                {/* Icono */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  done ? 'bg-green-100' : 'bg-brand-100'
                }`}>
                  {done
                    ? <CheckCircle2 size={22} className="text-green-600" />
                    : <Icon size={22} className="text-brand-700" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                      {module.code}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {module.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {done
                      ? `Completado · ${score ?? 0}% cumplimiento`
                      : module.description
                    }
                  </p>
                </div>

                {/* Estado */}
                <div className="shrink-0 flex items-center gap-1">
                  {done ? (
                    <span className="text-green-600 font-bold text-sm">{score}%</span>
                  ) : (
                    <div className="flex items-center gap-1 text-orange-500">
                      <AlertCircle size={14} />
                      <span className="text-xs font-medium">Pendiente</span>
                    </div>
                  )}
                  <ChevronRight size={16} className="text-gray-300 ml-1" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Nota normativa */}
      <p className="text-center text-xs text-gray-400 mt-8 px-4">
        Registros conforme D.S. 977/96 RSA · SEREMI de Salud
      </p>
    </div>
  )
}
