import { describe, expect, it } from 'vitest'

import { checkAdd, mergeReserved, usage } from '@/engine/stock'
import { validate } from '@/engine/validate'
import menuFixture from '@/mocks/fixtures/menu.json'
import { buildConfig } from '@/mocks/testHelpers'
import type { Menu } from '@/types/menu'

import { indexGroupViolations, optionViolations } from './groupViolations'

const menu = menuFixture as Menu

describe('indexGroupViolations', () => {
  it('TC-01: maps egg step violation to the eggs group card', () => {
    const config = buildConfig(menu, {
      toast: 1,
      sausage: 1,
      scrambled: 3,
    })
    const rules = validate(menu, config)
    const map = indexGroupViolations(menu, config, rules, [])
    const eggs = map.get('eggs') ?? []
    expect(eggs.some((v) => /steps of 2/i.test(v.message))).toBe(true)
    expect(map.get('bread') ?? []).toHaveLength(0)
  })

  it('TC-04: lists excludes on both protein and sauce groups', () => {
    const config = buildConfig(menu, {
      toast: 1,
      tofu: 1,
      bacon: 1,
      chili: 1,
      hollandaise: 1,
    })
    const rules = validate(menu, config)
    const map = indexGroupViolations(menu, config, rules, [])
    const protein = map.get('protein') ?? []
    const sauce = map.get('sauce') ?? []
    expect(protein.length).toBeGreaterThan(0)
    expect(sauce.length).toBeGreaterThan(0)
  })

  it('TC-08: maps stock shortages to the eggs group when add needs eggs', () => {
    const configB = buildConfig(menu, {
      croissant: 1,
      omelette: 2,
      fried: 2,
      sausage: 1,
      bacon: 1,
      hashbrown: 1,
      mushroom: 1,
      hollandaise: 1,
    })
    const configC = buildConfig(menu, {
      paratha: 1,
      fried: 2,
      tofu: 1,
      cheese: 2,
      beans: 1,
      mushroom: 1,
    })
    const reserved = mergeReserved(
      usage(menu, configB, 1),
      usage(menu, configC, 2),
    )
    const next = buildConfig(menu, { toast: 1, sausage: 1, fried: 2 })
    const stock = checkAdd(menu, reserved, next, 1)
    const map = indexGroupViolations(menu, next, [], stock)
    const eggs = map.get('eggs') ?? []
    expect(eggs.some((v) => /egg/i.test(v.message))).toBe(true)
  })

  it('keeps maxPerOption on the option row helper, not duplicated on the group header', () => {
    const config = buildConfig(menu, { toast: 1, sausage: 1, chili: 2 })
    const rules = validate(menu, config)
    const map = indexGroupViolations(menu, config, rules, [])
    const sauceHeader = map.get('sauce') ?? []
    const chiliRow = optionViolations('chili', rules)
    expect(
      sauceHeader.some((v) => v.message.includes('Chili allows at most')),
    ).toBe(false)
    expect(chiliRow.length).toBeGreaterThan(0)
  })
})