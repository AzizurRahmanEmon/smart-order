import { Coffee, ShoppingBag } from 'lucide-react'
import { useMemo } from 'react'

import menuFixture from '@/mocks/fixtures/menu.json'
import { checkAdd } from '@/engine/stock'
import { validate } from '@/engine/validate'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatBDT } from '@/lib/money'
import { useConfigStore } from '@/store/configStore'
import type { Menu, OptionId } from '@/types/menu'

import { Separator } from '@/components/ui/separator'

import { OptionGroup } from './OptionGroup'
import { ViolationList, type DisplayViolation } from './ViolationList'

const menu = menuFixture as Menu

function mergeViolations(
  ruleViolations: ReturnType<typeof validate>,
  stockViolations: ReturnType<typeof checkAdd>,
): DisplayViolation[] {
  const items: DisplayViolation[] = ruleViolations.map((v) => ({
    code: v.code,
    message: v.message,
    key: `rule-${v.code}-${v.groupId ?? ''}-${v.optionId ?? ''}-${v.ruleId ?? ''}-${v.message}`,
  }))

  const stockSeen = new Set<string>()
  for (const s of stockViolations) {
    if (stockSeen.has(s.message)) continue
    stockSeen.add(s.message)
    items.push({
      code: s.code,
      message: s.message,
      key: `stock-${s.ingredientId}-${s.message}`,
    })
  }

  return items
}

export function Builder() {
  const config = useConfigStore((s) => s.config)
  const reserved = useConfigStore((s) => s.reserved)
  const setQuantity = useConfigStore((s) => s.setQuantity)

  const onQuantityChange = useMemo(
    () => (optionId: OptionId, next: number) => {
      setQuantity(optionId, next)
    },
    [setQuantity],
  )

  const violations = useMemo(() => {
    const rules = validate(menu, config)
    const hasLineItems = Object.values(config).some((n) => (n ?? 0) > 0)
    const stock = hasLineItems ? checkAdd(menu, reserved, config, 1) : []
    return mergeViolations(rules, stock)
  }, [config, reserved])

  const selectedCount = Object.values(config).reduce(
    (sum, n) => sum + (n ?? 0),
    0,
  )

  const blocked = violations.length > 0

  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-5 shadow-lg shadow-primary/5 ring-1 ring-foreground/5 backdrop-blur-sm sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coffee className="size-5 text-primary" aria-hidden />
              <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Build your plate
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Pick options in each section. Rule and stock issues must be
              cleared before adding to cart.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary"
          >
            Base {formatBDT(menu.product.basePrice)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {menu.groups.map((group, index) => (
          <OptionGroup
            key={group.id}
            menu={menu}
            group={group}
            groupIndex={index}
            config={config}
            reserved={reserved}
            onQuantityChange={onQuantityChange}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-sm ring-1 ring-foreground/5">
        {blocked ? (
          <div className="p-4 sm:p-5">
            <ViolationList violations={violations} />
          </div>
        ) : null}
        <Separator />
        <div className="flex flex-col gap-3 bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm text-muted-foreground">
            {blocked
              ? 'Resolve all issues above to enable checkout.'
              : selectedCount > 0
                ? 'Ready to add this plate to cart.'
                : 'Configure your plate above.'}
          </p>
          <Button
            type="button"
            size="lg"
            className="w-full shrink-0 sm:w-auto sm:min-w-44"
            disabled={blocked || selectedCount === 0}
          >
            <ShoppingBag data-icon="inline-start" />
            Add to Cart
            {selectedCount > 0 ? (
              <Badge variant="secondary" className="ml-1 tabular-nums">
                {selectedCount}
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>
    </section>
  )
}