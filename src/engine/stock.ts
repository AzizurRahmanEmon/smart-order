import type { Ingredient, MenuOption } from '@/types/menu'

/** Units of this option addable from current ingredient stock (null = unlimited). */
export function stockLeft(
  option: MenuOption,
  ingredients: Ingredient[],
): number | null {
  const uses = option.uses
  if (Object.keys(uses).length === 0) {
    return null
  }

  const stockById = new Map(ingredients.map((i) => [i.id, i.stock]))
  let min = Number.POSITIVE_INFINITY

  for (const [ingredientId, qty] of Object.entries(uses)) {
    if (qty <= 0) continue
    const stock = stockById.get(ingredientId)
    if (stock === undefined) {
      return 0
    }
    min = Math.min(min, Math.floor(stock / qty))
  }

  return min === Number.POSITIVE_INFINITY ? 0 : min
}