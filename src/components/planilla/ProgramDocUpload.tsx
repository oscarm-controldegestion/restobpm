/**
 * ProgramDocUpload — botón reutilizable para adjuntar
 * un archivo (PDF o imagen) a los programas documentales.
 */
import { useRef } from 'react'
import { Upload, FileText, Image as ImageIcon, X, ExternalLink } from 'lucide-react'

interface Props {
  label:     string
  file:      File | null
  existingUrl?:  string | null
  existingName?: string | null
  accept?:   string
  onChange:  (f: File | null) => void
  disabled?: boolean
}

export default function ProgramDocUpload({
  label, file, existingUrl, existingName, accept = 'image/*,application/pdf',
  onChange, disabled = false,
}: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const isPDF = (name: string) => name.toLowerCase().endsWith('.pdf')

  if (file) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        {isPDF(file.name)
          ? <FileText size={16} className="text-red-500 shrink-0" />
          : <ImageIcon size={16} className="text-blue-500 shrink-0" />
        }
        <span className="truncate text-blue-800 max-w-[180px]">{file.name}</span>
        <span className="text-blue-400 text-xs">({(file.size / 1024).toFixed(0)} KB)</span>
        <button type="button" onClick={() => onChange(null)} className="ml-auto text-gray-400 hover:text-red-500">
          <X size={14} />
        </button>
      </div>
    )
  }

  if (existingUrl && existingName) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
        {isPDF(existingName)
          ? <FileText size={16} className="text-red-500 shrink-0" />
          : <ImageIcon size={16} className="text-blue-500 shrink-0" />
        }
        <span className="truncate text-gray-700 max-w-[160px]">{existingName}</span>
        <a href={existingUrl} target="_blank" rel="noreferrer"
          className="ml-auto text-blue-500 hover:text-blue-700">
          <ExternalLink size={14} />
        </a>
        {!disabled && (
          <button type="button" onClick={() => ref.current?.click()} className="text-gray-400 hover:text-blue-500 ml-1">
            <Upload size={14} />
          </button>
        )}
        <input ref={ref} type="file" accept={accept} className="hidden"
          onChange={e => e.target.files?.[0] && onChange(e.target.files[0])} />
      </div>
    )
  }

  return (
    <>
      <button type="button" disabled={disabled}
        onClick={() => ref.current?.click()}
        className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors">
        <Upload size={15} />
        {label}
      </button>
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={e => e.target.files?.[0] && onChange(e.target.files[0])} />
    </>
  )
}
