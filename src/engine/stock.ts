import type {
  Config,
  Ingredient,
  IngredientId,
  Menu,
  MenuOption,
  OptionId,
} from '@/types/menu'

export type StockViolation = {
  code: 'stock.short'
  ingredientId: IngredientId
  name: string
  needed: number
  left: number
  message: string
}

function findOption(menu: Menu, optionId: OptionId): MenuOption | undefined {
  for (const group of menu.groups) {
    const option = group.options.find((o) => o.id === optionId)
    if (option) return option
  }
  return undefined
}

function ingredientById(menu: Menu): Map<IngredientId, Ingredient> {
  return new Map(menu.ingredients.map((i) => [i.id, i]))
}

export function usage(
  menu: Menu,
  config: Config,
  qty = 1,
): Record<IngredientId, number> {
  const result: Record<IngredientId, number> = {}

  for (const group of menu.groups) {
    for (const option of group.options) {
      const count = Math.max(0, config[option.id] ?? 0)
      if (count === 0) continue
      for (const [ingredientId, per] of Object.entries(option.uses)) {
        if (per <= 0) continue
        result[ingredientId] =
          (result[ingredientId] ?? 0) + per * count * qty
      }
    }
  }

  return result
}

export function mergeReserved(
  ...parts: Record<IngredientId, number>[]
): Record<IngredientId, number> {
  const result: Record<IngredientId, number> = {}
  for (const part of parts) {
    for (const [id, amount] of Object.entries(part)) {
      result[id] = (result[id] ?? 0) + amount
    }
  }
  return result
}

export function available(
  menu: Menu,
  reserved: Record<IngredientId, number>,
): Record<IngredientId, number> {
  const result: Record<IngredientId, number> = {}
  for (const ingredient of menu.ingredients) {
    result[ingredient.id] =
      ingredient.stock - (reserved[ingredient.id] ?? 0)
  }
  return result
}

function shortfallMessages(violations: StockViolation[]): StockViolation[] {
  if (violations.length <= 1) {
    return violations
  }
  const parts = violations.map((v) => `${v.needed - v.left} ${v.name}`)
  const combined = `Short: ${parts.join(', ')}`
  return violations.map((v) => ({ ...v, message: combined }))
}

function buildStockViolations(
  menu: Menu,
  shortages: { ingredientId: IngredientId; short: number; left: number; need: number }[],
): StockViolation[] {
  const names = ingredientById(menu)
  const violations: StockViolation[] = shortages.map((s) => {
    const ing = names.get(s.ingredientId)
    const name = ing?.name ?? s.ingredientId
    return {
      code: 'stock.short' as const,
      ingredientId: s.ingredientId,
      name,
      needed: s.need,
      left: s.left,
      message: `Short: ${s.short} ${name}`,
    }
  })
  return shortfallMessages(violations)
}

export function checkAdd(
  menu: Menu,
  reserved: Record<IngredientId, number>,
  config: Config,
  qty: number,
): StockViolation[] {
  const need = usage(menu, config, qty)
  const left = available(menu, reserved)
  const shortages: {
    ingredientId: IngredientId
    short: number
    left: number
    need: number
  }[] = []

  for (const ingredient of menu.ingredients) {
    const required = need[ingredient.id] ?? 0
    if (required <= 0) continue
    const remaining = left[ingredient.id] ?? 0
    if (required > remaining) {
      shortages.push({
        ingredientId: ingredient.id,
        short: required - remaining,
        left: remaining,
        need: required,
      })
    }
  }

  return buildStockViolations(menu, shortages)
}

export function checkEdit(
  menu: Menu,
  reserved: Record<IngredientId, number>,
  oldConfig: Config,
  oldQty: number,
  newConfig: Config,
  newQty: number,
): StockViolation[] {
  const oldUsage = usage(menu, oldConfig, oldQty)
  const newUsage = usage(menu, newConfig, newQty)
  const left = available(menu, reserved)
  const shortages: {
    ingredientId: IngredientId
    short: number
    left: number
    need: number
  }[] = []

  for (const ingredient of menu.ingredients) {
    const delta = (newUsage[ingredient.id] ?? 0) - (oldUsage[ingredient.id] ?? 0)
    if (delta <= 0) continue
    const remaining = left[ingredient.id] ?? 0
    if (delta > remaining) {
      shortages.push({
        ingredientId: ingredient.id,
        short: delta - remaining,
        left: remaining,
        need: delta,
      })
    }
  }

  return buildStockViolations(menu, shortages)
}

export function maxAddable(
  menu: Menu,
  reserved: Record<IngredientId, number>,
  optionId: OptionId,
  config: Config,
): number {
  const option = findOption(menu, optionId)
  if (!option || Object.keys(option.uses).length === 0) {
    return Number.POSITIVE_INFINITY
  }

  const current = Math.max(0, config[optionId] ?? 0)
  const left = available(menu, reserved)
  const lineUsage = usage(menu, config, 1)

  let maxUnits = Number.POSITIVE_INFINITY
  for (const [ingredientId, perUnit] of Object.entries(option.uses)) {
    if (perUnit <= 0) continue
    const withoutThisOption =
      (lineUsage[ingredientId] ?? 0) - current * perUnit
    const room = (left[ingredientId] ?? 0) - withoutThisOption
    const cap = Math.floor(room / perUnit)
    maxUnits = Math.min(maxUnits, cap)
  }

  if (!Number.isFinite(maxUnits)) {
    return 0
  }
  return Math.max(0, maxUnits - current)
}