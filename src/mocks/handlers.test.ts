import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'

import menuFixture from '@/mocks/fixtures/menu.json'
import type { Config, Menu } from '@/types/menu'

import { handlers } from './handlers'
import {
  buildConfig as buildConfigHelper,
  cartIfMatchHeaders,
  cartPostHeaders,
} from './testHelpers'
import { getCatalogStock, resetMockServerState } from './serverState'

const server = setupServer(...handlers)
const menu = menuFixture as Menu

function buildConfig(picks: Partial<Config>): Config {
  return buildConfigHelper(menu, picks)
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

describe('cart handlers', () => {
  it('TC-13: same Idempotency-Key twice yields one cart line', async () => {
    const config = buildConfig({
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    const key = 'same-key-123'
    const headers1 = await cartPostHeaders(key)

    const r1 = await fetch('/api/cart', {
      method: 'POST',
      headers: headers1,
      body: JSON.stringify({ config, qty: 1 }),
    })
    expect(r1.status).toBe(201)

    const headers2 = await cartPostHeaders(key)
    const r2 = await fetch('/api/cart', {
      method: 'POST',
      headers: headers2,
      body: JSON.stringify({ config, qty: 1 }),
    })
    expect(r2.status).toBe(201)

    const cart = await fetch('/api/cart').then((r) => r.json())
    expect(cart.lines).toHaveLength(1)
  })

  it('TC-14: X-Mock-Fail leaves cart empty', async () => {
    const config = buildConfig({
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: await cartPostHeaders('fail-key', {
        'X-Mock-Fail': 'reserve',
      }),
      body: JSON.stringify({ config, qty: 1 }),
    })
    expect(res.status).toBe(500)
    const cart = await fetch('/api/cart').then((r) => r.json())
    expect(cart.lines).toHaveLength(0)
  })

  it('returns 409 on insufficient stock without adding line', async () => {
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
    await fetch('/api/cart', {
      method: 'POST',
      headers: await cartPostHeaders('b-key'),
      body: JSON.stringify({ config: configB, qty: 1 }),
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
    for (let i = 0; i < 2; i++) {
      await fetch('/api/cart', {
        method: 'POST',
        headers: await cartPostHeaders(`c-${i}`),
        body: JSON.stringify({ config: configC, qty: 1 }),
      })
    }

    const greedy = buildConfig({ toast: 1, sausage: 1, fried: 2 })
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: await cartPostHeaders('egg-fail'),
      body: JSON.stringify({ config: greedy, qty: 1 }),
    })
    expect(res.status).toBe(409)
  })

  it('PUT keeps expiresAt while changing config', async () => {
    const config = buildConfig({
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    const add = await fetch('/api/cart', {
      method: 'POST',
      headers: await cartPostHeaders('edit-test'),
      body: JSON.stringify({ config, qty: 1 }),
    }).then((r) => r.json())

    const expiresAt = add.lines.find((l: { id: string }) => l.id === add.lineId)
      ?.expiresAt

    const newConfig = buildConfig({
      toast: 1,
      scrambled: 2,
      sausage: 1,
    })
    const updated = await fetch(`/api/cart/${add.lineId}`, {
      method: 'PUT',
      headers: await cartIfMatchHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ config: newConfig, qty: 1 }),
    }).then((r) => r.json())

    const line = updated.lines.find((l: { id: string }) => l.id === add.lineId)
    expect(line?.expiresAt).toBe(expiresAt)
  })

  it('TC-15: expired line releases reserved but remains until removed', async () => {
    const t0 = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => t0)

    const config = buildConfig({
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    await fetch('/api/cart', {
      method: 'POST',
      headers: await cartPostHeaders('expiry'),
      body: JSON.stringify({ config, qty: 1 }),
    })

    let cart = await fetch('/api/cart').then((r) => r.json())
    expect(cart.reserved.egg).toBeGreaterThan(0)

    vi.spyOn(Date, 'now').mockImplementation(() => t0 + 5 * 60 * 1000 + 1_000)

    cart = await fetch('/api/cart').then((r) => r.json())
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].expired).toBe(true)
    expect(cart.reserved.egg ?? 0).toBe(0)
    expect(cart.stock.egg).toBe(getCatalogStock().egg)
  })
})

describe('server stock model', () => {
  it('catalog stock unchanged after reserve and delete', async () => {
    const catalogBefore = getCatalogStock().egg
    const config = buildConfig({
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    const add = await fetch('/api/cart', {
      method: 'POST',
      headers: await cartPostHeaders('stock-test'),
      body: JSON.stringify({ config, qty: 1 }),
    }).then((r) => r.json())

    expect(getCatalogStock().egg).toBe(catalogBefore)

    await fetch(`/api/cart/${add.lineId}`, {
      method: 'DELETE',
      headers: await cartIfMatchHeaders(),
    })
    expect(getCatalogStock().egg).toBe(catalogBefore)
  })
})