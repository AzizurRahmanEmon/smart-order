import { describe, expect, it } from 'vitest'

import menuFixture from '@/mocks/fixtures/menu.json'
import type { Config, Menu } from '@/types/menu'

import { validate } from './validate'

const menu = menuFixture as Menu

function buildConfig(menuData: Menu, picks: Partial<Config>): Config {
  const config: Config = {}
  for (const group of menuData.groups) {
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

describe('validate', () => {
  it('TC-01: Scrambled ×3 with valid bread and protein is blocked on egg step', () => {
    const config = buildConfig(menu, {
      toast: 1,
      sausage: 1,
      scrambled: 3,
    })
    const violations = validate(menu, config)
    expect(violations.length).toBeGreaterThan(0)
    const step = violations.find(
      (v) => v.code === 'group.step' && v.groupId === 'eggs',
    )
    expect(step?.message).toMatch(/2.*6.*steps of 2/i)
  })

  it('TC-02: Croissant + 3 extras blocked by override max 2', () => {
    const config = buildConfig(menu, {
      croissant: 1,
      hashbrown: 1,
      mushroom: 1,
      beans: 1,
    })
    const violations = validate(menu, config)
    const aboveMax = violations.find(
      (v) => v.code === 'group.aboveMax' && v.groupId === 'extras',
    )
    expect(aboveMax).toBeDefined()
    expect(aboveMax!.message).toMatch(/2/)
    expect(aboveMax!.message).toMatch(/Croissant/i)
  })

  it('TC-03: Hollandaise with only Fried eggs is blocked by requires', () => {
    const config = buildConfig(menu, {
      toast: 1,
      sausage: 1,
      fried: 2,
      hollandaise: 1,
    })
    const violations = validate(menu, config)
    const req = violations.find((v) => v.code === 'rule.requires')
    expect(req?.message).toMatch(/Hollandaise requires Scrambled or Omelette/)
  })

  it('TC-04: Tofu + Bacon and Chili + Hollandaise both produce excludes for R2 and R4', () => {
    const config = buildConfig(menu, {
      toast: 1,
      tofu: 1,
      bacon: 1,
      chili: 1,
      hollandaise: 1,
      fried: 2,
    })
    const violations = validate(menu, config)
    expect(
      violations.some((v) => v.ruleId === 'R2' && v.code === 'rule.excludes'),
    ).toBe(true)
    expect(
      violations.some((v) => v.ruleId === 'R4' && v.code === 'rule.excludes'),
    ).toBe(true)
  })

  it('toast + 3 extras passes when Croissant override does not apply', () => {
    const config = buildConfig(menu, {
      toast: 1,
      sausage: 1,
      scrambled: 1,
      fried: 1,
      hashbrown: 1,
      mushroom: 1,
      beans: 1,
    })
    expect(validate(menu, config)).toEqual([])
  })

  it('step check skipped when eggs total is 0', () => {
    const config = buildConfig(menu, {
      toast: 1,
      sausage: 1,
    })
    const violations = validate(menu, config)
    expect(violations.some((v) => v.code === 'group.step')).toBe(false)
    expect(violations.some((v) => v.code === 'group.belowMin' && v.groupId === 'eggs')).toBe(
      true,
    )
  })

  it('valid plate: Toast, Scrambled ×1, Fried ×1, Sausage', () => {
    const config = buildConfig(menu, {
      toast: 1,
      scrambled: 1,
      fried: 1,
      sausage: 1,
    })
    expect(validate(menu, config)).toEqual([])
  })

  it('returns multiple violations together', () => {
    const config = buildConfig(menu, {
      sausage: 1,
      fried: 3,
      hollandaise: 1,
    })
    const violations = validate(menu, config)
    const codes = new Set(violations.map((v) => v.code))
    expect(violations.length).toBeGreaterThanOrEqual(3)
    expect(codes.has('group.belowMin')).toBe(true)
    expect(codes.has('group.step')).toBe(true)
    expect(codes.has('rule.requires')).toBe(true)
  })

  it('unknown option id yields violation without throwing', () => {
    const config = buildConfig(menu, { toast: 1 })
    config['not_a_real_id'] = 1
    const violations = validate(menu, config)
    expect(violations.some((v) => v.code === 'config.unknownOption')).toBe(true)
  })
})