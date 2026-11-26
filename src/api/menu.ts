import type { MenuResponse } from '@/types/menuApi'

import { apiFetch } from './fetch'

export function fetchMenu(signal?: AbortSignal): Promise<MenuResponse> {
  return apiFetch<MenuResponse>('/api/menu', { signal })
}