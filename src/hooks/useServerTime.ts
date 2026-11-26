import { useEffect, useRef } from 'react'

import { useCart } from '@/hooks/useCart'
import { useMenu } from '@/hooks/useMenu'

const DEFAULT_AHEAD_MS = 90_000

type TimeSync = { serverMs: number; clientMs: number }

export function useServerTimeOffset() {
  const { data: menu } = useMenu()
  const { data: cart } = useCart()

  const serverTimeIso = cart?.serverTime ?? menu?.serverTime
  const syncRef = useRef<TimeSync | null>(null)

  useEffect(() => {
    if (!serverTimeIso) {
      syncRef.current = null
      return
    }
    syncRef.current = {
      serverMs: new Date(serverTimeIso).getTime(),
      clientMs: Date.now(),
    }
  }, [serverTimeIso])

  function serverNow(): Date {
    const sync = syncRef.current
    if (!sync) {
      return new Date(Date.now() + DEFAULT_AHEAD_MS)
    }
    return new Date(sync.serverMs + (Date.now() - sync.clientMs))
  }

  return { serverNow, serverTimeIso }
}