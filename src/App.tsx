import { ChefHat, Sparkles } from 'lucide-react'

import { Toaster } from '@/components/ui/sonner'
import { Builder } from '@/components/builder/Builder'
import { BuilderSessionSync } from '@/components/builder/BuilderSessionSync'
import { Cart } from '@/components/cart/Cart'
import { Checkout } from '@/components/cart/Checkout'
import { PriceBreakdown } from '@/components/cart/PriceBreakdown'
import { SalesChatLazy } from '@/components/chat/SalesChatLazy'
import { OrdersPanel } from '@/components/orders/OrdersPanel'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useMenu } from '@/hooks/useMenu'
import {
  AppHeaderTitleSkeleton,
  MainPageSkeleton,
} from '@/components/skeleton/PageSkeletons'

function App() {
  const { data: menu, isLoading, isError } = useMenu()

  return (
    <div className="min-h-screen">
      <BuilderSessionSync />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/70 shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-card/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25"
            >
              <ChefHat className="size-5" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-primary uppercase">
                Smart Order
              </p>
              {isLoading ? (
                <>
                  <span className="sr-only">Loading product name</span>
                  <AppHeaderTitleSkeleton />
                </>
              ) : (
                <h1 className="font-heading text-base font-semibold tracking-tight sm:text-lg">
                  {isError ? 'Smart Order' : menu?.product.name}
                </h1>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OrdersPanel />
            <SalesChatLazy />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        {isLoading ? (
          <MainPageSkeleton />
        ) : isError || !menu ? (
          <p className="text-sm text-destructive" role="alert">
            Could not load menu. Refresh to try again.
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:grid-cols-[minmax(0,1fr)_24rem]">
            <Builder />
            <aside className="space-y-4 lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-border/80 lg:bg-card/75 lg:p-4 lg:pr-3 lg:shadow-xl lg:shadow-primary/5 lg:ring-1 lg:ring-foreground/5 lg:backdrop-blur-md scrollbar-custom">
              <div className="mb-4 flex items-center gap-2 px-0.5 pr-1">
                <Sparkles className="size-4 text-primary" aria-hidden />
                <span className="text-sm font-semibold tracking-tight">
                  Your order
                </span>
                <Badge variant="secondary" className="ml-auto text-[0.65rem]">
                  Live preview
                </Badge>
              </div>
              <div className="space-y-5 pr-1">
                <PriceBreakdown />
                <Cart />
              </div>
              <Separator className="my-5 bg-border/60" />
              <Checkout />
            </aside>
          </div>
        )}
      </main>
      <Toaster richColors closeButton position="top-center" />
    </div>
  )
}

export default App