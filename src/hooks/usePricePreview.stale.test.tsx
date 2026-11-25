import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse, delay } from 'msw'
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'

import { handlers } from '@/mocks/handlers'
import { createQueryClient } from '@/lib/queryClient'
import { resetMockServerState } from '@/mocks/serverState'
import menuFixture from '@/mocks/fixtures/menu.json'
import type { Config, Menu } from '@/types/menu'

import { usePricePreview } from './usePricePreview'

const server = setupServer(...handlers)
const menu = menuFixture as Menu

function wrapper() {
  const client = createQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

function buildConfig(picks: Partial<Config>): Config {
  const config: Config = {}
  for (const group of menu.groups) {
    for (const option of group.options) {
      config[option.id] = 0
    }
  }
  for (const [id, count] of Object.entries(picks)) {
    if (count !== undefined) config[id] = count
  }
  return config
}

describe('TC-12 stale price guard', () => {
  beforeAll(() => server.listen())
  afterEach(() => {
    server.resetHandlers()
    resetMockServerState()
  })
  afterAll(() => server.close())

  it('only the latest configuration price is kept', async () => {
    let slowStarted = false

    server.use(
      http.post('/api/price', async ({ request }) => {
        const body = (await request.json()) as { config: Config }
        const isSlow =
          (body.config.scrambled ?? 0) === 1 && (body.config.fried ?? 0) === 0
        if (isSlow) {
          slowStarted = true
          await delay(800)
        }
        const subtotal =
          body.config.scrambled === 3 ? 50_000 : body.config.scrambled === 1 ? 38_000 : 25_000
        return HttpResponse.json({
          subtotal,
          cartFixed: 0,
          coupon: 0,
          cartDiscount: 0,
          chosen: null,
          vat: Math.floor(subtotal * 0.05),
          payable: subtotal + Math.floor(subtotal * 0.05),
          payableBDT: (subtotal + Math.floor(subtotal * 0.05)) / 100,
          couponRejection: null,
          lines: [],
          serverTime: new Date().toISOString(),
        })
      }),
    )

    const { result, rerender } = renderHook(
      ({ config }: { config: Config }) => usePricePreview(config, '', true),
      {
        wrapper: wrapper(),
        initialProps: {
          config: buildConfig({ toast: 1, scrambled: 1, sausage: 1 }),
        },
      },
    )

    rerender({
      config: buildConfig({ toast: 1, scrambled: 3, sausage: 1 }),
    })

    await waitFor(
      () => {
        expect(result.current.data?.subtotal).toBe(50_000)
      },
      { timeout: 3000 },
    )

    expect(slowStarted).toBe(true)
  })
})