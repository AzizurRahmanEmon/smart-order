import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { MOCK_SERVER_STORAGE_KEY } from '@/lib/mockServerStorage'

/** Refetch cart when another tab mutates MSW localStorage or user returns to the tab. */
export function useCartSync(): void {
  const qc = useQueryClient()

  useEffect(() => {
    const refetchCart = () => {
      void qc.invalidateQueries({ queryKey: ['cart'] })
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === MOCK_SERVER_STORAGE_KEY) refetchCart()
    }

    const onFocus = () => refetchCart()

    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [qc])
}