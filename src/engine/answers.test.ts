import { describe, expect, it } from 'vitest'

import menuFixture from '@/mocks/fixtures/menu.json'
import { buildConfig } from '@/mocks/testHelpers'
import { buildSeedOrders } from '@/mocks/ordersSeed'
import { enumerateRawConfigs } from '@/engine/enumerateConfigs'
import { priceCart, priceLine } from '@/engine/pricing'
import { usage } from '@/engine/stock'
import { validate } from '@/engine/validate'
import {
  couponUsage,
  topOptions,
  totalRevenue,
  revenueByPaymentMethod,
} from '@/engine/stats'
import type { Config, Menu } from '@/types/menu'

const menu = menuFixture as Menu
const priceAt = new Date('2026-11-25T10:00:00+06:00')

/** Reference values for ANSWERS.md — run: npm test -- --run src/engine/answers.test.ts */
describe('Section 10 reference answers', () => {
  it('Q1: max units of configuration C on empty cart', () => {
    const configC = buildConfig(menu, {
      paratha: 1,
      fried: 2,
      tofu: 1,
      cheese: 2,
      beans: 1,
      mushroom: 1,
      chili: 1,
    })
    let maxItems = 0
    for (let qty = 1; qty <= 50; qty++) {
      const u = usage(menu, configC, qty)
      const ok = menu.ingredients.every((ing) => {
        const need = u[ing.id] ?? 0
        return need <= ing.stock
      })
      if (!ok) break
      maxItems = qty
    }
    let limitIngredient = ''
    let minHeadroom = Infinity
    for (const ing of menu.ingredients) {
      const perPlate = usage(menu, configC, 1)[ing.id] ?? 0
      if (perPlate === 0) continue
      const headroom = ing.stock / perPlate
      if (headroom < minHeadroom) {
        minHeadroom = headroom
        limitIngredient = ing.id
      }
    }
    expect({ maxItems, limitIngredient }).toEqual({ maxItems: 2, limitIngredient: 'cheese' })
  })

  it('Q5: each seed order payable and total revenue', () => {
    const seed = buildSeedOrders(menu)
    const payables = Object.fromEntries(
      seed.map((o) => [o.id, o.totals.payableBDT]),
    )
    expect(payables).toEqual({
      'ORD-1001': 339,
      'ORD-1002': 713,
      'ORD-1003': 1_271,
      'ORD-1004': 578,
      'ORD-1005': 866,
      'ORD-1006': 1_228,
    })
    expect(totalRevenue(seed)).toBe(499_500)
  })

  it('Q5/Q6/Q7/Q8 seed aggregates', () => {
    const seed = buildSeedOrders(menu)
    expect(topOptions(seed, 1)[0]).toEqual({ optionId: 'fried', units: 10 })
    const byMethod = revenueByPaymentMethod(seed)
    expect(byMethod.card).toBeGreaterThan(byMethod.bkash)
    expect(byMethod.card).toBeGreaterThan(byMethod.cash)
    expect(couponUsage(seed).ordersWithCouponApplied).toBe(3)
    for (const o of seed) {
      expect(o.totals.payable).toBeGreaterThan(0)
    }
  })

  it('Q8: MORNING15 per seed order', () => {
    const seed = buildSeedOrders(menu)
    const byId = Object.fromEntries(seed.map((o) => [o.id, o]))
    expect(byId['ORD-1001']!.totals.chosen).toBe('coupon')
    expect(byId['ORD-1002']!.couponCode).toBeNull()
    expect(byId['ORD-1003']!.totals.chosen).toBe('coupon')
    expect(byId['ORD-1004']!.couponCode).toBeNull()
    expect(byId['ORD-1005']!.totals.chosen).toBe('coupon')
    expect(byId['ORD-1006']!.totals.couponRejection).toBe('expired')
    expect(byId['ORD-1006']!.totals.chosen).not.toBe('coupon')
  })

  it('Q4: after TC-10 cart at 11:30', () => {
    const configC = buildConfig(menu, {
      paratha: 1,
      fried: 2,
      tofu: 1,
      cheese: 2,
      beans: 1,
      mushroom: 1,
      chili: 1,
    })
    const configBAfterTc10 = buildConfig(menu, {
      croissant: 1,
      omelette: 1,
      fried: 3,
      sausage: 1,
      bacon: 1,
      hashbrown: 1,
      mushroom: 1,
      hollandaise: 1,
    })
    const cart = [
      { config: configBAfterTc10, qty: 1 },
      { config: configC, qty: 2 },
    ]
    const at1130 = priceCart(menu, cart, {
      coupon: 'MORNING15',
      now: new Date('2026-11-25T11:30:00+06:00'),
    })
    expect(at1130.subtotal).toBe(162_350)
    expect(at1130.couponRejection).toBe('expired')
    expect(at1130.chosen).toBe('cartFixed')
    expect(at1130.cartDiscount).toBe(10_000)
    expect(at1130.vat).toBe(7_618)
    expect(at1130.payableBDT).toBe(1_600)
  })

  it('Q3: cart A x3 at 10:30 and 11:30', () => {
    const configA = buildConfig(menu, {
      toast: 1,
      scrambled: 2,
      sausage: 1,
      ketchup: 1,
    })
    const at1030 = priceCart(menu, [{ config: configA, qty: 3 }], {
      coupon: 'MORNING15',
      now: new Date('2026-11-25T10:30:00+06:00'),
    })
    const at1130 = priceCart(menu, [{ config: configA, qty: 3 }], {
      coupon: 'MORNING15',
      now: new Date('2026-11-25T11:30:00+06:00'),
    })
    expect(at1030.subtotal).toBe(114_000)
    expect(at1030.coupon).toBe(15_000)
    expect(at1030.chosen).toBe('coupon')
    expect(at1030.vat).toBe(4_950)
    expect(at1030.payableBDT).toBe(1_040)
    expect(at1130.chosen).toBe(null)
    expect(at1130.cartDiscount).toBe(0)
    expect(at1130.vat).toBe(5_700)
    expect(at1130.payableBDT).toBe(1_197)
  })
})

describe('Q2 cheapest valid plate', () => {
  it('brute force over valid configs finds toast + fried×2 + tofu at 378 BDT payable', () => {
    let bestPayable = Infinity
    let bestUnit = Infinity
    let bestConfig: Config | null = null

    for (const config of enumerateRawConfigs(menu)) {
      if (validate(menu, config).length > 0) continue
      const line = priceLine(menu, config)
      const cart = priceCart(menu, [{ config, qty: 1 }], { now: priceAt })
      if (cart.payableBDT < bestPayable) {
        bestPayable = cart.payableBDT
        bestUnit = line.unit
        bestConfig = config
      }
    }

    expect(bestConfig).not.toBeNull()
    expect(bestConfig!.toast).toBe(1)
    expect(bestConfig!.fried).toBe(2)
    expect(bestConfig!.tofu).toBe(1)
    expect(bestConfig!.scrambled).toBe(0)
    expect(bestConfig!.sausage).toBe(0)
    expect(bestUnit).toBe(36_000)
    expect(bestPayable).toBe(378)
  })
})