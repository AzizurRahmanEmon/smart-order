import type { Config, IngredientId } from '@/types/menu'

import type { PriceCartResult } from '@/engine/pricing'
import type { StockViolation } from '@/engine/stock'
import type { Violation } from '@/engine/validate'

export type CartLineDto = {
  id: string
  config: Config
  qty: number
  reservedAt: string
  expiresAt: string
  expired: boolean
}

export type CartResponse = {
  serverTime: string
  lines: CartLineDto[]
  reserved: Record<IngredientId, number>
  stock: Record<IngredientId, number>
}

export type ServerTimeResponse = {
  serverTime: string
}

export type ApiErrorBody = {
  code: string
  message: string
  details?: Violation[] | StockViolation[] | unknown
}

export type AddCartResponse = CartResponse & {
  lineId: string
}

export type PricePreviewResponse = PriceCartResult & {
  serverTime: string
}