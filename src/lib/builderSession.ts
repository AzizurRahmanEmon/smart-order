import type { CartResponse } from '@/types/api'
import type { Config, Menu } from '@/types/menu'

export const BUILDER_SESSION_STORAGE_KEY = 'smart-order-builder-v1'

export function sanitizeConfigForMenu(menu: Menu, config: Config): Config {
  const next: Config = {}
  for (const group of menu.groups) {
    for (const option of group.options) {
      const prev = config[option.id] ?? 0
      next[option.id] = Math.max(0, prev)
    }
  }
  return next
}

export function reconcileEditingAfterCartLoad(
  editingLineId: string | null,
  cart: CartResponse | undefined,
): {
  editingLineId: string | null
  showExpiredBanner: boolean
} {
  if (!editingLineId) {
    return { editingLineId: null, showExpiredBanner: false }
  }
  if (!cart) {
    return { editingLineId, showExpiredBanner: false }
  }
  const line = cart.lines.find((l) => l.id === editingLineId)
  if (!line) {
    return { editingLineId: null, showExpiredBanner: false }
  }
  if (line.expired) {
    return { editingLineId: null, showExpiredBanner: true }
  }
  return { editingLineId, showExpiredBanner: false }
}