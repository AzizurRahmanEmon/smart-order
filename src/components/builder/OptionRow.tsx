import { Minus, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatBDT } from '@/lib/money'
import type { MenuOption } from '@/types/menu'

type OptionRowProps = {
  option: MenuOption
  quantity: number
  /** More units of this option that fit in stock (Infinity = unlimited). */
  addableMore: number
  onDecrement: () => void
  onIncrement: () => void
}

export function OptionRow({
  option,
  quantity,
  addableMore,
  onDecrement,
  onIncrement,
}: OptionRowProps) {
  const unlimited = !Number.isFinite(addableMore)
  const atStockCap = !unlimited && addableMore <= 0
  const selected = quantity > 0
  const lowStock = !unlimited && addableMore <= 3

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl px-1.5 py-2 sm:gap-2.5 sm:px-2 sm:py-2.5',
        selected
          ? 'bg-primary/8 ring-1 ring-primary/15'
          : 'hover:bg-muted/60',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight sm:text-base">
          {option.name}
        </p>
        <p
          className={cn(
            'text-xs tabular-nums sm:text-sm',
            option.price > 0 ? 'text-foreground/80' : 'text-muted-foreground',
          )}
        >
          {option.price > 0 ? formatBDT(option.price) : 'Included'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        {!unlimited ? (
          <Badge
            variant={lowStock ? 'destructive' : 'secondary'}
            className={cn(
              'h-5 px-1.5 text-[0.65rem] leading-none whitespace-nowrap sm:h-6 sm:px-2 sm:text-xs',
              !lowStock && 'bg-accent text-accent-foreground',
            )}
          >
            {addableMore} left
          </Badge>
        ) : null}
        <div className="flex items-center gap-0.5 rounded-full border border-border/80 bg-background/80 p-0.5 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="rounded-full"
            aria-label={`Decrease ${option.name}`}
            onClick={onDecrement}
            disabled={quantity <= 0}
          >
            <Minus />
          </Button>
          <span
            className={cn(
              'w-7 text-center text-xs font-semibold tabular-nums sm:w-8 sm:text-sm',
              selected && 'text-primary',
            )}
            aria-live="polite"
          >
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="rounded-full"
            aria-label={`Increase ${option.name}`}
            onClick={onIncrement}
            disabled={atStockCap}
          >
            <Plus />
          </Button>
        </div>
      </div>
    </div>
  )
}