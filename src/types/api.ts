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
  version: number
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
  currentVersion?: number
  details?: Violation[] | StockViolation[] | unknown
}

export type AddCartResponse = CartResponse & {
  lineId: string
}

export type PricePreviewResponse = PriceCartResult & {
  serverTime: string
}

export type PaymentMethod = 'card' | 'bkash' | 'cash'

export type OrderLineDto = {
  qty: number
  config: Config
}

export type OrderDto = {
  id: string
  createdAt: string
  paymentMethod: PaymentMethod
  couponCode: string | null
  lines: OrderLineDto[]
  totals: PriceCartResult
}

export type CheckoutResponse = {
  order: OrderDto
  cart: CartResponse
}

export type OrdersExport = {
  schemaVersion: number
  currency: string
  orders: OrderDto[]
}