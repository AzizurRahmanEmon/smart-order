import type { Config, Menu } from '@/types/menu'

export function buildConfig(menu: Menu, picks: Partial<Config>): Config {
  const config: Config = {}
  for (const group of menu.groups) {
    for (const option of group.options) {
      config[option.id] = 0
    }
  }
  for (const [id, count] of Object.entries(picks)) {
    if (count !== undefined) {
      config[id] = count
    }
  }
  return config
}

export async function fetchCartVersion(): Promise<number> {
  const cart = await fetch('/api/cart').then((r) => r.json())
  return cart.version as number
}

export async function cartIfMatchHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  return {
    'If-Match': String(await fetchCartVersion()),
    ...extra,
  }
}

export async function cartPostHeaders(
  idempotencyKey: string,
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  return cartIfMatchHeaders({
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
    ...extra,
  })
}