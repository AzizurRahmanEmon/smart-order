import type { Config } from '@/types/menu'
import type { PricePreviewResponse } from '@/types/api'

import { apiFetch } from './fetch'

export function fetchPrice(
  config: Config,
  coupon: string | undefined,
  qty: number,
  signal?: AbortSignal,
): Promise<PricePreviewResponse> {
  return apiFetch<PricePreviewResponse>('/api/price', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, coupon, qty }),
  })
}