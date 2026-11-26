import { Receipt } from 'lucide-react'
import { useMemo } from 'react'

import { priceCart } from '@/engine/pricing'
import { useCart } from '@/hooks/useCart'
import { useMenu } from '@/hooks/useMenu'
import { usePricePreview } from '@/hooks/usePricePreview'
import { useServerTimeOffset } from '@/hooks/useServerTime'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { formatBDT } from '@/lib/money'
import { useConfigStore } from '@/store/configStore'
import { PriceBreakdownLinesSkeleton } from '@/components/skeleton/PageSkeletons'

import { PayableRow } from './PayableAmount'

export function PriceBreakdown() {
  const { data: menu } = useMenu()
  const { data: cart } = useCart()
  const config = useConfigStore((s) => s.config)
  const couponCode = useConfigStore((s) => s.couponCode)
  const setCouponCode = useConfigStore((s) => s.setCouponCode)
  const { serverNow } = useServerTimeOffset()

  const cartLines = useMemo(
    () => cart?.lines.filter((l) => !l.expired) ?? [],
    [cart],
  )
  const hasCart = cartLines.length > 0
  const hasBuilderItems = Object.values(config).some((n) => (n ?? 0) > 0)

  const cartPriced = useMemo(() => {
    if (!menu || !cart || cartLines.length === 0) return null
    const now = cart.serverTime
      ? new Date(cart.serverTime)
      : serverNow()
    return priceCart(
      menu,
      cartLines.map((l) => ({ config: l.config, qty: l.qty })),
      { coupon: couponCode, now },
    )
  }, [menu, cart, cartLines, couponCode, serverNow])

  const preview = usePricePreview(
    config,
    couponCode,
    !hasCart && hasBuilderItems,
  )

  const priced = hasCart ? cartPriced : preview.data
  const isStale =
    !hasCart &&
    preview.isFetching &&
    preview.fetchStatus === 'fetching' &&
    preview.data !== undefined

  const couponRejection = hasCart
    ? cartPriced?.couponRejection
    : preview.data?.couponRejection

  const showPreviewSource = !hasCart && hasBuilderItems
  const previewLoading =
    showPreviewSource &&
    preview.isFetching &&
    preview.data === undefined &&
    !preview.isError
  const cartPriceLoading = hasCart && !cartPriced

  return (
    <Card
      size="sm"
      className="overflow-hidden border-primary/15 bg-linear-to-b from-primary/6 to-card shadow-sm"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="size-4 text-primary" aria-hidden />
          Price breakdown
          {isStale ? (
            <span className="ml-auto text-[0.65rem] font-normal text-muted-foreground">
              Updating…
            </span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {previewLoading || cartPriceLoading ? (
          <PriceBreakdownLinesSkeleton />
        ) : !priced ? (
          <p className="text-sm text-muted-foreground">
            {showPreviewSource
              ? preview.isError
                ? 'Price preview unavailable.'
                : 'Calculating…'
              : 'Build a plate or add to cart to see pricing.'}
          </p>
        ) : (
          <>
            {showPreviewSource && preview.isError ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-destructive" role="alert">
                  Price fetch failed.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => preview.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatBDT(priced.subtotal)}</span>
            </div>
            {priced.cartDiscount > 0 ? (
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">
                  Cart discount
                  {priced.chosen === 'coupon' ? ' (coupon)' : ' (auto)'}
                </span>
                <span className="font-medium text-primary tabular-nums">
                  −{formatBDT(priced.cartDiscount)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                VAT ({menu?.vatPercent ?? 0}%)
              </span>
              <span className="tabular-nums">{formatBDT(priced.vat)}</span>
            </div>
            <Separator className="bg-border/80" />
            <PayableRow payable={priced.payable} dimmed={isStale} />
          </>
        )}

        <div className="space-y-1.5 pt-1">
          <label htmlFor="coupon-code" className="text-xs font-medium">
            Coupon code
          </label>
          <Input
            id="coupon-code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="MORNING15"
            autoComplete="off"
            className="h-9"
          />
          {couponCode.trim() && couponRejection ? (
            <p className="text-xs text-destructive" role="status">
              {couponRejection === 'expired'
                ? 'Coupon expired for the current server time (after 11:00 Dhaka).'
                : 'Invalid coupon code.'}
            </p>
          ) : null}
          {couponCode.trim() &&
          priced?.chosen === 'coupon' &&
          !couponRejection ? (
            <p className="text-xs text-primary" role="status">
              Coupon applied (−{formatBDT(priced.coupon)}).
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}