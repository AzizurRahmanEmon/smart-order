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
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Orders</SheetTitle>
          <SheetDescription>
            Stored on the mock server (including seed orders).
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1 py-2 pr-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading orders…</p>
          ) : !orders?.length ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-xl border border-border/80 bg-muted/30 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold">
                      {order.id}
                    </span>
                    <Badge variant="secondary" className="text-[0.65rem]">
                      {order.paymentMethod}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString('en-BD', {
                      timeZone: 'Asia/Dhaka',
                    })}
                  </p>
                  <dl className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Subtotal</dt>
                      <dd className="tabular-nums">
                        {formatBDT(order.totals.subtotal)}
                      </dd>
                    </div>
                    {order.totals.cartDiscount > 0 ? (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Discount</dt>
                        <dd className="tabular-nums">
                          −{formatBDT(order.totals.cartDiscount)}
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">VAT</dt>
                      <dd className="tabular-nums">
                        {formatBDT(order.totals.vat)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 font-semibold">
                      <dt>Payable</dt>
                      <dd className="tabular-nums">
                        {formatBDT(order.totals.payable)}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <SheetFooter className="border-t border-border/60 pt-4">
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