import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { stockLeft } from '@/engine/stock'
import { formatGroupLimitHint } from '@/lib/groupLimits'
import type { Group, Ingredient, OptionId } from '@/types/menu'

import { OptionRow } from './OptionRow'

const ACCENT = [
  'border-l-chart-1',
  'border-l-chart-2',
  'border-l-chart-3',
  'border-l-chart-4',
  'border-l-chart-5',
  'border-l-primary',
] as const

type OptionGroupProps = {
  group: Group
  groupIndex: number
  ingredients: Ingredient[]
  quantities: Record<OptionId, number>
  onQuantityChange: (optionId: OptionId, next: number) => void
}

export function OptionGroup({
  group,
  groupIndex,
  ingredients,
  quantities,
  onQuantityChange,
}: OptionGroupProps) {
  const accent = ACCENT[groupIndex % ACCENT.length]

  return (
    <Card
      size="sm"
      className={cn(
        'border-l-4 bg-card/90 shadow-md transition-shadow hover:shadow-lg',
        accent,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{group.name}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          {formatGroupLimitHint(group)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {group.options.map((option) => {
          const quantity = quantities[option.id] ?? 0
          const remaining = stockLeft(option, ingredients)

          return (
            <OptionRow
              key={option.id}
              option={option}
              quantity={quantity}
              stockLeft={remaining}
              onDecrement={() =>
                onQuantityChange(option.id, Math.max(0, quantity - 1))
              }
              onIncrement={() => onQuantityChange(option.id, quantity + 1)}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}