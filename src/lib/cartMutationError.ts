import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError } from '@/api/fetch'

export const CART_CONFLICT_TOAST =
  'Your cart changed in another tab — reloaded'

export function handleCartApiError(
  err: unknown,
  queryClient: QueryClient,
): void {
  if (!(err instanceof ApiError)) {
    toast.error(err instanceof Error ? err.message : 'Request failed')
    return
  }
  if (err.body.code === 'cart_conflict') {
    toast.error(CART_CONFLICT_TOAST)
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    return
  }
  toast.error(err.body.message)
}