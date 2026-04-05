import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ItemResult, Severity, ExecutionStatus } from '@/types'

// ─── FECHA ────────────────────────────────────────────────────────────────────
export const formatDate = (date: string | Date) =>
  format(new Date(date), "dd 'de' MMMM yyyy", { locale: es })

export const formatDateTime = (date: string | Date) =>
  format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es })

export const timeAgo = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { locale: es, addSuffix: true })

export const isExpired = (date: string) => isBefore(new Date(date), new Date())

export const isExpiringSoon = (date: string, days = 30) =>
  isAfter(new Date(date), new Date()) && isBefore(new Date(date), addDays(new Date(), days))

// ─── PUNTAJE ──────────────────────────────────────────────────────────────────
export const resultToScore = (result: ItemResult): number => {
  switch (result) {
    case 'complies':      return 2
    case 'partial':       return 1
    case 'non_compliant': return 0
    case 'na':            return -1  // excluir del cálculo
    default:              return 0
  }
}

export const calculateComplianceScore = (
  results: { result: ItemResult }[]
): number => {
  const applicable = results.filter(r => r.result !== 'na')
  if (applicable.length === 0) return 100
  const obtained = applicable.reduce((sum, r) => sum + resultToScore(r.result), 0)
  const max = applicable.length * 2
  return Math.round((obtained / max) * 100)
}

// ─── SEMÁFORO ─────────────────────────────────────────────────────────────────
export const getComplianceColor = (score: number): { bg: string; text: string; label: string } => {
  if (score >= 85) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Satisfactorio' }
  if (score >= 70) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Con observaciones' }
  return { bg: 'bg-red-100', text: 'text-red-700', label: 'Incumplimiento crítico' }
}

export const getComplianceDot = (score: number): string => {
  if (score >= 85) return 'bg-green-500'
  if (score >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

// ─── RESULTADO ITEM ───────────────────────────────────────────────────────────
export const resultLabel: Record<ItemResult, string> = {
  complies:      'Cumple',
  partial:       'Cumple parcialmente',
  non_compliant: 'No cumple',
  na:            'No aplica',
}

export const resultColor: Record<ItemResult, string> = {
  complies:      'bg-green-100 text-green-700',
  partial:       'bg-yellow-100 text-yellow-700',
  non_compliant: 'bg-red-100 text-red-700',
  na:            'bg-gray-100 text-gray-500',
}

// ─── SEVERITY ─────────────────────────────────────────────────────────────────
export const severityLabel: Record<Severity, string> = {
  low:      'Baja',
  medium:   'Media',
  high:     'Alta',
  critical: 'Crítica',
}

export const severityColor: Record<Severity, string> = {
  low:      'bg-blue-100 text-blue-700',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

// ─── STATUS EJECUCIÓN ─────────────────────────────────────────────────────────
export const executionStatusLabel: Record<ExecutionStatus, string> = {
  in_progress: 'En progreso',
  completed:   'Completado',
  approved:    'Aprobado',
  rejected:    'Rechazado',
}

// ─── FOLIO ────────────────────────────────────────────────────────────────────
export const generateFolio = (seq: number): string => {
  const year = new Date().getFullYear()
  return `BPM-${year}-${String(seq).padStart(4, '0')}`
}

// ─── FRECUENCIA ───────────────────────────────────────────────────────────────
export const frequencyLabel: Record<string, string> = {
  daily:         'Diario',
  weekly:        'Semanal',
  monthly:       'Mensual',
  per_reception: 'C/Recepción',
  annual:        'Anual',
}

export const frequencyColor: Record<string, string> = {
  daily:         'bg-orange-100 text-orange-700',
  weekly:        'bg-yellow-100 text-yellow-700',
  monthly:       'bg-blue-100 text-blue-700',
  per_reception: 'bg-purple-100 text-purple-700',
  annual:        'bg-gray-100 text-gray-600',
}

// ─── PLAN ─────────────────────────────────────────────────────────────────────
export const planColor: Record<string, string> = {
  free:       'bg-gray-100 text-gray-600',
  basic:      'bg-blue-100 text-blue-700',
  pro:        'bg-brand-100 text-brand-700',
  enterprise: 'bg-purple-100 text-purple-700',
}

export const formatCLP = (amount: number): string =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount)

// ─── RE-EXPORT pricing plans ──────────────────────────────────────────────────
export { PRICING_PLANS } from '@/types'
