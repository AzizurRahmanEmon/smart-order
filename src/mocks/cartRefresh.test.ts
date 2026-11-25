import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { setupServer } from 'msw/node'

import menuFixture from '@/mocks/fixtures/menu.json'
import type { Menu } from '@/types/menu'
import { usage } from '@/engine/stock'

import { handlers } from './handlers'
import { buildConfig } from './testHelpers'
import {
  reloadPersistedStateForTest,
  resetMockServerState,
  seedCartLinesForTest,
  type StoredCartLine,
} from './serverState'

const server = setupServer(...handlers)
const menu = menuFixture as Menu

beforeEach(() => {
  resetMockServerState()
  server.listen()
})

afterEach(() => {
  server.resetHandlers()
  server.close()
  vi.restoreAllMocks()
})

describe('Part G cart refresh bootstrap', () => {
  it('drops expired lines on reload and keeps active reservation', async () => {
    const t0 = 1_700_000_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => t0)

    const activeConfig = buildConfig(menu, {
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    const expiredConfig = buildConfig(menu, {
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 2,
    })

    const lines: StoredCartLine[] = [
      {
        id: 'expired-line',
        config: expiredConfig,
        qty: 1,
        reservedAtMs: t0 - 400_000,
        expiresAtMs: t0 - 1_000,
      },
      {
        id: 'active-line',
        config: activeConfig,
        qty: 1,
        reservedAtMs: t0,
        expiresAtMs: t0 + 5 * 60 * 1000,
      },
    ]

    seedCartLinesForTest(lines, 2)
    reloadPersistedStateForTest()

    const cart = await fetch('/api/cart').then((r) => r.json())
    expect(cart.lines).toHaveLength(1)
    expect(cart.lines[0].id).toBe('active-line')
    expect(cart.lines[0].expired).toBe(false)

    const expected = usage(menu, activeConfig, 1)
    expect(cart.reserved.egg).toBe(expected.egg)
  })
})