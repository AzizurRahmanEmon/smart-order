import { MOCK_SERVER_STORAGE_KEY as STORAGE_KEY } from '@/lib/mockServerStorage'
import menuFixture from '@/mocks/fixtures/menu.json'
import { priceCart } from '@/engine/pricing'
import { checkAdd, mergeReserved, usage } from '@/engine/stock'
import { validate } from '@/engine/validate'
import type { Config, IngredientId, Menu } from '@/types/menu'
import type { AddCartResponse, CartLineDto, CartResponse } from '@/types/api'
import type { ApiErrorBody } from '@/types/api'

import {
  buildSeedOrders,
  ORDERS_EXPORT_META,
  type PaymentMethod,
  type StoredOrder,
} from './ordersSeed'

const MENU = menuFixture as Menu
export { STORAGE_KEY }
const RESERVATION_MS = 5 * 60 * 1000
const SERVER_AHEAD_MS = 90_000

export type StoredCartLine = {
  id: string
  config: Config
  qty: number
  reservedAtMs: number
  expiresAtMs: number
}

type PersistedState = {
  cartLines: StoredCartLine[]
  cartVersion: number
  idempotency: Record<string, { status: number; body: unknown }>
  inventory: Record<IngredientId, number>
  orders: StoredOrder[]
  ordersInitialized: boolean
}

let cartLines: StoredCartLine[] = []
let cartVersion = 1
let idempotency: PersistedState['idempotency'] = {}
let inventory: Record<IngredientId, number> = {}
let orders: StoredOrder[] = []
let ordersInitialized = false

function defaultInventory(): Record<IngredientId, number> {
  const stock: Record<IngredientId, number> = {}
  for (const ing of MENU.ingredients) {
    stock[ing.id] = ing.stock
  }
  return stock
}

function menuWithInventory(): Menu {
  return {
    ...MENU,
    ingredients: MENU.ingredients.map((ing) => ({
      ...ing,
      stock: inventory[ing.id] ?? ing.stock,
    })),
  }
}

function ensureOrdersSeed(): void {
  if (ordersInitialized) return
  orders = buildSeedOrders(MENU)
  ordersInitialized = true
  persist()
}

function loadPersisted(): void {
  if (typeof localStorage === 'undefined') {
    inventory = defaultInventory()
    ensureOrdersSeed()
    return
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      inventory = defaultInventory()
      ensureOrdersSeed()
      return
    }
    const parsed = JSON.parse(raw) as PersistedState
    cartLines = parsed.cartLines ?? []
    cartVersion = parsed.cartVersion ?? 1
    pruneExpiredLinesOnBootstrap()
    idempotency = parsed.idempotency ?? {}
    inventory = parsed.inventory ?? defaultInventory()
    orders = parsed.orders ?? []
    ordersInitialized = parsed.ordersInitialized ?? false
    if (!ordersInitialized || orders.length === 0) {
      ensureOrdersSeed()
    }
  } catch {
    cartLines = []
    idempotency = {}
    inventory = defaultInventory()
    orders = []
    ordersInitialized = false
    ensureOrdersSeed()
  }
}

function persist(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      cartLines,
      cartVersion,
      idempotency,
      inventory,
      orders,
      ordersInitialized,
    } satisfies PersistedState),
  )
}

loadPersisted()

export function getMenu(): Menu {
  return MENU
}

export function getStockMenu(): Menu {
  return menuWithInventory()
}

export function getServerNowMs(): number {
  return Date.now() + SERVER_AHEAD_MS
}

export function getServerTimeIso(): string {
  return new Date(getServerNowMs()).toISOString()
}

export function getCatalogStock(): Record<IngredientId, number> {
  return { ...inventory }
}

function activeLines(nowMs: number): StoredCartLine[] {
  return cartLines.filter((l) => l.expiresAtMs > nowMs)
}

export function expireLazy(): void {
  // Reserved is derived from non-expired lines at read time (no engine change).
}

/** Drop expired lines from persisted cart on cold load / refresh bootstrap only. */
function pruneExpiredLinesOnBootstrap(): void {
  const now = getServerNowMs()
  cartLines = cartLines.filter((l) => l.expiresAtMs > now)
}

export function getCartVersion(): number {
  return cartVersion
}

export function bumpCartVersion(): number {
  cartVersion += 1
  return cartVersion
}

export function matchCartVersion(
  ifMatch: string | null,
): ApiErrorBody | null {
  if (ifMatch === null) {
    return {
      code: 'cart_conflict',
      message: 'Cart version required',
      currentVersion: cartVersion,
    }
  }
  const parsed = Number.parseInt(ifMatch, 10)
  if (!Number.isFinite(parsed) || parsed !== cartVersion) {
    return {
      code: 'cart_conflict',
      message: 'Cart version mismatch',
      currentVersion: cartVersion,
    }
  }
  return null
}

export function reservedFromLines(lines: StoredCartLine[]): Record<IngredientId, number> {
  const parts = lines.map((l) => usage(MENU, l.config, l.qty))
  return mergeReserved(...parts)
}

function toDto(line: StoredCartLine, nowMs: number): CartLineDto {
  return {
    id: line.id,
    config: line.config,
    qty: line.qty,
    reservedAt: new Date(line.reservedAtMs).toISOString(),
    expiresAt: new Date(line.expiresAtMs).toISOString(),
    expired: line.expiresAtMs <= nowMs,
  }
}

export function buildCartResponse(): CartResponse {
  expireLazy()
  const now = getServerNowMs()
  const active = activeLines(now)
  return {
    serverTime: new Date(now).toISOString(),
    version: cartVersion,
    lines: cartLines.map((l) => toDto(l, now)),
    reserved: reservedFromLines(active),
    stock: getCatalogStock(),
  }
}

export function getIdempotency(key: string): { status: number; body: unknown } | undefined {
  return idempotency[key]
}

export function setIdempotency(key: string, status: number, body: unknown): void {
  idempotency[key] = { status, body }
  persist()
}

export function addCartLine(
  config: Config,
  qty: number,
): { line: StoredCartLine } {
  const now = getServerNowMs()
  const line: StoredCartLine = {
    id: crypto.randomUUID(),
    config,
    qty,
    reservedAtMs: now,
    expiresAtMs: now + RESERVATION_MS,
  }
  cartLines.push(line)
  bumpCartVersion()
  persist()
  return { line }
}

export function getLine(lineId: string): StoredCartLine | undefined {
  return cartLines.find((l) => l.id === lineId)
}

export function updateCartLine(
  lineId: string,
  config: Config,
  qty: number,
): StoredCartLine | undefined {
  const line = cartLines.find((l) => l.id === lineId)
  if (!line) return undefined
  line.config = config
  line.qty = qty
  bumpCartVersion()
  persist()
  return line
}

export function removeCartLine(lineId: string): boolean {
  const idx = cartLines.findIndex((l) => l.id === lineId)
  if (idx < 0) return false
  cartLines.splice(idx, 1)
  bumpCartVersion()
  persist()
  return true
}

export function buildAddResponse(lineId: string): AddCartResponse {
  const base = buildCartResponse()
  return { ...base, lineId }
}

export type CheckoutSuccess = {
  ok: true
  order: StoredOrder
  cart: CartResponse
}

export type CheckoutFailure = {
  ok: false
  status: number
  body: ApiErrorBody
}

export function checkoutCart(
  paymentMethod: PaymentMethod,
  coupon: string | undefined,
  options?: { mockFailAfterValidate?: boolean },
): CheckoutSuccess | CheckoutFailure {
  ensureOrdersSeed()
  expireLazy()
  const nowMs = getServerNowMs()
  const menu = menuWithInventory()

  const expiredPresent = cartLines.some((l) => l.expiresAtMs <= nowMs)
  if (expiredPresent) {
    return {
      ok: false,
      status: 409,
      body: {
        code: 'expired_cart_lines',
        message: 'Remove expired reservations before checkout',
      },
    }
  }

  const active = activeLines(nowMs)
  if (active.length === 0) {
    return {
      ok: false,
      status: 422,
      body: {
        code: 'empty_cart',
        message: 'Cart is empty',
      },
    }
  }

  for (const line of active) {
    const violations = validate(menu, line.config)
    if (violations.length > 0) {
      return {
        ok: false,
        status: 422,
        body: {
          code: 'validation_failed',
          message: 'Cart contains invalid configuration',
          details: violations,
        },
      }
    }
  }

  const totalUsage = reservedFromLines(active)
  for (const ing of MENU.ingredients) {
    const need = totalUsage[ing.id] ?? 0
    if (need <= 0) continue
    const left = inventory[ing.id] ?? 0
    if (need > left) {
      return {
        ok: false,
        status: 409,
        body: {
          code: 'insufficient_stock',
          message: `Insufficient stock for checkout (${ing.name})`,
        },
      }
    }
  }

  const reserved = reservedFromLines(
    active.slice(0, Math.max(0, active.length - 1)),
  )
  for (const line of active) {
    const issues = checkAdd(menu, reserved, line.config, line.qty)
    if (issues.length > 0) {
      return {
        ok: false,
        status: 409,
        body: {
          code: 'insufficient_stock',
          message: issues[0]?.message ?? 'Insufficient stock',
          details: issues,
        },
      }
    }
    const part = usage(MENU, line.config, line.qty)
    for (const [id, amount] of Object.entries(part)) {
      reserved[id] = (reserved[id] ?? 0) + amount
    }
  }

  const lineInputs = active.map((l) => ({ config: l.config, qty: l.qty }))
  const priced = priceCart(MENU, lineInputs, {
    coupon,
    now: new Date(nowMs),
  })

  if (options?.mockFailAfterValidate) {
    return {
      ok: false,
      status: 500,
      body: {
        code: 'checkout_failed',
        message: 'Simulated checkout failure',
      },
    }
  }

  for (const [id, amount] of Object.entries(totalUsage)) {
    inventory[id] = (inventory[id] ?? 0) - amount
  }

  const order: StoredOrder = {
    id: `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date(nowMs).toISOString(),
    paymentMethod,
    couponCode: coupon?.trim() ? coupon.trim() : null,
    lines: lineInputs.map((l) => ({ qty: l.qty, config: { ...l.config } })),
    totals: priced,
  }

  orders = [order, ...orders]
  cartLines = []
  bumpCartVersion()
  persist()

  return {
    ok: true,
    order,
    cart: buildCartResponse(),
  }
}

export function getOrdersNewestFirst(): StoredOrder[] {
  ensureOrdersSeed()
  return [...orders]
}

export function getOrdersExport(): {
  schemaVersion: number
  currency: string
  orders: StoredOrder[]
} {
  ensureOrdersSeed()
  return {
    ...ORDERS_EXPORT_META,
    orders: [...orders],
  }
}

/** Test-only: reset in-memory state */
export function resetMockServerState(): void {
  cartLines = []
  cartVersion = 1
  idempotency = {}
  inventory = defaultInventory()
  orders = []
  ordersInitialized = false
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function reloadPersistedStateForTest(): void {
  cartLines = []
  cartVersion = 1
  idempotency = {}
  inventory = {}
  orders = []
  ordersInitialized = false
  loadPersisted()
}

/** Test-only: force inventory without checkout */
export function setInventoryForTest(
  levels: Partial<Record<IngredientId, number>>,
): void {
  for (const [id, level] of Object.entries(levels)) {
    if (level !== undefined) {
      inventory[id as IngredientId] = level
    }
  }
  persist()
}

export function getActiveLines(): StoredCartLine[] {
  expireLazy()
  return activeLines(getServerNowMs())
}

export function reservedExcludingLine(lineId: string): Record<IngredientId, number> {
  const active = getActiveLines().filter((l) => l.id !== lineId)
  return reservedFromLines(active)
}

export function reservedAll(): Record<IngredientId, number> {
  return reservedFromLines(getActiveLines())
}

/** Test-only: seed persisted cart lines then run bootstrap reload. */
export function seedCartLinesForTest(lines: StoredCartLine[], version = 1): void {
  cartLines = lines
  cartVersion = version
  persist()
}