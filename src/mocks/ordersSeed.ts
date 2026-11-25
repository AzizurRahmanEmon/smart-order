import { priceCart } from '@/engine/pricing'
import type { PriceCartResult } from '@/engine/pricing'
import type { Config, Menu } from '@/types/menu'

import seedFixture from './fixtures/orders.seed.json'

export type PaymentMethod = 'card' | 'bkash' | 'cash'

export type StoredOrder = {
  id: string
  createdAt: string
  paymentMethod: PaymentMethod
  couponCode: string | null
  lines: { qty: number; config: Config }[]
  totals: PriceCartResult
}

type SeedLine = { qty: number; options: Record<string, number> }

type SeedOrder = {
  id: string
  createdAt: string
  paymentMethod: PaymentMethod
  couponCode: string | null
  lines: SeedLine[]
}

function optionsToConfig(menu: Menu, options: Record<string, number>): Config {
  const config: Config = {}
  for (const group of menu.groups) {
    for (const option of group.options) {
      config[option.id] = options[option.id] ?? 0
    }
  }
  return config
}

export function buildSeedOrders(menu: Menu): StoredOrder[] {
  const { orders } = seedFixture as { orders: SeedOrder[] }
  return orders.map((order) => {
    const lines = order.lines.map((line) => ({
      qty: line.qty,
      config: optionsToConfig(menu, line.options),
    }))
    const coupon =
      order.couponCode && order.couponCode.trim().length > 0
        ? order.couponCode
        : undefined
    const totals = priceCart(menu, lines, {
      coupon,
      now: new Date(order.createdAt),
    })
    return {
      id: order.id,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      couponCode: order.couponCode,
      lines,
      totals,
    }
  })
}

export const ORDERS_EXPORT_META = {
  schemaVersion: seedFixture.schemaVersion as number,
  currency: seedFixture.currency as string,
}