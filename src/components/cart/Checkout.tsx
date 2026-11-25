import { Banknote, CreditCard, Smartphone } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { ApiError } from '@/api/fetch'
import { useCart } from '@/hooks/useCart'
import { useCheckout } from '@/hooks/useOrders'
import { useMenu } from '@/hooks/useMenu'
import { cartCheckoutBlocked } from '@/lib/cartCheckout'
import { useConfigStore } from '@/store/configStore'
import type { PaymentMethod } from '@/types/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const PAYMENT_TABS = [
  { value: 'card' as const, label: 'Card', icon: CreditCard },
  { value: 'bkash' as const, label: 'bKash', icon: Smartphone },
  { value: 'cash' as const, label: 'Cash', icon: Banknote },
]

export function Checkout() {
  const { data: menu } = useMenu()
  const { data: cart, isLoading: cartLoading } = useCart()
  const couponCode = useConfigStore((s) => s.couponCode)
  const checkoutMutation = useCheckout()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const idempotencyRef = useRef<string | null>(null)

  const lines = cart?.lines ?? []
  const blockReason = useMemo(
    () => cartCheckoutBlocked(menu, lines),
    [menu, lines],
  )

  const payDisabled =
    cartLoading ||
    Boolean(blockReason) ||
    checkoutMutation.isPending

  const handlePay = () => {
    if (payDisabled) return
    if (!idempotencyRef.current) {
      idempotencyRef.current = crypto.randomUUID()
    }
    const key = idempotencyRef.current

    checkoutMutation.mutate(
      {
        paymentMethod,
        coupon: couponCode || undefined,
        idempotencyKey: key,
      },
      {
        onSuccess: (data) => {
          toast.success(`Order ${data.order.id} placed`)
          idempotencyRef.current = null
        },
        onError: (err) => {
          if (err instanceof ApiError && err.body.code === 'cart_conflict') {
            idempotencyRef.current = null
            return
          }
          const message =
            err instanceof ApiError ? err.body.message : 'Payment failed'
          toast.error(message)
          idempotencyRef.current = null
        },
      },
    )
  }

  return (
    <Card size="sm" className="gap-0 overflow-hidden pb-0 shadow-sm">
      <CardHeader className="border-b border-border/50 pb-3">
        <CardTitle className="text-base">Checkout</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        <Tabs
          value={paymentMethod}
          onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
          className="gap-0"
        >
          <div className="px-4 pt-4">
            <TabsList className="h-10 w-full gap-0.5 p-1">
              {PAYMENT_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 gap-1.5 px-2 text-xs sm:text-sm"
                >
                  <tab.icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {PAYMENT_TABS.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              className="mt-0 px-4 pt-3 pb-4"
            >
              <p className="rounded-xl border border-dashed border-border/80 bg-muted/35 px-4 py-3.5 text-center text-sm leading-relaxed text-muted-foreground">
                Mock {tab.label} payment — no card details collected.
              </p>
            </TabsContent>
          ))}
        </Tabs>
        <Separator />
        <div className="bg-muted/20 p-4">
          <Button
            type="button"
            size="lg"
            className="h-11 w-full"
            disabled={payDisabled}
            onClick={handlePay}
          >
            {checkoutMutation.isPending ? 'Processing…' : 'Pay now'}
          </Button>
          <p className="mt-2 text-center text-[0.65rem] text-muted-foreground">
            {blockReason ?? 'Places one order for all active cart lines.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}