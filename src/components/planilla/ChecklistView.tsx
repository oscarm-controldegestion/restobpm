/**
 * ChecklistView — for monthly-frequency planillas (e.g. Revisiones Generales)
 *
 * Shows each item as a row with:
 *  - C / NC / NA status toggle (stored at day=1)
 *  - Upload button for items with requires_document=true
 *  - Uploaded file badge with view/delete controls
 */

import { useRef, useState } from 'react'
import {
  CheckCircle, XCircle, MinusCircle,
  Upload, FileText, Image as ImageIcon, Trash2, ExternalLink, Loader2
} from 'lucide-react'
import type { PlanillaItem, PlanillaValue, PlanillaDocument } from '@/types'
import { usePlanillaDocuments } from '@/hooks/usePlanillas'
import { usePlanillaEntries } from '@/hooks/usePlanillas'

// ─── Value button ─────────────────────────────────────────────────────────────
function ValueBtn({
  label, active, color, onClick
}: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1 rounded text-xs font-bold border transition-all
        ${active
          ? `${color} text-white border-transparent shadow-sm`
          : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
        }
      `}
    >
      {label}
    </button>
  )
}

// ─── Document badge ───────────────────────────────────────────────────────────
function DocBadge({
  doc, onDelete, canDelete
}: { doc: PlanillaDocument; onDelete: () => void; canDelete: boolean }) {
  const isPDF = doc.file_type === 'pdf'
  return (
    <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs max-w-[200px]">
      {isPDF
        ? <FileText className="w-3 h-3 text-red-500 flex-shrink-0" />
        : <ImageIcon className="w-3 h-3 text-blue-500 flex-shrink-0" />
      }
      <span className="truncate text-gray-600 max-w-[100px]" title={doc.file_name}>
        {doc.file_name}
      </span>
      <a
        href={doc.file_url}
        target="_blank"
        rel="noreferrer"
        className="text-blue-500 hover:text-blue-700 flex-shrink-0"
        title="Ver archivo"
      >
        <ExternalLink className="w-3 h-3" />
      </a>
      {canDelete && (
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-600 flex-shrink-0"
          title="Eliminar"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface ChecklistViewProps {
  monthId: string
  items: PlanillaItem[]
  readOnly?: boolean
  canDeleteDocs?: boolean
}

export default function ChecklistView({
  monthId, items, readOnly = false, canDeleteDocs = false
}: ChecklistViewProps) {
  const { entries, loading: entriesLoading, setValue } = usePlanillaEntries(monthId)
  const { documents, loading: docsLoading, uploadDocument, deleteDocument, getDocForItem } =
    usePlanillaDocuments(monthId)

  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const pendingItemId = useRef<string | null>(null)

  // Get current compliance value for an item (stored at day=1)
  const getValue = (itemId: string): PlanillaValue | null => {
    const e = entries.find(e => e.item_id === itemId && e.day === 1 && e.time_slot === null)
    return e?.value ?? null
  }

  // Toggle compliance value — clicking same value clears it
  const handleValue = (itemId: string, val: PlanillaValue) => {
    if (readOnly) return
    const current = getValue(itemId)
    setValue(itemId, 1, current === val ? null : val)
  }

  const handleUploadClick = (itemId: string) => {
    if (readOnly) return
    pendingItemId.current = itemId
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file   = e.target.files?.[0]
    const itemId = pendingItemId.current
    if (!file || !itemId) return

    setUploading(itemId)
    await uploadDocument(itemId, file)
    setUploading(null)
    pendingItemId.current = null
    e.target.value = ''
  }

  const handleDeleteDoc = async (doc: PlanillaDocument) => {
    const url = doc.file_url
    const idx = url.indexOf('planilla-docs/')
    if (idx < 0) return
    const filePath = url.slice(idx + 'planilla-docs/'.length)
    await deleteDocument(doc.id, filePath)
  }

  if (entriesLoading || docsLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Cargando...
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {items.map((item, idx) => {
        const val         = getValue(item.id)
        const doc         = getDocForItem(item.id)
        const isUploading = uploading === item.id

        // Subtle row tint based on compliance value
        const rowBg =
          val === 'C'  ? 'bg-green-50'  :
          val === 'NC' ? 'bg-red-50'    :
          val === 'NA' ? 'bg-gray-50'   : 'bg-white'

        return (
          <div
            key={item.id}
            className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 px-3 rounded-lg transition-colors ${rowBg}`}
          >
            {/* Row number + name */}
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className="text-gray-400 text-xs w-5 pt-0.5 flex-shrink-0 font-mono">{idx + 1}.</span>
              <span className={`text-sm break-words font-medium ${
                val === 'C'  ? 'text-green-800' :
                val === 'NC' ? 'text-red-800'   :
                val === 'NA' ? 'text-gray-400'  : 'text-gray-700'
              }`}>
                {item.name ?? (item as any).label}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap pl-7 sm:pl-0">

              {/* Editable: C / NC / NA toggles */}
              {!readOnly && (
                <>
                  <ValueBtn label="C"  active={val === 'C'}  color="bg-green-600" onClick={() => handleValue(item.id, 'C')}  />
                  <ValueBtn label="NC" active={val === 'NC'} color="bg-red-500"   onClick={() => handleValue(item.id, 'NC')} />
                  <ValueBtn label="NA" active={val === 'NA'} color="bg-gray-400"  onClick={() => handleValue(item.id, 'NA')} />
                </>
              )}

              {/* Read-only: status chip */}
              {readOnly && val && (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  val === 'C'  ? 'bg-green-100 text-green-700' :
                  val === 'NC' ? 'bg-red-100   text-red-700'   :
                                 'bg-gray-100  text-gray-500'
                }`}>
                  {val === 'C'  && <CheckCircle className="w-3 h-3" />}
                  {val === 'NC' && <XCircle     className="w-3 h-3" />}
                  {val === 'NA' && <MinusCircle className="w-3 h-3" />}
                  {val}
                </span>
              )}
              {readOnly && !val && (
                <span className="text-xs text-gray-300 italic">Sin registro</span>
              )}

              {/* Document (requires_document items) */}
              {item.requires_document && (
                <div className="flex items-center gap-1">
                  {doc ? (
                    <DocBadge
                      doc={doc}
                      onDelete={() => handleDeleteDoc(doc)}
                      canDelete={canDeleteDocs && !readOnly}
                    />
                  ) : (
                    !readOnly && (
                      <button
                        onClick={() => handleUploadClick(item.id)}
                        disabled={isUploading}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-brand-300 text-brand-600 hover:bg-brand-50 hover:border-brand-500 transition-all disabled:opacity-50"
                        title="Adjuntar documento (PDF o foto)"
                      >
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {isUploading ? 'Subiendo...' : 'Adjuntar'}
                      </button>
                    )
                  )}
                  {doc && !readOnly && (
                    <button
                      onClick={() => handleUploadClick(item.id)}
                      disabled={isUploading}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
                      title="Reemplazar documento"
                    >
                      {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {items.length === 0 && (
        <div className="py-8 text-center text-gray-400 text-sm">
          No hay ítems configurados para esta planilla.
        </div>
      )}
    </div>
  )
}
