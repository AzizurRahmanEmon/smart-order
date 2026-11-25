import type { Config } from '@/types/menu'
import type { AddCartResponse, CartResponse } from '@/types/api'

import { apiFetch } from './fetch'

export function fetchCart(signal?: AbortSignal): Promise<CartResponse> {
  return apiFetch<CartResponse>('/api/cart', { signal })
}

export function addToCart(
  config: Config,
  qty: number,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<AddCartResponse> {
  return apiFetch<AddCartResponse>('/api/cart', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ config, qty }),
  })
}

export function updateCartLine(
  lineId: string,
  config: Config,
  qty: number,
  signal?: AbortSignal,
): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/cart/${lineId}`, {
    method: 'PUT',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, qty }),
  })
}

export function removeCartLine(
  lineId: string,
  signal?: AbortSignal,
): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/cart/${lineId}`, {
    method: 'DELETE',
    signal,
  })
}