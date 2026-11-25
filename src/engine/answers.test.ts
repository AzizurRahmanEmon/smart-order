import { describe, expect, it } from 'vitest'

import menuFixture from '@/mocks/fixtures/menu.json'
import { buildConfig } from '@/mocks/testHelpers'
import { buildSeedOrders } from '@/mocks/ordersSeed'
import { priceCart } from '@/engine/pricing'
import { usage } from '@/engine/stock'
import { validate } from '@/engine/validate'
import {
  couponUsage,
  topOptions,
  totalRevenue,
  revenueByPaymentMethod,
} from '@/engine/stats'
import type { Menu } from '@/types/menu'

const menu = menuFixture as Menu

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
    let limitIngredient = ''
    for (let qty = 1; qty <= 50; qty++) {
      const u = usage(menu, configC, qty)
      const ok = menu.ingredients.every((ing) => {
        const need = u[ing.id] ?? 0
        return need <= ing.stock
      })
      if (!ok) break
      maxItems = qty
    }
    const uMax = usage(menu, configC, maxItems)
    const uNext = usage(menu, configC, maxItems + 1)
    for (const ing of menu.ingredients) {
      const d = (uNext[ing.id] ?? 0) - (uMax[ing.id] ?? 0)
      if (d > 0) {
        limitIngredient = ing.id
        break
      }
    }
    expect({ maxItems, limitIngredient }).toEqual({ maxItems: 2, limitIngredient: 'egg' })
  })

  it('Q5/Q6/Q7/Q8 seed aggregates', () => {
    const seed = buildSeedOrders(menu)
    expect(totalRevenue(seed)).toBe(499_500)
    expect(topOptions(seed, 1)[0]).toEqual({ optionId: 'fried', units: 10 })
    const byMethod = revenueByPaymentMethod(seed)
    expect(byMethod.card).toBeGreaterThan(byMethod.bkash)
    expect(byMethod.card).toBeGreaterThan(byMethod.cash)
    expect(couponUsage(seed).ordersWithCouponApplied).toBe(3)
    for (const o of seed) {
      expect(o.totals.payable).toBeGreaterThan(0)
    }
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
    expect(at1030.chosen).toBe('coupon')
    expect(at1030.payableBDT).toBe(1_040)
    expect(at1130.chosen).toBe(null)
    expect(at1130.cartDiscount).toBe(0)
    expect(at1130.payableBDT).toBe(1_197)
  })
})

describe('Q2 cheapest valid plate', () => {
  it('toast + fried×1 + scrambled×1 + sausage', () => {
    const config = buildConfig(menu, {
      toast: 1,
      fried: 1,
      scrambled: 1,
      sausage: 1,
    })
    expect(validate(menu, config)).toHaveLength(0)
    const priced = priceCart(menu, [{ config, qty: 1 }], {
      now: new Date('2026-11-25T10:00:00+06:00'),
    })
    expect(priced.payableBDT).toBe(394)
  })
})