/**
 * Área Documental — Supervisor / Administrador
 *
 * Lista de documentos BPM disponibles para el establecimiento.
 * Actualmente incluye: Programa de Higiene Estándar (personalizado con datos del tenant).
 */

import { useState } from 'react'
import { FileText, Printer, ChevronRight, BookOpen, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ProgramaHigiene from './documentos/ProgramaHigiene'

type DocView = null | 'programa-higiene'

const DOCS = [
  {
    id: 'programa-higiene' as const,
    icon: BookOpen,
    title: 'Programa de Higiene Estándar',
    description:
      'Procedimientos oficiales de higiene personal para manipuladores de alimentos. ' +
      'Incluye lavado de manos, uso de uniforme, EPP y conductas prohibidas. ' +
      'Personalizado con los datos del establecimiento.',
    badge: 'BPM',
    badgeColor: 'bg-green-900 text-green-300',
  },
]

export default function Documentos() {
  const { tenant } = useAuth()
  const [view, setView] = useState<DocView>(null)

  if (view === 'programa-higiene') {
    return (
      <div>
        {/* Back bar */}
        <div className="flex items-center gap-3 mb-6 print:hidden">
          <button
            onClick={() => setView(null)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Área Documental
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-sm text-gray-200 font-medium">Programa de Higiene Estándar</span>
          <div className="flex-1" />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
        </div>
        <ProgramaHigiene />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-400" />
          Área Documental
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Documentos BPM del establecimiento — {tenant?.name ?? ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOCS.map(doc => (
          <button
            key={doc.id}
            onClick={() => setView(doc.id)}
            className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-600 rounded-xl p-5 text-left transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center">
                <doc.icon className="w-5 h-5 text-blue-400" />
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${doc.badgeColor}`}>
                {doc.badge}
              </span>
            </div>
            <h3 className="font-semibold text-gray-100 group-hover:text-white text-sm mb-1">
              {doc.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
              {doc.description}
            </p>
            <div className="flex items-center gap-1 text-blue-400 text-xs mt-3 font-medium">
              Ver documento <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
