import { describe, expect, it } from 'vitest'

import menuFixture from '@/mocks/fixtures/menu.json'
import type { Config, Menu } from '@/types/menu'

import {
  halfUpPoisha,
  isCouponTimeValid,
  priceCart,
  priceLine,
  roundPayableWholeBdt,
} from './pricing'

const menu = menuFixture as Menu

function buildConfig(picks: Partial<Config>): Config {
  const config: Config = {}
  for (const group of menu.groups) {
    for (const option of group.options) {
      config[option.id] = 0
    }
  }
  for (const [id, count] of Object.entries(picks)) {
    if (count !== undefined) {
      config[id] = count
    }
  }
  return config
}

const configA = buildConfig({
  toast: 1,
  scrambled: 2,
  sausage: 1,
  ketchup: 1,
})

const configB = buildConfig({
  croissant: 1,
  omelette: 2,
  fried: 2,
  sausage: 1,
  bacon: 1,
  hashbrown: 1,
  mushroom: 1,
  hollandaise: 1,
})

const configC = buildConfig({
  paratha: 1,
  fried: 2,
  tofu: 1,
  cheese: 2,
  beans: 1,
  mushroom: 1,
  chili: 1,
})

const dhaka105959 = new Date('2025-06-01T04:59:59.000Z')
const dhaka110000 = new Date('2025-06-01T05:00:00.000Z')

describe('halfUpPoisha', () => {
  it('rounds .5 up to nearest poisha', () => {
    expect(halfUpPoisha(75.5)).toBe(76)
    expect(halfUpPoisha(7547.5)).toBe(7548)
    expect(halfUpPoisha(7797.5)).toBe(7798)
  })
})

describe('priceLine TC-05', () => {
  it('A = 380.00 BDT', () => {
    expect(priceLine(menu, configA).unit).toBe(38_000)
  })

  it('B = 679.50 BDT', () => {
    const line = priceLine(menu, configB)
    expect(line.unit).toBe(67_950)
    expect(line.comboDiscount).toBe(7_550)
  })

  it('C = 490.00 BDT with extras deal on cheapest unit', () => {
    const line = priceLine(menu, configC)
    expect(line.unit).toBe(49_000)
    expect(line.extrasDiscount).toBe(2_500)
  })

  it('extras deal picks cheapest extra units', () => {
    const config = buildConfig({
      hashbrown: 1,
      mushroom: 1,
      beans: 1,
    })
    const baseOnly = 25_000 + 4_000 + 3_000 + 2_500
    const line = priceLine(menu, config)
    expect(line.extrasDiscount).toBe(2_500)
    expect(line.unit).toBe(baseOnly - 2_500)
  })
})

describe('priceCart TC-06 / TC-07', () => {
  const cart = [
    { config: configB, qty: 1 },
    { config: configC, qty: 2 },
  ]

  it('TC-06: 10:59:59 Dhaka — C2 wins, VAT 75.48, payable 1,585', () => {
    const total = priceCart(menu, cart, {
      coupon: 'MORNING15',
      now: dhaka105959,
    })
    expect(total.subtotal).toBe(165_950)
    expect(total.coupon).toBe(15_000)
    expect(total.cartFixed).toBe(10_000)
    expect(total.chosen).toBe('coupon')
    expect(total.vat).toBe(7_548)
    expect(total.payable).toBe(158_500)
    expect(total.payableBDT).toBe(1_585)
  })

  it('TC-07: 11:00:00 Dhaka — coupon expired, C1 wins', () => {
    const total = priceCart(menu, cart, {
      coupon: 'MORNING15',
      now: dhaka110000,
    })
    expect(total.couponRejection).toBe('expired')
    expect(total.chosen).toBe('cartFixed')
    expect(total.cartDiscount).toBe(10_000)
    expect(total.vat).toBe(7_798)
    expect(total.payable).toBe(163_700)
    expect(total.payableBDT).toBe(1_637)
  })

  it('tie goes to cartFixed when coupon equals fixed discount', () => {
    const customMenu: Menu = {
      ...menu,
      product: { ...menu.product, basePrice: 66_666 },
      promotions: [
        { id: 'C1', type: 'cartFixed', minSubtotal: 1, amount: 10_000 },
        {
          id: 'C2',
          type: 'coupon',
          code: 'TIE',
          percent: 15,
          cap: 50_000,
          validBefore: '23:59',
          timeZone: 'Asia/Dhaka',
        },
      ],
    }
    const empty = buildConfig({})
    const result = priceCart(
      customMenu,
      [{ config: empty, qty: 1 }],
      { coupon: 'tie', now: dhaka105959 },
    )
    expect(result.coupon).toBe(10_000)
    expect(result.cartFixed).toBe(10_000)
    expect(result.chosen).toBe('cartFixed')
  })

  it('rejects invalid coupon code', () => {
    const result = priceCart(menu, cart, {
      coupon: 'WRONG',
      now: dhaka105959,
    })
    expect(result.couponRejection).toBe('invalid')
    expect(result.chosen).toBe('cartFixed')
  })
})

describe('isCouponTimeValid', () => {
  it('is strict before 11:00 in Asia/Dhaka', () => {
    expect(
      isCouponTimeValid(dhaka105959, '11:00', 'Asia/Dhaka'),
    ).toBe(true)
    expect(
      isCouponTimeValid(dhaka110000, '11:00', 'Asia/Dhaka'),
    ).toBe(false)
  })
})

describe('roundPayableWholeBdt', () => {
  it('rounds payable half-up to whole BDT', () => {
    expect(roundPayableWholeBdt(158_498)).toBe(158_500)
    expect(roundPayableWholeBdt(163_748)).toBe(163_700)
  })
})