import { useMemo } from 'react'

import { useCart } from '@/hooks/useCart'
import { useMenu } from '@/hooks/useMenu'

const DEFAULT_AHEAD_MS = 90_000

export function useServerTimeOffset() {
  const { data: menu } = useMenu()
  const { data: cart } = useCart()

  const serverTimeIso = cart?.serverTime ?? menu?.serverTime

  const offsetMs = useMemo(() => {
    if (!serverTimeIso) return DEFAULT_AHEAD_MS
    return new Date(serverTimeIso).getTime() - Date.now()
  }, [serverTimeIso])

  function serverNow(): Date {
    return new Date(Date.now() + offsetMs)
  }

  return { serverNow, serverTimeIso, offsetMs }
}