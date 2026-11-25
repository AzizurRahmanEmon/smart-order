import { describe, expect, it } from 'vitest'

import menuFixture from '@/mocks/fixtures/menu.json'
import type { Config, IngredientId, Menu } from '@/types/menu'

import {
  available,
  checkAdd,
  checkEdit,
  maxAddable,
  mergeReserved,
  usage,
} from './stock'

const menu = menuFixture as Menu

function buildConfig(picks: Partial<Config>): Config {
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

const configB = buildConfig({
  croissant: 1,
  omelette: 2,
  fried: 2,
  sausage: 1,
  bacon: 1,
  hashbrown: 1,
  mushroom: 1,
  hollandaise: 1,
})

const configC = buildConfig({
  paratha: 1,
  fried: 2,
  tofu: 1,
  cheese: 2,
  beans: 1,
  mushroom: 1,
  chili: 1,
})

function reservedAfterBC(): Record<IngredientId, number> {
  return mergeReserved(
    usage(menu, configB, 1),
    usage(menu, configC, 2),
  )
}

describe('usage', () => {
  it('omelette uses 2 eggs per unit, fried uses 1', () => {
    const u = usage(
      menu,
      buildConfig({ omelette: 1, fried: 1 }),
      1,
    )
    expect(u.egg).toBe(3)
  })

  it('qty multiplies line consumption', () => {
    const one = usage(menu, configC, 1)
    const two = usage(menu, configC, 2)
    expect(two.egg).toBe((one.egg ?? 0) * 2)
    expect(two.cheese).toBe((one.cheese ?? 0) * 2)
  })

  it('unlimited sauce options contribute no ingredient usage', () => {
    const u = usage(menu, buildConfig({ ketchup: 1, chili: 1 }), 1)
    const keys = Object.keys(u)
    expect(keys.length).toBe(0)
  })
})

describe('available', () => {
  it('TC-08: after B×1 and C×2, egg and cheese are 0, croissant is 1', () => {
    const reserved = reservedAfterBC()
    const left = available(menu, reserved)
    expect(left.egg).toBe(0)
    expect(left.cheese).toBe(0)
    expect(left.croissant).toBe(1)
  })
})

describe('checkAdd', () => {
  it('unlimited sauce never blocks add', () => {
    const v = checkAdd(menu, {}, buildConfig({ ketchup: 1 }), 1)
    expect(v).toEqual([])
  })

  it('TC-08: new item needing eggs is blocked with short egg', () => {
    const reserved = reservedAfterBC()
    const v = checkAdd(
      menu,
      reserved,
      buildConfig({ toast: 1, sausage: 1, fried: 2 }),
      1,
    )
    expect(v.some((x) => x.ingredientId === 'egg')).toBe(true)
    expect(v.find((x) => x.ingredientId === 'egg')?.message).toMatch(/Short:.*egg/i)
  })
})

describe('checkEdit', () => {
  it('TC-09: edit B to Omelette ×3 + Fried ×1 is blocked — Short: 1 egg', () => {
    const reserved = reservedAfterBC()
    const newB = buildConfig({
      croissant: 1,
      omelette: 3,
      fried: 1,
      sausage: 1,
      bacon: 1,
      hashbrown: 1,
      mushroom: 1,
      hollandaise: 1,
    })
    const v = checkEdit(menu, reserved, configB, 1, newB, 1)
    expect(v).toHaveLength(1)
    expect(v[0]?.ingredientId).toBe('egg')
    expect(v[0]?.message).toBe('Short: 1 egg')
  })

  it('TC-10: edit B to Omelette ×1 + Fried ×3 is allowed (negative egg delta)', () => {
    const reserved = reservedAfterBC()
    const newB = buildConfig({
      croissant: 1,
      omelette: 1,
      fried: 3,
      sausage: 1,
      bacon: 1,
      hashbrown: 1,
      mushroom: 1,
      hollandaise: 1,
    })
    expect(checkEdit(menu, reserved, configB, 1, newB, 1)).toEqual([])
  })

  it('TC-11: increasing C from qty 2 to 3 lists egg and cheese shortages', () => {
    const reserved = reservedAfterBC()
    const v = checkEdit(menu, reserved, configC, 2, configC, 3)
    const ids = v.map((x) => x.ingredientId).sort()
    expect(ids).toEqual(['cheese', 'egg'])
    expect(v[0]?.message).toBe('Short: 2 egg, 2 cheese')
  })

  it('edit that reduces usage passes even when available is 0', () => {
    const reserved = reservedAfterBC()
    const lighter = buildConfig({
      croissant: 1,
      fried: 2,
      sausage: 1,
      bacon: 1,
      hashbrown: 1,
      mushroom: 1,
      hollandaise: 1,
    })
    expect(checkEdit(menu, reserved, configB, 1, lighter, 1)).toEqual([])
  })

  it('swap sausage to bacon only charges bacon delta', () => {
    const base = buildConfig({ toast: 1, sausage: 1, scrambled: 1, fried: 1 })
    const reserved = usage(menu, base, 1)
    const swapped = buildConfig({ toast: 1, bacon: 1, scrambled: 1, fried: 1 })
    const v = checkEdit(menu, reserved, base, 1, swapped, 1)
    expect(v.some((x) => x.ingredientId === 'sausage')).toBe(false)
    expect(v).toEqual([])
  })
})

describe('maxAddable', () => {
  it('respects shared egg pool across options', () => {
    const reserved: Record<IngredientId, number> = {}
    const config = buildConfig({})
    const addable = maxAddable(menu, reserved, 'omelette', config)
    expect(addable).toBe(5)
  })

  it('returns unlimited for sauce without uses', () => {
    expect(maxAddable(menu, {}, 'ketchup', buildConfig({}))).toBe(Number.POSITIVE_INFINITY)
  })
})