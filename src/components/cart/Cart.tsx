import { Clock, Minus, Plus, ShoppingCart } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { MOCK_CART_LINES } from './mockCart'

export function Cart() {
  return (
    <Card size="sm" className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="size-4 text-primary" aria-hidden />
          Cart
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {MOCK_CART_LINES.map((line) => (
          <div
            key={line.id}
            className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3 ring-1 ring-foreground/5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium leading-tight">{line.title}</p>
                <p className="text-xs text-muted-foreground">{line.summary}</p>
              </div>
              <Badge
                variant="outline"
                className="gap-1 border-primary/25 bg-primary/5 font-mono text-primary tabular-nums"
              >
                <Clock className="size-3" aria-hidden />
                {line.reservationCountdown}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1.5">
                <Button type="button" variant="outline" size="sm" disabled>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  disabled
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
                  disabled
                  aria-label="Decrease cart quantity"
                >
                  <Minus />
                </Button>
                <span className="w-6 text-center text-sm font-medium tabular-nums">
                  {line.quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full"
                  disabled
                  aria-label="Increase cart quantity"
                >
                  <Plus />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}