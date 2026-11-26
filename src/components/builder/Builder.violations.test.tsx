import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import menuFixture from '@/mocks/fixtures/menu.json'
import { buildConfig } from '@/mocks/testHelpers'
import { useConfigStore } from '@/store/configStore'
import type { Menu } from '@/types/menu'

import { Builder } from './Builder'

const menu = menuFixture as Menu

vi.mock('@/hooks/useMenu', () => ({
  useMenu: () => ({ data: menu, isLoading: false }),
}))

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    data: { serverTime: new Date().toISOString(), version: 1, lines: [], reserved: {}, stock: {} },
    isLoading: false,
  }),
  useAddToCart: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateCartLine: () => ({ mutate: vi.fn(), isPending: false }),
}))

function wrapper(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('Builder validation UX', () => {
  beforeEach(() => {
    useConfigStore.setState({
      config: buildConfig(menu, {}),
      editingLineId: null,
      expiredEditBanner: false,
      couponCode: '',
    })
  })

  it('TC-01 UI: eggs step warning on the Eggs card and Add to Cart disabled', () => {
    useConfigStore.setState({
      config: buildConfig(menu, { toast: 1, sausage: 1, scrambled: 3 }),
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<Builder />, { wrapper: wrapper(client) })

    const eggsTitle = screen.getByText('Eggs')
    const eggsCard = eggsTitle.closest('[data-slot=card]')
    expect(eggsCard).toBeTruthy()
    const alert = within(eggsCard as HTMLElement).getByRole('alert')
    expect(alert.textContent).toMatch(/steps of 2/i)

    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled()
  })
})