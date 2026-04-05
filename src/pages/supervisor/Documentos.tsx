/**
 * Área Documental — Supervisor / Administrador
 *
 * Documentos BPM disponibles:
 *  1. Manual BPM + Programa de Higiene (renderizados en pantalla)
 *  2. 8 POE (Procedimientos Operativos Estándar) — descarga DOCX
 *  3. 6 POES (Procedimientos Operativos de Sanitización) — descarga DOCX
 *
 * Los documentos DOCX se generan en el navegador con los datos del
 * establecimiento ya incluidos (docGenerator.ts).
 */

import { useState } from 'react'
import {
  FileText, Printer, ChevronRight, BookOpen, ArrowLeft,
  ClipboardList, Download, AlertTriangle, Settings, Loader2,
  ChefHat, Droplets,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ProgramaHigiene from './documentos/ProgramaHigiene'
import ManualBPM from './documentos/ManualBPM'
import { downloadDoc } from '@/services/docGenerator'
import type { DocCode } from '@/services/docGenerator'

// ── Tipos ─────────────────────────────────────────────────────────────────────
type DocView = null | 'programa-higiene' | 'manual-bpm'

// ── Documentos renderizados en pantalla ───────────────────────────────────────
const SCREEN_DOCS = [
  {
    id: 'manual-bpm' as const,
    icon: ClipboardList,
    title: 'Manual BPM',
    description:
      'Manual completo de Buenas Prácticas de Manufactura conforme al D.S. N° 977/96 del MINSAL. ' +
      'Cubre instalaciones, agua, higiene del personal, temperaturas, limpieza, plagas, residuos, ' +
      'trazabilidad, capacitación y registros. Personalizado con los datos del establecimiento.',
    badge: 'D.S. 977/96',
    badgeColor: 'bg-blue-900 text-blue-300',
  },
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

// ── POE — Procedimientos Operativos Estándar ──────────────────────────────────
const POE_DOCS: { code: DocCode; title: string; subtitle: string }[] = [
  {
    code: 'POE-BPM-HIG-001',
    title: 'Higiene del Personal',
    subtitle: 'Lavado de manos · Uniforme · Conducta · EPP',
  },
  {
    code: 'POE-BPM-COC-001',
    title: 'Cocción de Alimentos',
    subtitle: 'Temperaturas · Puntos críticos · Verificación',
  },
  {
    code: 'POE-BPM-ENF-001',
    title: 'Enfriamiento Rápido',
    subtitle: 'Cadena de frío · Método 2/4h · Almacenamiento',
  },
  {
    code: 'POE-BPM-CAR-001',
    title: 'Manejo de Carnes',
    subtitle: 'Recepción · Descongelado · Preparación · Temperaturas',
  },
  {
    code: 'POE-BPM-VEG-001',
    title: 'Manejo de Verduras y Frutas',
    subtitle: 'Lavado · Desinfección · Corte · Almacenamiento',
  },
  {
    code: 'POE-BPM-OTR-001',
    title: 'Manejo de Otros Productos',
    subtitle: 'Lácteos · Huevos · Salsas · Productos de alto riesgo',
  },
  {
    code: 'POE-BPM-ALE-001',
    title: 'Control de Alérgenos',
    subtitle: 'Identificación · Separación · Rotulación · Comunicación',
  },
  {
    code: 'POE-BPM-SER-001',
    title: 'Servicio de Alimentos',
    subtitle: 'Temperatura de servicio · Bufet · Delivery · Sobrantes',
  },
]

// ── POES — Procedimientos Operativos de Sanitización ─────────────────────────
const POES_DOCS: { code: DocCode; title: string; subtitle: string }[] = [
  {
    code: 'POES-LIM-001',
    title: 'Limpieza y Desinfección de Superficies',
    subtitle: 'Mesones · Tablas · Cuchillos · Utensilios',
  },
  {
    code: 'POES-EQP-001',
    title: 'Limpieza de Equipos de Cocina',
    subtitle: 'Hornos · Freidoras · Parrillas · Refrigeración',
  },
  {
    code: 'POES-INS-001',
    title: 'Limpieza de Instalaciones',
    subtitle: 'Pisos · Paredes · Baños · Sala de clientes',
  },
  {
    code: 'POES-PLG-001',
    title: 'Control de Plagas',
    subtitle: 'Prevención · Monitoreo · Fumigación · Registros',
  },
  {
    code: 'POES-PER-001',
    title: 'Higiene y Vestuario del Personal',
    subtitle: 'Uniforme · Ropa de trabajo · Ingreso · Visitantes',
  },
  {
    code: 'POES-RES-001',
    title: 'Manejo de Residuos Sólidos',
    subtitle: 'Clasificación · Almacenamiento · Retiro · Reciclaje',
  },
]

// ── Componente tarjeta de descarga ────────────────────────────────────────────
function DocCard({
  code,
  title,
  subtitle,
  colorClass,
  iconBgClass,
  badgeClass,
  badgeLabel,
  onDownload,
  loading,
}: {
  code: string
  title: string
  subtitle: string
  colorClass: string
  iconBgClass: string
  badgeClass: string
  badgeLabel: string
  onDownload: () => void
  loading: boolean
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass}`}>
          <FileText className={`w-5 h-5 ${colorClass}`} />
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-xs font-mono text-gray-500 mb-0.5">{code}</p>
        <h3 className="font-semibold text-gray-100 text-sm mb-1">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{subtitle}</p>
      </div>
      <button
        onClick={onDownload}
        disabled={loading}
        className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed
          ${loading
            ? 'bg-gray-700 text-gray-400'
            : `bg-gray-700 hover:bg-gray-600 ${colorClass}`
          }`}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</>
          : <><Download className="w-4 h-4" /> Descargar DOCX</>
        }
      </button>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Documentos() {
  const { tenant } = useAuth()
  const [view, setView]       = useState<DocView>(null)
  const [loading, setLoading] = useState<Partial<Record<DocCode, boolean>>>({})

  const missingFields = !tenant?.resolucion_sanitaria || !tenant?.responsible_bpm

  async function handleDownload(code: DocCode) {
    if (!tenant) return
    setLoading(prev => ({ ...prev, [code]: true }))
    try {
      await downloadDoc(code, tenant)
    } catch (err) {
      console.error('Error generating document:', err)
      alert('Error al generar el documento. Verifique los datos del establecimiento.')
    } finally {
      setLoading(prev => ({ ...prev, [code]: false }))
    }
  }

  // ── Vista de documento renderizado en pantalla ────────────────────────────
  if (view) {
    const docTitle = SCREEN_DOCS.find(d => d.id === view)?.title ?? ''
    return (
      <div>
        <div className="flex items-center gap-3 mb-6 print:hidden">
          <button
            onClick={() => setView(null)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Área Documental
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-sm text-gray-200 font-medium">{docTitle}</span>
          <div className="flex-1" />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
        </div>
        {view === 'manual-bpm'       && <ManualBPM />}
        {view === 'programa-higiene' && <ProgramaHigiene />}
      </div>
    )
  }

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-400" />
          Área Documental
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Documentos BPM del establecimiento — {tenant?.name ?? ''}
        </p>
      </div>

      {/* Alerta si faltan datos del establecimiento */}
      {missingFields && (
        <div className="flex items-start gap-3 bg-amber-900/30 border border-amber-700/50 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="text-amber-200 font-medium mb-0.5">
              Complete los datos del establecimiento para que los documentos muestren su información
            </p>
            <p className="text-amber-400/80 text-xs">
              Faltan campos requeridos: resolución sanitaria y/o responsable BPM.
              Los documentos se pueden descargar igualmente, pero aparecerán con datos incompletos.
            </p>
          </div>
          <a
            href="/settings"
            className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-100 font-medium shrink-0 mt-0.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Completar
          </a>
        </div>
      )}

      {/* ── Sección: Documentos principales (visualización) ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Documentos principales
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCREEN_DOCS.map(doc => (
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
      </section>

      {/* ── Sección: POE ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ChefHat className="w-4 h-4 text-green-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Procedimientos Operativos Estándar (POE)
          </h2>
          <span className="text-xs text-gray-600 ml-1">— descarga DOCX con datos del establecimiento</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {POE_DOCS.map(doc => (
            <DocCard
              key={doc.code}
              code={doc.code}
              title={doc.title}
              subtitle={doc.subtitle}
              colorClass="text-green-400"
              iconBgClass="bg-green-900/40"
              badgeClass="bg-green-900 text-green-300"
              badgeLabel="POE"
              onDownload={() => handleDownload(doc.code)}
              loading={!!loading[doc.code]}
            />
          ))}
        </div>
      </section>

      {/* ── Sección: POES ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Procedimientos Operativos de Sanitización (POES)
          </h2>
          <span className="text-xs text-gray-600 ml-1">— descarga DOCX con datos del establecimiento</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {POES_DOCS.map(doc => (
            <DocCard
              key={doc.code}
              code={doc.code}
              title={doc.title}
              subtitle={doc.subtitle}
              colorClass="text-blue-400"
              iconBgClass="bg-blue-900/40"
              badgeClass="bg-blue-900 text-blue-300"
              badgeLabel="POES"
              onDownload={() => handleDownload(doc.code)}
              loading={!!loading[doc.code]}
            />
          ))}
        </div>
      </section>

    </div>
  )
}
