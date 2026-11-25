import { Minus, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatBDT } from '@/lib/money'
import type { MenuOption } from '@/types/menu'

type OptionRowProps = {
  option: MenuOption
  quantity: number
  stockLeft: number | null
  onDecrement: () => void
  onIncrement: () => void
}

export function OptionRow({
  option,
  quantity,
  stockLeft,
  onDecrement,
  onIncrement,
}: OptionRowProps) {
  const atStockCap = stockLeft !== null && quantity >= stockLeft
  const selected = quantity > 0
  const lowStock = stockLeft !== null && stockLeft <= 3

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-xl px-2 py-2.5 transition-colors',
        selected
          ? 'bg-primary/8 ring-1 ring-primary/15'
          : 'hover:bg-muted/60',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{option.name}</p>
        <p
          className={cn(
            'text-sm tabular-nums',
            option.price > 0 ? 'text-foreground/80' : 'text-muted-foreground',
          )}
        >
          {option.price > 0 ? formatBDT(option.price) : 'Included'}
        </p>
      </div>
      {stockLeft !== null ? (
        <Badge
          variant={lowStock ? 'destructive' : 'secondary'}
          className={cn(!lowStock && 'bg-accent text-accent-foreground')}
        >
          {stockLeft} left
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
            'w-8 text-center text-sm font-semibold tabular-nums',
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
  )
}