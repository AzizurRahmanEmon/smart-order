import type { OrderDto, OrdersExport } from '@/types/api'

import { apiFetch } from './fetch'

export function fetchOrders(signal?: AbortSignal): Promise<OrderDto[]> {
  return apiFetch<OrderDto[]>('/api/orders', { signal })
}

export function fetchOrdersExport(signal?: AbortSignal): Promise<OrdersExport> {
  return apiFetch<OrdersExport>('/api/orders/export', { signal })
}