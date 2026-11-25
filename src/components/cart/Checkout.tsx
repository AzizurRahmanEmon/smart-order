import { Banknote, CreditCard, Smartphone } from 'lucide-react'

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
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'bkash', label: 'bKash', icon: Smartphone },
  { value: 'cash', label: 'Cash', icon: Banknote },
] as const

export function Checkout() {
  return (
    <Card size="sm" className="gap-0 overflow-hidden pb-0 shadow-sm">
      <CardHeader className="border-b border-border/50 pb-3">
        <CardTitle className="text-base">Checkout</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        <Tabs defaultValue="card" className="gap-0">
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
                Pay with {tab.label} — placeholder gateway
              </p>
            </TabsContent>
          ))}
        </Tabs>
        <Separator />
        <div className="bg-muted/20 p-4">
          <Button type="button" size="lg" className="h-11 w-full" disabled>
            Pay now
          </Button>
          <p className="mt-2 text-center text-[0.65rem] text-muted-foreground">
            Disabled until cart validation passes
          </p>
        </div>
      </CardContent>
    </Card>
  )
}