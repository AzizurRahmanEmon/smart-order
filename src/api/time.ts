import type { ServerTimeResponse } from '@/types/api'

import { apiFetch } from './fetch'

export function fetchServerTime(signal?: AbortSignal): Promise<ServerTimeResponse> {
  return apiFetch<ServerTimeResponse>('/api/time', { signal })
}