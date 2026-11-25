import { http, HttpResponse } from 'msw'

import { priceCart } from '@/engine/pricing'
import { checkAdd, checkEdit } from '@/engine/stock'
import { validate } from '@/engine/validate'
import type { Config } from '@/types/menu'
import type { ApiErrorBody } from '@/types/api'

import {
  addCartLine,
  buildAddResponse,
  buildCartResponse,
  getIdempotency,
  getLine,
  getMenu,
  getServerNowMs,
  getServerTimeIso,
  removeCartLine,
  reservedAll,
  setIdempotency,
  updateCartLine,
} from './serverState'

function latencyMs(): number {
  return 200 + Math.floor(Math.random() * 1_301)
}

async function delay(): Promise<void> {
  await new Promise((r) => setTimeout(r, latencyMs()))
}

function jsonError(status: number, body: ApiErrorBody) {
  return HttpResponse.json(body, { status })
}

function clampQty(qty: unknown): number {
  const n = typeof qty === 'number' ? qty : 1
  return Math.min(3, Math.max(1, Math.floor(n)))
}

export const handlers = [
  http.get('/api/menu', async () => {
    await delay()
    return HttpResponse.json(getMenu())
  }),

  http.get('/api/time', async () => {
    await delay()
    return HttpResponse.json({ serverTime: getServerTimeIso() })
  }),

  http.get('/api/cart', async () => {
    await delay()
    return HttpResponse.json(buildCartResponse())
  }),

  http.post('/api/cart', async ({ request }) => {
    await delay()

    const idempotencyKey = request.headers.get('Idempotency-Key')
    if (!idempotencyKey) {
      return jsonError(400, {
        code: 'missing_idempotency_key',
        message: 'Idempotency-Key header required',
      })
    }

    const cached = getIdempotency(idempotencyKey)
    if (cached) {
      return HttpResponse.json(cached.body as Record<string, unknown>, {
        status: cached.status,
      })
    }

    if (request.headers.get('X-Mock-Fail') === 'reserve') {
      return jsonError(500, {
        code: 'reserve_failed',
        message: 'Simulated reserve failure',
      })
    }

    const body = (await request.json()) as { config: Config; qty?: number }
    const config = body.config ?? {}
    const qty = clampQty(body.qty)
    const menu = getMenu()

    const violations = validate(menu, config)
    if (violations.length > 0) {
      const err = jsonError(422, {
        code: 'validation_failed',
        message: 'Configuration invalid',
        details: violations,
      })
      return err
    }

    const reserved = reservedAll()
    const stockIssues = checkAdd(menu, reserved, config, qty)
    if (stockIssues.length > 0) {
      return jsonError(409, {
        code: 'insufficient_stock',
        message: stockIssues[0]?.message ?? 'Insufficient stock',
        details: stockIssues,
      })
    }

    const { line } = addCartLine(config, qty)
    const response = buildAddResponse(line.id)
    setIdempotency(idempotencyKey, 201, response)
    return HttpResponse.json(response, { status: 201 })
  }),

  http.put('/api/cart/:lineId', async ({ params, request }) => {
    await delay()
    const lineId = params.lineId as string
    const line = getLine(lineId)
    if (!line) {
      return jsonError(404, { code: 'not_found', message: 'Cart line not found' })
    }
    if (line.expiresAtMs <= getServerNowMs()) {
      return jsonError(409, {
        code: 'reservation_expired',
        message: 'Reservation expired; remove this item to continue',
      })
    }

    const body = (await request.json()) as { config: Config; qty?: number }
    const newConfig = body.config ?? {}
    const newQty = clampQty(body.qty ?? line.qty)
    const menu = getMenu()

    const violations = validate(menu, newConfig)
    if (violations.length > 0) {
      return jsonError(422, {
        code: 'validation_failed',
        message: 'Configuration invalid',
        details: violations,
      })
    }

    const reservedWithOld = reservedAll()
    const stockIssues = checkEdit(
      menu,
      reservedWithOld,
      line.config,
      line.qty,
      newConfig,
      newQty,
    )
    if (stockIssues.length > 0) {
      return jsonError(409, {
        code: 'insufficient_stock',
        message: stockIssues[0]?.message ?? 'Insufficient stock',
        details: stockIssues,
      })
    }

    updateCartLine(lineId, newConfig, newQty)
    return HttpResponse.json(buildCartResponse())
  }),

  http.delete('/api/cart/:lineId', async ({ params }) => {
    await delay()
    const lineId = params.lineId as string
    if (!removeCartLine(lineId)) {
      return jsonError(404, { code: 'not_found', message: 'Cart line not found' })
    }
    return HttpResponse.json(buildCartResponse())
  }),

  http.post('/api/price', async ({ request }) => {
    await delay()
    if (Math.random() < 0.15) {
      return jsonError(503, {
        code: 'price_unavailable',
        message: 'Price temporarily unavailable',
      })
    }

    const body = (await request.json()) as {
      config: Config
      qty?: number
      coupon?: string
    }
    const menu = getMenu()
    const config = body.config ?? {}
    const qty = clampQty(body.qty)
    const coupon = body.coupon
    const now = new Date(getServerTimeIso())

    const priced = priceCart(menu, [{ config, qty }], {
      coupon,
      now,
    })

    return HttpResponse.json({
      ...priced,
      serverTime: getServerTimeIso(),
    })
  }),
]