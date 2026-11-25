import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'

import menuFixture from '@/mocks/fixtures/menu.json'
import type { Config, Menu } from '@/types/menu'

import { handlers } from './handlers'
import { buildConfig as buildConfigHelper } from './testHelpers'
import {
  getCatalogStock,
  getOrdersNewestFirst,
  getOrdersExport,
  reloadPersistedStateForTest,
  resetMockServerState,
  setInventoryForTest,
} from './serverState'

const server = setupServer(...handlers)
const menu = menuFixture as Menu

function buildConfig(picks: Partial<Config>): Config {
  return buildConfigHelper(menu, picks)
}

async function addPlate(key: string, config: Config, qty = 1) {
  return fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
    },
    body: JSON.stringify({ config, qty }),
  })
}

async function checkout(
  key: string,
  extraHeaders: Record<string, string> = {},
) {
  return fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': key,
      ...extraHeaders,
    },
    body: JSON.stringify({ paymentMethod: 'card', coupon: 'MORNING15' }),
  })
}

beforeEach(() => {
  resetMockServerState()
  server.listen()
})

afterEach(() => {
  server.resetHandlers()
  server.close()
  vi.restoreAllMocks()
})

describe('checkout and orders', () => {
  it('TC-16: double Pay with the same key yields one order and empty cart', async () => {
    const config = buildConfig({
      toast: 1,
      scrambled: 2,
      sausage: 1,
      ketchup: 1,
    })
    await addPlate('line-a', config)

    const key = 'pay-once'
    const r1 = await checkout(key)
    const r2 = await checkout(key)
    expect(r1.status).toBe(201)
    expect(r2.status).toBe(201)

    const body1 = await r1.json()
    const body2 = await r2.json()
    expect(body1.order.id).toBe(body2.order.id)

    const cart = await fetch('/api/cart').then((r) => r.json())
    expect(cart.lines).toHaveLength(0)

    const orders = await fetch('/api/orders').then((r) => r.json())
    expect(orders.some((o: { id: string }) => o.id === body1.order.id)).toBe(
      true,
    )
    expect(orders.filter((o: { id: string }) => o.id === body1.order.id)).toHaveLength(
      1,
    )
  })

  it('rejects checkout when any cart line is expired', async () => {
    const t0 = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => t0)

    const config = buildConfig({
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    await addPlate('exp-line', config)

    vi.spyOn(Date, 'now').mockImplementation(() => t0 + 5 * 60 * 1000 + 1_000)

    const res = await checkout('pay-expired')
    expect(res.status).toBe(409)
    const err = await res.json()
    expect(err.code).toBe('expired_cart_lines')

    const cart = await fetch('/api/cart').then((r) => r.json())
    expect(cart.lines).toHaveLength(1)
  })

  it('checkout failure after validation leaves cart and inventory untouched', async () => {
    const config = buildConfig({
      toast: 1,
      scrambled: 2,
      sausage: 1,
      ketchup: 1,
    })
    await addPlate('hold-stock', config)
    const eggBefore = getCatalogStock().egg
    const cartBefore = await fetch('/api/cart').then((r) => r.json())
    expect(cartBefore.lines).toHaveLength(1)

    const res = await checkout('fail-checkout', {
      'X-Mock-Fail': 'checkout',
    })
    expect(res.status).toBe(500)

    const cartAfter = await fetch('/api/cart').then((r) => r.json())
    expect(cartAfter.lines).toHaveLength(1)
    expect(getCatalogStock().egg).toBe(eggBefore)
  })

  it('rejects checkout when inventory cannot cover reserved usage', async () => {
    const config = buildConfig({
      toast: 1,
      scrambled: 2,
      sausage: 1,
      ketchup: 1,
    })
    await addPlate('reserve-eggs', config)

    setInventoryForTest({ egg: 0 })

    const res = await checkout('low-stock')
    expect(res.status).toBe(409)

    const cart = await fetch('/api/cart').then((r) => r.json())
    expect(cart.lines).toHaveLength(1)
    expect(getCatalogStock().egg).toBe(0)
  })

  it('seed order ORD-1006 has no applied coupon discount at 13:10 Dhaka', async () => {
    const orders = getOrdersNewestFirst()
    const order = orders.find((o) => o.id === 'ORD-1006')
    expect(order).toBeDefined()
    expect(order!.totals.couponRejection).toBe('expired')
    expect(order!.totals.coupon).toBe(0)
    expect(order!.totals.chosen).not.toBe('coupon')
  })

  it('TC-17: orders and export survive persisted reload', async () => {
    const config = buildConfig({
      toast: 1,
      scrambled: 2,
      sausage: 1,
      ketchup: 1,
    })
    await addPlate('persist-line', config)
    const placed = await checkout('persist-pay')
    expect(placed.status).toBe(201)
    const { order } = await placed.json()

    reloadPersistedStateForTest()

    const orders = getOrdersNewestFirst()
    expect(orders.some((o) => o.id === order.id)).toBe(true)

    const exported = getOrdersExport()
    expect(exported.schemaVersion).toBe(1)
    expect(exported.currency).toBe('BDT')
    expect(() => JSON.stringify(exported)).not.toThrow()
    expect(exported.orders.some((o) => o.id === order.id)).toBe(true)
    expect(exported.orders[0]?.totals?.payable).toBeDefined()
  })
})