import { describe, expect, it } from 'vitest'

import menuFixture from '@/mocks/fixtures/menu.json'
import { buildSeedOrders } from '@/mocks/ordersSeed'
import type { Menu } from '@/types/menu'

import {
  couponUsage,
  orderCount,
  topOptions,
  totalRevenue,
  revenueByDay,
} from './stats'

const menu = menuFixture as Menu
const seedOrders = buildSeedOrders(menu)

describe('stats on seed orders', () => {
  it('TC-19: order_count matches six seed orders', () => {
    expect(orderCount(seedOrders)).toBe(6)
  })

  it('totalRevenue matches sum of priced payables', () => {
    const expected = seedOrders.reduce((s, o) => s + o.totals.payable, 0)
    expect(totalRevenue(seedOrders)).toBe(expected)
    expect(totalRevenue(seedOrders)).toBeGreaterThan(0)
  })

  it('topOptions returns deterministic leader from seed data', () => {
    const top = topOptions(seedOrders, 1)
    expect(top).toHaveLength(1)
    expect(top[0]!.units).toBeGreaterThan(0)
    const scrambledUnits = topOptions(seedOrders, 10).find(
      (o) => o.optionId === 'scrambled',
    )?.units
    expect(scrambledUnits).toBeDefined()
  })

  it('couponUsage distinguishes entered vs applied on seed', () => {
    const usage = couponUsage(seedOrders)
    expect(usage.ordersWithCodeEntered).toBeGreaterThan(0)
    expect(usage.ordersWithCouponApplied).toBeLessThanOrEqual(
      usage.ordersWithCodeEntered,
    )
    expect(usage.ordersWithCouponApplied).toBe(3)
  })

  it('revenueByDay filters by Dhaka date', () => {
    const day = revenueByDay(seedOrders, '2026-11-20')
    expect(day.orderCount).toBe(2)
    expect(day.revenuePoisha).toBe(
      seedOrders
        .filter((o) => o.createdAt.startsWith('2026-11-20'))
        .reduce((s, o) => s + o.totals.payable, 0),
    )
  })
})