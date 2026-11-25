import { validate } from '@/engine/validate'
import type { CartLineDto } from '@/types/api'
import type { Menu } from '@/types/menu'

export function cartCheckoutBlocked(
  menu: Menu | undefined,
  lines: CartLineDto[],
): string | null {
  if (lines.length === 0) return 'Cart is empty'
  if (lines.some((l) => l.expired)) return 'Remove expired reservations first'
  if (!menu) return 'Loading menu…'
  for (const line of lines) {
    const violations = validate(menu, line.config)
    if (violations.length > 0) return 'Fix invalid cart items before paying'
  }
  return null
}