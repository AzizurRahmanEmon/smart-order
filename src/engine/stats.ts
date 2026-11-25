import type { PriceCartResult } from '@/engine/pricing'
import type { PaymentMethod } from '@/types/api'

export type StatsOrderLine = {
  qty: number
  config: Record<string, number>
}

export type StatsOrder = {
  id: string
  createdAt: string
  paymentMethod: PaymentMethod
  couponCode: string | null
  lines: StatsOrderLine[]
  totals: PriceCartResult
}

export type StatsDateRange = {
  /** YYYY-MM-DD, inclusive, Asia/Dhaka */
  from?: string
  to?: string
  /** Single calendar day in Asia/Dhaka */
  date?: string
}

function dhakaDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

function inDateRange(createdAt: string, range?: StatsDateRange): boolean {
  if (!range) return true
  const key = dhakaDateKey(createdAt)
  if (range.date) return key === range.date
  if (range.from && key < range.from) return false
  if (range.to && key > range.to) return false
  return true
}

export function filterOrders(
  orders: StatsOrder[],
  range?: StatsDateRange,
): StatsOrder[] {
  return orders.filter((o) => inDateRange(o.createdAt, range))
}

export function orderCount(
  orders: StatsOrder[],
  range?: StatsDateRange,
): number {
  return filterOrders(orders, range).length
}

export function totalRevenue(
  orders: StatsOrder[],
  range?: StatsDateRange,
): number {
  return filterOrders(orders, range).reduce(
    (sum, o) => sum + o.totals.payable,
    0,
  )
}

export function averageOrderValue(
  orders: StatsOrder[],
  range?: StatsDateRange,
): number {
  const list = filterOrders(orders, range)
  if (list.length === 0) return 0
  return Math.round(totalRevenue(list) / list.length)
}

export function topOptions(
  orders: StatsOrder[],
  n = 5,
): { optionId: string; units: number }[] {
  const units = new Map<string, number>()
  for (const order of orders) {
    for (const line of order.lines) {
      for (const [optionId, count] of Object.entries(line.config)) {
        const c = count ?? 0
        if (c <= 0) continue
        units.set(optionId, (units.get(optionId) ?? 0) + c * line.qty)
      }
    }
  }
  return [...units.entries()]
    .map(([optionId, u]) => ({ optionId, units: u }))
    .sort((a, b) => b.units - a.units || a.optionId.localeCompare(b.optionId))
    .slice(0, Math.max(1, n))
}

export function couponUsage(orders: StatsOrder[]): {
  ordersWithCodeEntered: number
  ordersWithCouponApplied: number
  appliedOrderIds: string[]
} {
  const withCode = orders.filter(
    (o) => o.couponCode && o.couponCode.trim().length > 0,
  )
  const applied = orders.filter((o) => o.totals.chosen === 'coupon')
  return {
    ordersWithCodeEntered: withCode.length,
    ordersWithCouponApplied: applied.length,
    appliedOrderIds: applied.map((o) => o.id),
  }
}

export function revenueByPaymentMethod(
  orders: StatsOrder[],
  range?: StatsDateRange,
): Record<PaymentMethod, number> {
  const base: Record<PaymentMethod, number> = {
    card: 0,
    bkash: 0,
    cash: 0,
  }
  for (const o of filterOrders(orders, range)) {
    base[o.paymentMethod] += o.totals.payable
  }
  return base
}

export function revenueByDay(
  orders: StatsOrder[],
  date: string,
): {
  date: string
  orderCount: number
  revenuePoisha: number
} {
  const list = filterOrders(orders, { date })
  return {
    date,
    orderCount: list.length,
    revenuePoisha: totalRevenue(list, { date }),
  }
}

/** Seed / shop data has no customer identity — tool for D5 / TC-20 */
export function bestCustomerInsight(): {
  supported: false
  reason: string
} {
  return {
    supported: false,
    reason:
      'Orders do not include customer names or IDs, so best customer cannot be determined from this dataset.',
  }
}