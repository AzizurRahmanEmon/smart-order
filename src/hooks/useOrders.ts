import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { checkout } from '@/api/checkout'
import { fetchOrders, fetchOrdersExport } from '@/api/orders'
import type { PaymentMethod } from '@/types/api'

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: ({ signal }) => fetchOrders(signal),
  })
}

export function useOrdersExport() {
  return useQuery({
    queryKey: ['orders', 'export'],
    queryFn: ({ signal }) => fetchOrdersExport(signal),
    enabled: false,
  })
}

export function useCheckout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      paymentMethod,
      coupon,
      idempotencyKey,
      signal,
    }: {
      paymentMethod: PaymentMethod
      coupon?: string
      idempotencyKey: string
      signal?: AbortSignal
    }) => checkout(paymentMethod, coupon, idempotencyKey, signal),
    onSuccess: (data) => {
      qc.setQueryData(['cart'], data.cart)
      void qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}