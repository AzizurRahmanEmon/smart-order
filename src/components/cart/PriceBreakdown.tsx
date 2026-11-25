import { Receipt } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatBDT } from '@/lib/money'

const MOCK_SUBTOTAL = 125_000
const MOCK_DISCOUNTS = 12_500
const MOCK_VAT = 5_625
const MOCK_PAYABLE = 118_125

const ROWS = [
  { label: 'Subtotal', amount: MOCK_SUBTOTAL },
  { label: 'Discounts', amount: -MOCK_DISCOUNTS },
  { label: 'VAT', amount: MOCK_VAT },
] as const

export function PriceBreakdown() {
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
      <CardContent className="space-y-2.5">
        {ROWS.map((row) => (
          <div key={row.label} className="flex justify-between gap-2 text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span
              className={
                row.amount < 0
                  ? 'font-medium text-primary tabular-nums'
                  : 'tabular-nums'
              }
            >
              {formatBDT(row.amount)}
            </span>
          </div>
        ))}
        <Separator className="bg-border/80" />
        <div className="flex items-end justify-between gap-2 rounded-lg bg-primary/10 px-3 py-2.5">
          <span className="text-sm font-semibold">Payable</span>
          <span className="font-heading text-xl font-semibold tracking-tight text-primary tabular-nums">
            {formatBDT(MOCK_PAYABLE)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}