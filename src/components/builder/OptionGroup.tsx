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

import type { GroupViolation } from '@/lib/groupViolations'
import { optionViolations } from '@/lib/groupViolations'
import type { Violation } from '@/engine/validate'

import { GroupViolationAlerts } from './GroupViolationAlerts'
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
  groupViolations: GroupViolation[]
  ruleViolations: Violation[]
  onQuantityChange: (optionId: OptionId, next: number) => void
}

export function OptionGroup({
  menu,
  group,
  groupIndex,
  config,
  reserved,
  groupViolations,
  ruleViolations,
  onQuantityChange,
}: OptionGroupProps) {
  const accent = ACCENT[groupIndex % ACCENT.length]
  const hasGroupIssues = groupViolations.length > 0

  return (
    <Card
      size="sm"
      className={cn(
        'border-l-4 bg-card/90 shadow-md transition-shadow hover:shadow-lg',
        accent,
        hasGroupIssues && 'ring-1 ring-destructive/25',
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{group.name}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          {formatGroupLimitHint(group)}
        </CardDescription>
        {hasGroupIssues ? (
          <GroupViolationAlerts
            violations={groupViolations}
            className="mt-2"
          />
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {group.options.map((option) => {
          const quantity = config[option.id] ?? 0
          const addableMore = maxAddable(menu, reserved, option.id, config)
          const rowViolations = optionViolations(option.id, ruleViolations)

          return (
            <OptionRow
              key={option.id}
              option={option}
              quantity={quantity}
              addableMore={addableMore}
              optionViolations={rowViolations}
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