import { Coffee, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { ApiError } from '@/api/fetch'
import { checkAdd } from '@/engine/stock'
import { validate } from '@/engine/validate'
import { useAddToCart, useCart, useUpdateCartLine } from '@/hooks/useCart'
import { useMenu } from '@/hooks/useMenu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatBDT } from '@/lib/money'
import {
  EXPIRED_RESERVATION_BANNER,
  useConfigStore,
} from '@/store/configStore'
import type { OptionId } from '@/types/menu'

import { Separator } from '@/components/ui/separator'

import { OptionGroup } from './OptionGroup'
import { ViolationList, type DisplayViolation } from './ViolationList'

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
  const { data: menu, isLoading } = useMenu()
  const { data: cart } = useCart()
  const config = useConfigStore((s) => s.config)
  const editingLineId = useConfigStore((s) => s.editingLineId)
  const expiredEditBanner = useConfigStore((s) => s.expiredEditBanner)
  const setQuantity = useConfigStore((s) => s.setQuantity)
  const resetBuilderConfig = useConfigStore((s) => s.resetBuilderConfig)
  const setEditingLineId = useConfigStore((s) => s.setEditingLineId)
  const setExpiredEditBanner = useConfigStore((s) => s.setExpiredEditBanner)

  const addMutation = useAddToCart()
  const updateMutation = useUpdateCartLine()
  const idempotencyRef = useRef<string | null>(null)

  const reserved = cart?.reserved ?? {}

  useEffect(() => {
    if (!editingLineId || !cart) return
    const line = cart.lines.find((l) => l.id === editingLineId)
    if (line?.expired) {
      setEditingLineId(null)
      setExpiredEditBanner(true)
    }
  }, [cart, editingLineId, setEditingLineId, setExpiredEditBanner])

  const onQuantityChange = useMemo(
    () => (optionId: OptionId, next: number) => {
      setQuantity(optionId, next)
    },
    [setQuantity],
  )

  const violations = useMemo(() => {
    if (!menu) return []
    const rules = validate(menu, config)
    const hasLineItems = Object.values(config).some((n) => (n ?? 0) > 0)
    const stock = hasLineItems ? checkAdd(menu, reserved, config, 1) : []
    return mergeViolations(rules, stock)
  }, [config, menu, reserved])

  const selectedCount = Object.values(config).reduce(
    (sum, n) => sum + (n ?? 0),
    0,
  )

  const blocked = violations.length > 0
  const isEditing = editingLineId !== null

  const handlePrimaryAction = () => {
    if (!menu || blocked || selectedCount === 0) return

    if (isEditing && editingLineId) {
      updateMutation.mutate(
        { lineId: editingLineId, config, qty: 1 },
        {
          onSuccess: () => {
            toast.success('Cart updated')
            resetBuilderConfig()
            setEditingLineId(null)
          },
          onError: (err) => {
            if (err instanceof ApiError && err.body.code === 'cart_conflict') {
              return
            }
            const message =
              err instanceof ApiError ? err.body.message : 'Update failed'
            toast.error(message)
          },
        },
      )
      return
    }

    if (!idempotencyRef.current) {
      idempotencyRef.current = crypto.randomUUID()
    }
    const key = idempotencyRef.current

    addMutation.mutate(
      { config, qty: 1, idempotencyKey: key },
      {
        onSuccess: () => {
          toast.success('Added to cart')
          setExpiredEditBanner(false)
          resetBuilderConfig()
        },
        onError: (err) => {
          if (err instanceof ApiError && err.body.code === 'cart_conflict') {
            return
          }
          const message =
            err instanceof ApiError ? err.body.message : 'Could not add to cart'
          toast.error(message)
        },
        onSettled: () => {
          idempotencyRef.current = null
        },
      },
    )
  }

  if (isLoading || !menu) {
    return (
      <p className="text-sm text-muted-foreground">Loading builder…</p>
    )
  }

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
                {isEditing ? 'Edit plate' : 'Build your plate'}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {isEditing
                ? 'Update options and save — reservation time stays the same.'
                : 'Pick options in each section. Rule and stock issues must be cleared before adding to cart.'}
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

      {expiredEditBanner ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-foreground"
        >
          {EXPIRED_RESERVATION_BANNER}
        </div>
      ) : null}

      {isEditing ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetBuilderConfig()
              setEditingLineId(null)
            }}
          >
            Cancel edit
          </Button>
        </div>
      ) : null}

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
                ? isEditing
                  ? 'Save to apply changes to this cart line.'
                  : 'Ready to add this plate to cart.'
                : 'Configure your plate above.'}
          </p>
          <Button
            type="button"
            size="lg"
            className="w-full shrink-0 sm:w-auto sm:min-w-44"
            disabled={
              blocked ||
              selectedCount === 0 ||
              addMutation.isPending ||
              updateMutation.isPending
            }
            onClick={handlePrimaryAction}
          >
            <ShoppingBag data-icon="inline-start" />
            {isEditing ? 'Save changes' : 'Add to Cart'}
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