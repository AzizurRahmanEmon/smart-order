import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addToCart as addToCartApi,
  fetchCart,
  removeCartLine as removeCartLineApi,
  updateCartLine as updateCartLineApi,
} from '@/api/cart'
import type { Config } from '@/types/menu'

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: ({ signal }) => fetchCart(signal),
    refetchInterval: 5_000,
  })
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      config,
      qty,
      idempotencyKey,
      signal,
    }: {
      config: Config
      qty: number
      idempotencyKey: string
      signal?: AbortSignal
    }) => addToCartApi(config, qty, idempotencyKey, signal),
    onSuccess: (data) => {
      qc.setQueryData(['cart'], data)
    },
  })
}

export function useUpdateCartLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      lineId,
      config,
      qty,
      signal,
    }: {
      lineId: string
      config: Config
      qty: number
      signal?: AbortSignal
    }) => updateCartLineApi(lineId, config, qty, signal),
    onSuccess: (data) => {
      qc.setQueryData(['cart'], data)
    },
  })
}

export function useRemoveCartLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lineId, signal }: { lineId: string; signal?: AbortSignal }) =>
      removeCartLineApi(lineId, signal),
    onSuccess: (data) => {
      qc.setQueryData(['cart'], data)
    },
  })
}