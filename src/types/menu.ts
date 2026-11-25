export type OptionId = string
export type GroupId = string
export type IngredientId = string
export type Poisha = number // integer, 1 BDT = 100

export interface MenuOption {
  id: OptionId
  name: string
  price: Poisha
  uses: Record<IngredientId, number> // {} = unlimited (no stock)
}

export interface Group {
  id: GroupId
  name: string
  min: number
  max?: number
  step?: number
  maxDistinct?: number
  maxPerOption?: number
  options: MenuOption[]
}

export type Rule =
  | { id: string; type: 'requires'; option: OptionId; anyOf: OptionId[] }
  | { id: string; type: 'excludes'; option: OptionId; noneOf: OptionId[] }
  | {
      id: string
      type: 'overrideLimit'
      option: OptionId
      group: GroupId
      max: number
    }

export interface Ingredient {
  id: IngredientId
  name: string
  stock: number
}

export type Promotion =
  | { id: string; type: 'extrasDeal'; group: GroupId; every: number }
  | {
      id: string
      type: 'combo'
      conditions: { group: GroupId; min: number }[]
      percent: number
    }
  | { id: string; type: 'cartFixed'; minSubtotal: Poisha; amount: Poisha }
  | {
      id: string
      type: 'coupon'
      code: string
      percent: number
      cap: Poisha
      validBefore: string
      timeZone: string
    }

export interface Menu {
  product: { id: string; name: string; basePrice: Poisha }
  groups: Group[]
  rules: Rule[]
  ingredients: Ingredient[]
  promotions: Promotion[]
  vatPercent: number
}

export type Config = Record<OptionId, number>
