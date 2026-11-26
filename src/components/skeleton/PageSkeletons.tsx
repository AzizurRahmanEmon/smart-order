import { Sparkles } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function SkeletonCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-card py-3 text-sm ring-1 ring-foreground/10',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function AppHeaderTitleSkeleton() {
  return (
    <Skeleton
      className="mt-0.5 h-4 w-36 max-w-full sm:h-6 sm:w-56"
      aria-hidden
    />
  )
}

export function BuilderSkeleton() {
  return (
    <section
      className="space-y-6"
      aria-busy="true"
      aria-label="Loading menu builder"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-5 shadow-lg sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 shrink-0 rounded-md" />
              <Skeleton className="h-8 w-48 sm:w-56" />
            </div>
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-4/5 max-w-sm" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} className="border-l-4 border-l-transparent">
            <div className="space-y-3 px-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: i === 1 ? 3 : i === 4 ? 3 : 3 }).map(
                  (___, row) => (
                    <div
                      key={row}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
                    >
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Skeleton className="size-7 rounded-full" />
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="size-7 rounded-full" />
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 ring-1 ring-foreground/5">
        <div className="flex flex-col gap-3 bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <Skeleton className="h-4 w-full max-w-xs sm:w-64" />
          <Skeleton className="h-11 w-full rounded-lg sm:w-44" />
        </div>
      </div>
    </section>
  )
}

export function PriceBreakdownLinesSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading price">
      {Array.from({ length: 3 }).map((_, i) => (
        <p key={i} className="flex justify-between gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </p>
      ))}
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  )
}

export function PriceBreakdownSkeleton() {
  return (
    <SkeletonCard
      className="border-primary/15 bg-linear-to-b from-primary/6 to-card"
      aria-busy="true"
      aria-label="Loading price"
    >
      <h3 className="sr-only">Price breakdown</h3>
      <div className="space-y-3 px-3 pb-1">
        <Skeleton className="h-4 w-32" />
        <PriceBreakdownLinesSkeleton />
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
    </SkeletonCard>
  )
}

export function CartSkeleton() {
  return (
    <SkeletonCard aria-busy="true" aria-label="Loading cart">
      <h3 className="sr-only">Cart</h3>
      <div className="space-y-3 px-3">
        <Skeleton className="h-4 w-14" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-border/80 bg-muted/30 p-3"
          >
            <div className="flex justify-between gap-2">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <div className="flex justify-between gap-2">
              <div className="flex gap-1.5">
                <Skeleton className="h-8 w-12 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonCard>
  )
}

export function CheckoutSkeleton() {
  return (
    <SkeletonCard
      className="gap-0 pb-0"
      aria-busy="true"
      aria-label="Loading checkout"
    >
      <h3 className="sr-only">Checkout</h3>
      <div className="border-b border-border/50 px-3 pb-3">
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-3 px-3 pt-4 pb-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
      <div className="border-t border-border/50 bg-muted/20 p-3">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="mx-auto mt-2 h-3 w-48" />
      </div>
    </SkeletonCard>
  )
}

export function OrderAsideSkeleton() {
  return (
    <aside
      className="space-y-4 rounded-2xl border border-border/80 bg-card/75 p-3 shadow-lg shadow-primary/5 ring-1 ring-foreground/5 backdrop-blur-md sm:p-4 lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:overflow-y-auto lg:pr-3"
      aria-busy="true"
      aria-label="Loading order summary"
    >
      <div className="mb-4 flex items-center gap-2 px-0.5 pr-1">
        <Sparkles className="size-4 text-primary/40" aria-hidden />
        <span className="text-sm font-semibold tracking-tight text-muted-foreground">
          Your order
        </span>
        <Skeleton className="ml-auto h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-5 pr-1">
        <PriceBreakdownSkeleton />
        <CartSkeleton />
      </div>
      <Skeleton className="my-5 h-px w-full" />
      <CheckoutSkeleton />
    </aside>
  )
}

export function MainPageSkeleton() {
  return (
    <div
      className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(17.5rem,20.5rem)] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]"
      aria-busy="true"
      aria-label="Loading page"
    >
      <BuilderSkeleton />
      <OrderAsideSkeleton />
    </div>
  )
}

export function OrdersListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-busy="true" aria-label="Loading orders">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="overflow-hidden rounded-xl border border-border/80 bg-card/80 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
            {Array.from({ length: 3 }).map((__, row) => (
              <div key={row} className="flex justify-between gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}