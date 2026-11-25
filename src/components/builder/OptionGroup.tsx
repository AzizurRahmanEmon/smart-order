import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { maxAddable } from '@/engine/stock'
import { formatGroupLimitHint } from '@/lib/groupLimits'
import type { Config, Group, IngredientId, Menu, OptionId } from '@/types/menu'

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
  menu: Menu
  group: Group
  groupIndex: number
  config: Config
  reserved: Record<IngredientId, number>
  onQuantityChange: (optionId: OptionId, next: number) => void
}

export function OptionGroup({
  menu,
  group,
  groupIndex,
  config,
  reserved,
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
          const quantity = config[option.id] ?? 0
          const addableMore = maxAddable(menu, reserved, option.id, config)

          return (
            <OptionRow
              key={option.id}
              option={option}
              quantity={quantity}
              addableMore={addableMore}
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