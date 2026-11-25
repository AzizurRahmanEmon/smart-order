import type { Config } from '@/types/menu'
import type { AddCartResponse, CartResponse } from '@/types/api'

import { apiFetch } from './fetch'

export function fetchCart(signal?: AbortSignal): Promise<CartResponse> {
  return apiFetch<CartResponse>('/api/cart', { signal })
}

function versionHeaders(cartVersion: number): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'If-Match': String(cartVersion),
  }
}

export function addToCart(
  config: Config,
  qty: number,
  idempotencyKey: string,
  cartVersion: number,
  signal?: AbortSignal,
): Promise<AddCartResponse> {
  return apiFetch<AddCartResponse>('/api/cart', {
    method: 'POST',
    signal,
    headers: {
      ...versionHeaders(cartVersion),
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ config, qty }),
  })
}

export function updateCartLine(
  lineId: string,
  config: Config,
  qty: number,
  cartVersion: number,
  signal?: AbortSignal,
): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/cart/${lineId}`, {
    method: 'PUT',
    signal,
    headers: versionHeaders(cartVersion),
    body: JSON.stringify({ config, qty }),
  })
}

export function removeCartLine(
  lineId: string,
  cartVersion: number,
  signal?: AbortSignal,
): Promise<CartResponse> {
  return apiFetch<CartResponse>(`/api/cart/${lineId}`, {
    method: 'DELETE',
    signal,
    headers: { 'If-Match': String(cartVersion) },
  })
}