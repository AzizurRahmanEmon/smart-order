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
  checkoutCart,
  getIdempotency,
  getLine,
  getMenu,
  getOrdersExport,
  getOrdersNewestFirst,
  getServerNowMs,
  getServerTimeIso,
  getStockMenu,
  matchCartVersion,
  removeCartLine,
  reservedAll,
  setIdempotency,
  updateCartLine,
} from './serverState'
import type { PaymentMethod } from './ordersSeed'

function latencyMs(): number {
  if (import.meta.env.MODE === 'test') return 0
  return 200 + Math.floor(Math.random() * 1_301)
}

async function delay(): Promise<void> {
  await new Promise((r) => setTimeout(r, latencyMs()))
}

/** Brief latency + 15% failure apply only to live price preview (TC-12). */
async function pricePreviewDelay(): Promise<void> {
  await delay()
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
    return HttpResponse.json({
      ...getMenu(),
      serverTime: getServerTimeIso(),
    })
  }),

  http.get('/api/time', async () => {
    return HttpResponse.json({ serverTime: getServerTimeIso() })
  }),

  http.get('/api/cart', async () => {
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

    const versionErr = matchCartVersion(request.headers.get('If-Match'))
    if (versionErr) {
      return jsonError(409, versionErr)
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
    const menu = getStockMenu()

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
    const versionErr = matchCartVersion(request.headers.get('If-Match'))
    if (versionErr) {
      return jsonError(409, versionErr)
    }
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
    const menu = getStockMenu()

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

  http.delete('/api/cart/:lineId', async ({ params, request }) => {
    await delay()
    const versionErr = matchCartVersion(request.headers.get('If-Match'))
    if (versionErr) {
      return jsonError(409, versionErr)
    }
    const lineId = params.lineId as string
    if (!removeCartLine(lineId)) {
      return jsonError(404, { code: 'not_found', message: 'Cart line not found' })
    }
    return HttpResponse.json(buildCartResponse())
  }),

  http.post('/api/price', async ({ request }) => {
    await pricePreviewDelay()
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

  http.get('/api/orders', async () => {
    await delay()
    return HttpResponse.json(getOrdersNewestFirst())
  }),

  http.get('/api/orders/export', async () => {
    await delay()
    return HttpResponse.json(getOrdersExport())
  }),

  http.post('/api/checkout', async ({ request }) => {
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

    const versionErr = matchCartVersion(request.headers.get('If-Match'))
    if (versionErr) {
      return jsonError(409, versionErr)
    }

    const body = (await request.json()) as {
      paymentMethod?: PaymentMethod
      coupon?: string
    }
    const paymentMethod = body.paymentMethod ?? 'card'
    if (!['card', 'bkash', 'cash'].includes(paymentMethod)) {
      return jsonError(422, {
        code: 'invalid_payment_method',
        message: 'Payment method must be card, bkash, or cash',
      })
    }

    const mockFail = request.headers.get('X-Mock-Fail') === 'checkout'
    const result = checkoutCart(paymentMethod, body.coupon, {
      mockFailAfterValidate: mockFail,
    })

    if (!result.ok) {
      const err = jsonError(result.status, result.body)
      return err
    }

    const response = {
      order: result.order,
      cart: result.cart,
    }
    setIdempotency(idempotencyKey, 201, response)
    return HttpResponse.json(response, { status: 201 })
  }),
]