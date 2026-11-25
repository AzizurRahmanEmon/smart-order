import { AlertTriangle } from 'lucide-react'

export type DisplayViolation = {
  code: string
  message: string
  key: string
}

type ViolationListProps = {
  violations: DisplayViolation[]
}

export function ViolationList({ violations }: ViolationListProps) {
  if (violations.length === 0) {
    return null
  }

  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:p-5"
    >
      <div className="flex gap-3 sm:gap-4">
        <div
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive"
        >
          <AlertTriangle className="size-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="font-medium leading-snug text-destructive">
            Fix these before adding to cart
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-destructive/90">
            {violations.map((v) => (
              <li key={v.key} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive/70"
                />
                <span>{v.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}