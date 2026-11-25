import { Receipt } from 'lucide-react'
import { useMemo } from 'react'

import menuFixture from '@/mocks/fixtures/menu.json'
import { priceCart } from '@/engine/pricing'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatBDT } from '@/lib/money'
import { useConfigStore } from '@/store/configStore'
import type { Menu } from '@/types/menu'

const menu = menuFixture as Menu

export function PriceBreakdown() {
  const config = useConfigStore((s) => s.config)
  const couponCode = useConfigStore((s) => s.couponCode)
  const pricingNow = useConfigStore((s) => s.pricingNow)
  const setCouponCode = useConfigStore((s) => s.setCouponCode)

  const hasItems = Object.values(config).some((n) => (n ?? 0) > 0)

  const priced = useMemo(() => {
    if (!hasItems) {
      return null
    }
    return priceCart(menu, [{ config, qty: 1 }], {
      coupon: couponCode,
      now: pricingNow,
    })
  }, [config, couponCode, pricingNow, hasItems])

  const line = priced?.lines[0]

  return (
    <Card
      size="sm"
      className="overflow-hidden border-primary/15 bg-linear-to-b from-primary/6 to-card shadow-sm"
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="size-4 text-primary" aria-hidden />
          Price breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasItems || !priced || !line ? (
          <p className="text-sm text-muted-foreground">
            Build a plate to see live pricing.
          </p>
        ) : (
          <>
            <div className="flex justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Unit (before cart promos)</span>
              <span className="tabular-nums">
                {formatBDT(
                  line.unit +
                    line.extrasDiscount +
                    line.comboDiscount,
                )}
              </span>
            </div>
            {line.extrasDiscount > 0 ? (
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Extras deal</span>
                <span className="font-medium text-primary tabular-nums">
                  −{formatBDT(line.extrasDiscount)}
                </span>
              </div>
            ) : null}
            {line.comboDiscount > 0 ? (
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">Combo discount</span>
                <span className="font-medium text-primary tabular-nums">
                  −{formatBDT(line.comboDiscount)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Line total ×1</span>
              <span className="tabular-nums">{formatBDT(line.lineTotal)}</span>
            </div>
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
                VAT ({menu.vatPercent}%)
              </span>
              <span className="tabular-nums">{formatBDT(priced.vat)}</span>
            </div>
            <Separator className="bg-border/80" />
            <div className="flex items-end justify-between gap-2 rounded-lg bg-primary/10 px-3 py-2.5">
              <span className="text-sm font-semibold">Payable</span>
              <span className="font-heading text-xl font-semibold tracking-tight text-primary tabular-nums">
                {formatBDT(priced.payable)}
              </span>
            </div>
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
          {couponCode.trim() && priced?.couponRejection ? (
            <p className="text-xs text-destructive" role="status">
              {priced.couponRejection === 'expired'
                ? 'Coupon expired for the current server time (after 11:00 Dhaka).'
                : 'Invalid coupon code.'}
            </p>
          ) : null}
          {couponCode.trim() &&
          priced?.chosen === 'coupon' &&
          !priced.couponRejection ? (
            <p className="text-xs text-primary" role="status">
              Coupon applied (−{formatBDT(priced.coupon)}).
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}