import { cn } from '@/lib/utils'

interface UsageBarProps {
  used: number
  limit: number | null
  className?: string
}

function getUsageColor(percentage: number): {
  bar: string
  text: string
  bg: string
} {
  if (percentage >= 90) {
    return {
      bar: 'bg-red-500',
      text: 'text-red-600',
      bg: 'bg-red-100',
    }
  }
  if (percentage >= 70) {
    return {
      bar: 'bg-amber-500',
      text: 'text-amber-600',
      bg: 'bg-amber-100',
    }
  }
  return {
    bar: 'bg-green-500',
    text: 'text-green-600',
    bg: 'bg-green-100',
  }
}

export function UsageBar({ used, limit, className }: UsageBarProps) {
  if (limit === null || limit === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Documentos emitidos este mes</span>
          <span className="font-mono font-medium">{used} (ilimitado)</span>
        </div>
        <div className="h-3 rounded-full bg-green-100 overflow-hidden">
          <div className="h-full bg-green-500 rounded-full w-full" />
        </div>
      </div>
    )
  }

  const percentage = Math.min(Math.round((used / limit) * 100), 100)
  const colors = getUsageColor(percentage)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Documentos emitidos este mes</span>
        <span className={cn('font-mono font-medium', colors.text)}>
          {used} de {limit} ({percentage}%)
        </span>
      </div>
      <div className={cn('h-3 rounded-full overflow-hidden', colors.bg)}>
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', colors.bar)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage >= 90 && (
        <p className="text-xs text-red-600">
          Te quedan {limit - used} documentos. Considera actualizar tu plan.
        </p>
      )}
    </div>
  )
}
