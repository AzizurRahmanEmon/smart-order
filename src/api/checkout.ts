import type { CheckoutResponse, PaymentMethod } from '@/types/api'

import { apiFetch } from './fetch'

export function checkout(
  paymentMethod: PaymentMethod,
  coupon: string | undefined,
  idempotencyKey: string,
  cartVersion: number,
  signal?: AbortSignal,
): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>('/api/checkout', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'If-Match': String(cartVersion),
    },
    body: JSON.stringify({
      paymentMethod,
      coupon: coupon?.trim() ? coupon : undefined,
    }),
  })
}