import type { Poisha } from '@/types/menu'

export function formatBDT(poisha: Poisha): string {
  return `৳${(poisha / 100).toFixed(2)}`
}