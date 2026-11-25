import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import menuFixture from '@/mocks/fixtures/menu.json'
import {
  BUILDER_SESSION_STORAGE_KEY,
  sanitizeConfigForMenu,
} from '@/lib/builderSession'
import { useConfigStore } from '@/store/configStore'
import type { CartResponse } from '@/types/api'
import type { Menu } from '@/types/menu'

import { BuilderSessionSync } from './BuilderSessionSync'

const menu = menuFixture as Menu

vi.mock('@/hooks/useMenu', () => ({
  useMenu: () => ({ data: menu, isLoading: false }),
}))

vi.mock('@/hooks/useCartSync', () => ({
  useCartSync: () => {},
}))

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(),
}))

import { useCart } from '@/hooks/useCart'

const mockUseCart = vi.mocked(useCart)

function cartWithLine(
  line: Partial<CartResponse['lines'][0]> | null,
): CartResponse {
  return {
    serverTime: new Date().toISOString(),
    version: 1,
    lines: line ? [{ id: 'line-1', config: {}, qty: 1, reservedAt: '', expiresAt: '', expired: false, ...line }] : [],
    reserved: {},
    stock: {},
  }
}

function wrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('Part G builder session persist', () => {
  beforeEach(() => {
    sessionStorage.clear()
    useConfigStore.setState({
      config: {},
      couponCode: '',
      editingLineId: null,
      expiredEditBanner: false,
    })
    mockUseCart.mockReturnValue({
      data: cartWithLine(null),
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
      fetchStatus: 'idle',
    } as ReturnType<typeof useCart>)
  })

  it('sanitizes unknown option ids after menu load', async () => {
    const withFake = { ...sanitizeConfigForMenu(menu, {}), toast: 1, notOnMenu: 3 }
    sessionStorage.setItem(
      BUILDER_SESSION_STORAGE_KEY,
      JSON.stringify({
        state: {
          config: withFake,
          couponCode: 'SAVE10',
          editingLineId: null,
        },
        version: 0,
      }),
    )
    await useConfigStore.persist.rehydrate()

    const client = new QueryClient()
    render(<BuilderSessionSync />, { wrapper: wrapper(client) })

    await waitFor(() => {
      const { config, couponCode } = useConfigStore.getState()
      expect(config.toast).toBe(1)
      expect('notOnMenu' in config).toBe(false)
      expect(couponCode).toBe('SAVE10')
    })
  })

  it('clears editing when line is missing but keeps config', async () => {
    sessionStorage.setItem(
      BUILDER_SESSION_STORAGE_KEY,
      JSON.stringify({
        state: {
          config: sanitizeConfigForMenu(menu, { toast: 2, sausage: 1 }),
          couponCode: '',
          editingLineId: 'gone-line',
        },
        version: 0,
      }),
    )
    await useConfigStore.persist.rehydrate()

    const client = new QueryClient()
    render(<BuilderSessionSync />, { wrapper: wrapper(client) })

    await waitFor(() => {
      expect(useConfigStore.getState().editingLineId).toBeNull()
      expect(useConfigStore.getState().config.toast).toBe(2)
    })
  })

  it('exits edit and shows banner when restored line is expired', async () => {
    sessionStorage.setItem(
      BUILDER_SESSION_STORAGE_KEY,
      JSON.stringify({
        state: {
          config: sanitizeConfigForMenu(menu, { scrambled: 2 }),
          couponCode: '',
          editingLineId: 'line-1',
        },
        version: 0,
      }),
    )
    await useConfigStore.persist.rehydrate()

    mockUseCart.mockReturnValue({
      data: cartWithLine({ id: 'line-1', expired: true }),
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
      fetchStatus: 'idle',
    } as ReturnType<typeof useCart>)

    const client = new QueryClient()
    render(<BuilderSessionSync />, { wrapper: wrapper(client) })

    await waitFor(() => {
      expect(useConfigStore.getState().editingLineId).toBeNull()
      expect(useConfigStore.getState().expiredEditBanner).toBe(true)
      expect(useConfigStore.getState().config.scrambled).toBe(2)
    })
  })
})