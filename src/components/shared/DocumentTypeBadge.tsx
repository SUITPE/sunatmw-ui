import { cn } from '@/lib/utils'

const typeConfig: Record<string, { label: string; className: string }> = {
  '01': { label: 'FAC', className: 'bg-blue-100 text-blue-700' },
  '03': { label: 'BOL', className: 'bg-indigo-100 text-indigo-700' },
  '07': { label: 'NC', className: 'bg-orange-100 text-orange-700' },
  '08': { label: 'ND', className: 'bg-rose-100 text-rose-700' },
  '09': { label: 'GR', className: 'bg-teal-100 text-teal-700' },
  '20': { label: 'RET', className: 'bg-purple-100 text-purple-700' },
  '40': { label: 'PER', className: 'bg-violet-100 text-violet-700' },
  'RA': { label: 'BAJA', className: 'bg-gray-100 text-gray-700' },
}

export function DocumentTypeBadge({ type, className }: { type: string; className?: string }) {
  const config = typeConfig[type] ?? { label: type, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  )
}
