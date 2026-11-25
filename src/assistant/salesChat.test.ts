import { describe, expect, it, vi } from 'vitest'

import menuFixture from '@/mocks/fixtures/menu.json'
import { buildSeedOrders } from '@/mocks/ordersSeed'
import { orderCount } from '@/engine/stats'
import type { Menu } from '@/types/menu'

import {
  runSalesChatTurn,
  type GeminiChatClient,
} from './salesChat'

const menu = menuFixture as Menu

describe('sales chat tool loop', () => {
  it('TC-18 style: order_count tool then final text uses current orders', async () => {
    const orders = buildSeedOrders(menu)
    const client: GeminiChatClient = {
      generate: vi
        .fn()
        .mockResolvedValueOnce({
          functionCalls: [{ name: 'order_count', args: {} }],
        })
        .mockResolvedValueOnce({
          text: `There are ${orderCount(orders)} orders in the system.`,
        }),
    }

    const result = await runSalesChatTurn(client, orders, 'How many orders?', [])
    expect(result.toolsCalled).toEqual(['order_count'])
    expect(result.text).toContain(String(orderCount(orders)))
    expect(client.generate).toHaveBeenCalledTimes(2)
  })

  it('TC-20 style: best_customer_check can be returned via tools', async () => {
    const orders = buildSeedOrders(menu)
    const client: GeminiChatClient = {
      generate: vi
        .fn()
        .mockResolvedValueOnce({
          functionCalls: [{ name: 'best_customer_check', args: {} }],
        })
        .mockResolvedValueOnce({
          text: 'We do not store customer names, so I cannot name a best customer.',
        }),
    }

    const result = await runSalesChatTurn(
      client,
      orders,
      'Who is our best customer?',
      [],
    )
    expect(result.toolsCalled).toContain('best_customer_check')
    expect(result.text.toLowerCase()).toMatch(/customer/)
  })
})