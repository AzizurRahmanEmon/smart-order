import { useEffect, useRef, useState } from 'react'

import { formatBDT } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Poisha } from '@/types/menu'

type PayableRowProps = {
  payable: Poisha
  dimmed?: boolean
}

export function PayableRow({ payable, dimmed }: PayableRowProps) {
  const prev = useRef(payable)
  const [highlight, setHighlight] = useState(false)

  useEffect(() => {
    if (prev.current === payable) return
    prev.current = payable
    setHighlight(true)
    const id = window.setTimeout(() => setHighlight(false), 500)
    return () => window.clearTimeout(id)
  }, [payable])

  return (
    <div
      className={cn(
        'flex min-h-11 items-center justify-between gap-3 rounded-lg bg-primary/10 px-3 py-2.5',
        'motion-safe:transition-[box-shadow,background-color] motion-safe:duration-300',
        highlight &&
          'bg-primary/15 shadow-[inset_0_0_0_1px] shadow-primary/25',
        dimmed && 'opacity-80',
      )}
    >
      <span className="text-sm font-semibold leading-none">Payable</span>
      <span
        key={payable}
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'font-heading text-xl font-semibold leading-none tracking-tight text-primary tabular-nums',
          'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300',
          highlight &&
            'motion-safe:scale-[1.03] motion-safe:transition-transform motion-safe:duration-300',
        )}
      >
        {formatBDT(payable)}
      </span>
    </div>
  )
}