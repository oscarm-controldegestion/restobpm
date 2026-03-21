interface BadgeProps { label: string; className?: string; dot?: boolean }

export default function Badge({ label, className = '', dot = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {label}
    </span>
  )
}
