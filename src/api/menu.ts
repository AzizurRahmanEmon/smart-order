import type { Menu } from '@/types/menu'

import { apiFetch } from './fetch'

export function fetchMenu(signal?: AbortSignal): Promise<Menu> {
  return apiFetch<Menu>('/api/menu', { signal })
}