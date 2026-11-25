import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { setupServer } from 'msw/node'

import menuFixture from '@/mocks/fixtures/menu.json'
import type { Config, Menu } from '@/types/menu'

import { handlers } from './handlers'
import {
  buildConfig as buildConfigHelper,
  cartPostHeaders,
  fetchCartVersion,
} from './testHelpers'
import { getCartVersion, resetMockServerState } from './serverState'

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
})

describe('Part G cart versioning', () => {
  it('stale If-Match returns 409 and leaves cart and version untouched', async () => {
    const config = buildConfig({
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    const addRes = await fetch('/api/cart', {
      method: 'POST',
      headers: await cartPostHeaders('v-initial'),
      body: JSON.stringify({ config, qty: 1 }),
    })
    expect(addRes.status).toBe(201)
    expect(await fetchCartVersion()).toBe(2)

    const before = await fetch('/api/cart').then((r) => r.json())

    const stale = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'stale-write',
        'If-Match': '1',
      },
      body: JSON.stringify({ config, qty: 1 }),
    })
    expect(stale.status).toBe(409)
    const err = await stale.json()
    expect(err.code).toBe('cart_conflict')
    expect(err.currentVersion).toBe(2)

    const after = await fetch('/api/cart').then((r) => r.json())
    expect(after.version).toBe(before.version)
    expect(after.lines).toEqual(before.lines)
    expect(after.reserved).toEqual(before.reserved)
    expect(getCartVersion()).toBe(2)
  })

  it('correct If-Match succeeds and bumps cart version', async () => {
    expect(await fetchCartVersion()).toBe(1)

    const config = buildConfig({
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: await cartPostHeaders('bump-test'),
      body: JSON.stringify({ config, qty: 1 }),
    })
    expect(res.status).toBe(201)
    expect(await fetchCartVersion()).toBe(2)
  })

  it('replays idempotency cache even when If-Match is stale', async () => {
    const configA = buildConfig({
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    const configB = buildConfig({
      croissant: 1,
      omelette: 1,
      fried: 1,
      sausage: 1,
    })

    const first = await fetch('/api/cart', {
      method: 'POST',
      headers: await cartPostHeaders('idem-a'),
      body: JSON.stringify({ config: configA, qty: 1 }),
    })
    expect(first.status).toBe(201)
    const firstBody = await first.json()

    await fetch('/api/cart', {
      method: 'POST',
      headers: await cartPostHeaders('idem-b'),
      body: JSON.stringify({ config: configB, qty: 1 }),
    })
    expect(await fetchCartVersion()).toBe(3)

    const replay = await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'idem-a',
        'If-Match': '1',
      },
      body: JSON.stringify({ config: configA, qty: 1 }),
    })
    expect(replay.status).toBe(201)
    const replayBody = await replay.json()
    expect(replayBody.lineId).toBe(firstBody.lineId)

    const cart = await fetch('/api/cart').then((r) => r.json())
    expect(cart.lines).toHaveLength(2)
    expect(cart.version).toBe(3)
  })
})