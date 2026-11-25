import menuFixture from '@/mocks/fixtures/menu.json'
import { mergeReserved, usage } from '@/engine/stock'
import type { Config, IngredientId, Menu } from '@/types/menu'
import type { AddCartResponse, CartLineDto, CartResponse } from '@/types/api'

const MENU = menuFixture as Menu
const STORAGE_KEY = 'smart-order-mock-v1'
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
  idempotency: Record<string, { status: number; body: unknown }>
}

let cartLines: StoredCartLine[] = []
let idempotency: PersistedState['idempotency'] = {}

function loadPersisted(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as PersistedState
    cartLines = parsed.cartLines ?? []
    idempotency = parsed.idempotency ?? {}
  } catch {
    cartLines = []
    idempotency = {}
  }
}

function persist(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ cartLines, idempotency } satisfies PersistedState),
  )
}

loadPersisted()

export function getMenu(): Menu {
  return MENU
}

export function getServerNowMs(): number {
  return Date.now() + SERVER_AHEAD_MS
}

export function getServerTimeIso(): string {
  return new Date(getServerNowMs()).toISOString()
}

export function getCatalogStock(): Record<IngredientId, number> {
  const stock: Record<IngredientId, number> = {}
  for (const ing of MENU.ingredients) {
    stock[ing.id] = ing.stock
  }
  return stock
}

function activeLines(nowMs: number): StoredCartLine[] {
  return cartLines.filter((l) => l.expiresAtMs > nowMs)
}

/** Release holds in stock accounting only; lines stay until DELETE (TC-15 UI). */
export function expireLazy(): void {
  // Reserved is derived from non-expired lines at read time — no side effects.
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
  persist()
  return line
}

export function removeCartLine(lineId: string): boolean {
  const idx = cartLines.findIndex((l) => l.id === lineId)
  if (idx < 0) return false
  cartLines.splice(idx, 1)
  persist()
  return true
}

export function buildAddResponse(lineId: string): AddCartResponse {
  const base = buildCartResponse()
  return { ...base, lineId }
}

/** Test-only: reset in-memory state */
export function resetMockServerState(): void {
  cartLines = []
  idempotency = {}
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
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