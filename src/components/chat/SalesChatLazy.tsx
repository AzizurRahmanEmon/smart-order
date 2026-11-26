import { MessageCircle } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const SalesChatSheet = lazy(() =>
  import('@/components/chat/SalesChatSheet').then((m) => ({
    default: m.SalesChatSheet,
  })),
)

export function SalesChatLazy() {
  const [armed, setArmed] = useState(false)

  if (!armed) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="size-8 border-primary/25 bg-primary/5 px-0 text-foreground shadow-sm hover:bg-primary/10 sm:h-7 sm:w-auto sm:gap-1.5 sm:px-2.5"
        aria-label="Sales chat"
        onClick={() => setArmed(true)}
      >
        <MessageCircle className="size-4 text-primary" aria-hidden />
        <span className="hidden sm:inline">Sales chat</span>
      </Button>
    )
  }

  return (
    <Suspense
      fallback={
        <Button type="button" variant="outline" size="sm" disabled>
          <Skeleton className="h-4 w-16 rounded-sm" />
        </Button>
      }
    >
      <SalesChatSheet defaultOpen />
    </Suspense>
  )
}