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
        className="border-primary/25 bg-primary/5 text-foreground shadow-sm hover:bg-primary/10"
        onClick={() => setArmed(true)}
      >
        <MessageCircle data-icon="inline-start" className="text-primary" />
        Sales chat
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