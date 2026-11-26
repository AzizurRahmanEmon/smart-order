import { AlertTriangle } from 'lucide-react'

import type { GroupViolation } from '@/lib/groupViolations'
import { cn } from '@/lib/utils'

type GroupViolationAlertsProps = {
  violations: GroupViolation[]
  className?: string
  compact?: boolean
}

export function GroupViolationAlerts({
  violations,
  className,
  compact = false,
}: GroupViolationAlertsProps) {
  if (violations.length === 0) return null

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-destructive/25 bg-destructive/5 text-destructive',
        compact ? 'px-2 py-1.5' : 'px-2.5 py-2',
        className,
      )}
    >
      <div className="flex gap-2">
        <AlertTriangle
          className={cn('shrink-0 opacity-90', compact ? 'mt-0 size-3.5' : 'mt-0.5 size-4')}
          aria-hidden
        />
        <ul
          className={cn(
            'min-w-0 space-y-1 leading-snug text-destructive/95',
            compact ? 'text-[0.7rem]' : 'text-xs',
          )}
        >
          {violations.map((v) => (
            <li key={v.key}>{v.message}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}