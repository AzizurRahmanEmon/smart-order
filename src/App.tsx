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
    <div className="min-h-screen overflow-x-clip">
      <BuilderSessionSync />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/70 pt-[env(safe-area-inset-top,0px)] shadow-sm backdrop-blur-xl supports-backdrop-filter:bg-card/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 sm:size-10"
            >
              <ChefHat className="size-4 sm:size-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.6rem] font-semibold tracking-[0.18em] text-primary uppercase sm:text-[0.65rem] sm:tracking-[0.2em]">
                Smart Order
              </p>
              {isLoading ? (
                <>
                  <span className="sr-only">Loading product name</span>
                  <AppHeaderTitleSkeleton />
                </>
              ) : (
                <h1 className="truncate font-heading text-sm font-semibold tracking-tight sm:text-base md:text-lg">
                  {isError ? 'Smart Order' : menu?.product.name}
                </h1>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <OrdersPanel />
            <SalesChatLazy />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
        {isLoading ? (
          <MainPageSkeleton />
        ) : isError || !menu ? (
          <p className="text-sm text-destructive" role="alert">
            Could not load menu. Refresh to try again.
          </p>
        ) : (
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,20.5rem)] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
            <Builder />
            <aside className="space-y-4 rounded-2xl border border-border/80 bg-card/75 p-3 shadow-lg shadow-primary/5 ring-1 ring-foreground/5 backdrop-blur-md sm:p-4 lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:overflow-y-auto lg:pr-3 scrollbar-custom">
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
      <Toaster
        richColors
        closeButton
        position="top-right"
        offset={{ top: 76, right: 16 }}
        mobileOffset={{ top: 60, right: 8 }}
        toastOptions={{
          classNames: {
            closeButton:
              'border-border/60 bg-background/80 text-muted-foreground hover:text-foreground',
          },
        }}
      />
    </div>
  )
}

export default App
