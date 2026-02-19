import { CheckCircle2, XCircle, Send, Clock, AlertTriangle, Ban, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  ACCEPTED: { label: 'Aceptado', className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  REJECTED: { label: 'Rechazado', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  SENT: { label: 'Enviado', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
  PENDING: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  ERROR: { label: 'Error', className: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  VOIDED: { label: 'Anulado', className: 'bg-gray-50 text-gray-700 border-gray-200', icon: Ban },
  OBSERVED: { label: 'Observado', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: AlertCircle },
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle }
  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}
