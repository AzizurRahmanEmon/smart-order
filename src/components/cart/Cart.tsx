import { Clock, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ApiError } from '@/api/fetch'
import { useCart, useRemoveCartLine, useUpdateCartLine } from '@/hooks/useCart'
import { useMenu } from '@/hooks/useMenu'
import { useServerTimeOffset } from '@/hooks/useServerTime'
import { summarizeConfig } from '@/lib/cartLabels'
import { useConfigStore } from '@/store/configStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CartSkeleton } from '@/components/skeleton/PageSkeletons'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function formatCountdown(expiresAt: string, nowMs: number): string {
  const ms = new Date(expiresAt).getTime() - nowMs
  if (ms <= 0) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Cart() {
  const { data: menu } = useMenu()
  const { data: cart, isLoading } = useCart()
  const { serverNow } = useServerTimeOffset()
  const loadLineConfig = useConfigStore((s) => s.loadLineConfig)
  const setEditingLineId = useConfigStore((s) => s.setEditingLineId)
  const removeMutation = useRemoveCartLine()
  const updateMutation = useUpdateCartLine()
  const [, tick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => tick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const nowMs = serverNow().getTime()

  if (isLoading) {
    return <CartSkeleton />
  }

  const lines = cart?.lines ?? []

  return (
    <Card size="sm" className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="size-4 text-primary" aria-hidden />
          Cart
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Cart is empty.</p>
        ) : (
          lines.map((line) => {
            const expired = line.expired
            const summary = menu
              ? summarizeConfig(menu, line.config)
              : 'Plate'

            return (
              <div
                key={line.id}
                className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3 ring-1 ring-foreground/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium leading-tight">
                      {expired ? 'Expired reservation' : 'Reserved plate'}
                    </p>
                    <p className="text-xs text-muted-foreground">{summary}</p>
                  </div>
                  <Badge
                    variant={expired ? 'destructive' : 'outline'}
                    className="gap-1 font-mono tabular-nums"
                  >
                    <Clock className="size-3" aria-hidden />
                    {expired
                      ? 'Expired'
                      : formatCountdown(line.expiresAt, nowMs)}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={expired}
                      onClick={() => {
                        loadLineConfig(line.config)
                        setEditingLineId(line.id)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() =>
                        removeMutation.mutate(
                          { lineId: line.id },
                          {
                            onError: (err) =>
                              toast.error(
                                err instanceof ApiError
                                  ? err.body.message
                                  : 'Remove failed',
                              ),
                          },
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-full"
                      disabled={expired || line.qty <= 1}
                      aria-label="Decrease cart quantity"
                      onClick={() =>
                        updateMutation.mutate({
                          lineId: line.id,
                          config: line.config,
                          qty: line.qty - 1,
                        })
                      }
                    >
                      <Minus />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium tabular-nums">
                      {line.qty}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-full"
                      disabled={expired || line.qty >= 3}
                      aria-label="Increase cart quantity"
                      onClick={() =>
                        updateMutation.mutate({
                          lineId: line.id,
                          config: line.config,
                          qty: line.qty + 1,
                        })
                      }
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}