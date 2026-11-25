import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import menuFixture from '@/mocks/fixtures/menu.json'
import {
  EXPIRED_RESERVATION_BANNER,
  useConfigStore,
} from '@/store/configStore'
import type { CartResponse } from '@/types/api'
import type { Config, Menu } from '@/types/menu'

import { Builder } from './Builder'

const menu = menuFixture as Menu

vi.mock('@/hooks/useMenu', () => ({
  useMenu: () => ({ data: menu, isLoading: false }),
}))

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(),
  useAddToCart: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateCartLine: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

import { useCart } from '@/hooks/useCart'

const mockUseCart = vi.mocked(useCart)

const editConfig: Config = {
  toast: 1,
  scrambled: 2,
  fried: 0,
  sausage: 1,
}

function baseCart(overrides: Partial<CartResponse['lines'][0]>): CartResponse {
  return {
    serverTime: new Date().toISOString(),
    version: 1,
    lines: [
      {
        id: 'line-edit-1',
        config: { toast: 1, scrambled: 1, fried: 1, sausage: 1 },
        qty: 1,
        reservedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        expired: false,
        ...overrides,
      },
    ],
    reserved: {},
    stock: {},
  }
}

function wrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('D3 expired reservation during edit', () => {
  beforeEach(() => {
    useConfigStore.setState({
      config: { ...editConfig },
      editingLineId: 'line-edit-1',
      expiredEditBanner: false,
      couponCode: '',
    })
    mockUseCart.mockReturnValue({
      data: baseCart({ id: 'line-edit-1', expired: false }),
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
      fetchStatus: 'idle',
    } as ReturnType<typeof useCart>)
  })

  it('exits edit mode, keeps config, and shows banner when the line expires', async () => {
    const client = new QueryClient()
    const { rerender } = render(<Builder />, { wrapper: wrapper(client) })

    expect(screen.getByRole('heading', { name: /edit plate/i })).toBeInTheDocument()

    mockUseCart.mockReturnValue({
      data: baseCart({ id: 'line-edit-1', expired: true }),
      isLoading: false,
      isError: false,
      error: null,
      status: 'success',
      fetchStatus: 'idle',
    } as ReturnType<typeof useCart>)

    rerender(<Builder />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        EXPIRED_RESERVATION_BANNER,
      )
    })

    expect(
      screen.getByRole('heading', { name: /build your plate/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /add to cart/i }),
    ).toBeInTheDocument()
    expect(useConfigStore.getState().editingLineId).toBeNull()
    expect(useConfigStore.getState().config).toMatchObject(editConfig)
  })
})