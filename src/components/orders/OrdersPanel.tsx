import { Download, Package } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { fetchOrdersExport } from '@/api/orders'
import { useOrders } from '@/hooks/useOrders'
import { formatBDT } from '@/lib/money'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

function OrderBreakdown({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <>
      <dt
        className={cn(
          emphasis ? 'font-semibold text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          'text-right font-mono tabular-nums',
          emphasis && 'font-semibold text-foreground',
        )}
      >
        {value}
      </dd>
    </>
  )
}

export function OrdersPanel() {
  const { data: orders, isLoading } = useOrders()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const payload = await fetchOrdersExport()
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'orders.json'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Could not download orders')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Package className="size-4" aria-hidden />
          Orders
        </Button>
      </SheetTrigger>
      <SheetContent
        showCloseButton
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-5 pt-5 pr-14 pb-4">
          <SheetTitle>Orders</SheetTitle>
          <SheetDescription className="text-left">
            Stored on the mock server (including seed orders).
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-5 py-4 pr-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading orders…</p>
            ) : !orders?.length ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="overflow-hidden rounded-xl border border-border/80 bg-card/80 p-4 text-sm shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold tracking-tight">
                          {order.id}
                        </p>
                        <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString('en-BD', {
                            timeZone: 'Asia/Dhaka',
                          })}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[0.65rem] capitalize"
                      >
                        {order.paymentMethod}
                      </Badge>
                    </div>

                    <dl className="mt-3 grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs">
                      <OrderBreakdown
                        label="Subtotal"
                        value={formatBDT(order.totals.subtotal)}
                      />
                      {order.totals.cartDiscount > 0 ? (
                        <OrderBreakdown
                          label="Discount"
                          value={`−${formatBDT(order.totals.cartDiscount)}`}
                        />
                      ) : null}
                      <OrderBreakdown
                        label="VAT"
                        value={formatBDT(order.totals.vat)}
                      />
                      <OrderBreakdown
                        label="Payable"
                        value={formatBDT(order.totals.payable)}
                        emphasis
                      />
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="mt-0 shrink-0 border-t border-border/60 px-5 py-4">
          <Button
            type="button"
            className="w-full gap-2"
            disabled={downloading || isLoading}
            onClick={() => void handleDownload()}
          >
            <Download className="size-4" aria-hidden />
            Download orders.json
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}