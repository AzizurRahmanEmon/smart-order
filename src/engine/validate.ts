import type { Config, Group, GroupId, Menu, OptionId, Rule } from '@/types/menu'

export type Violation = {
  code: string
  groupId?: string
  optionId?: string
  ruleId?: string
  message: string
}

type OptionMeta = {
  name: string
  groupId: GroupId
}

function qty(config: Config, optionId: OptionId): number {
  const n = config[optionId] ?? 0
  return n < 0 ? n : n
}

function indexOptions(menu: Menu): Map<OptionId, OptionMeta> {
  const map = new Map<OptionId, OptionMeta>()
  for (const group of menu.groups) {
    for (const option of group.options) {
      map.set(option.id, { name: option.name, groupId: group.id })
    }
  }
  return map
}

function groupTotal(group: Group, config: Config): number {
  let total = 0
  for (const option of group.options) {
    total += Math.max(0, qty(config, option.id))
  }
  return total
}

function effectiveMax(
  menu: Menu,
  group: Group,
  config: Config,
): { max: number | undefined; overrideTriggers: OptionId[] } {
  const activeOverrides = menu.rules.filter(
    (rule): rule is Extract<Rule, { type: 'overrideLimit' }> =>
      rule.type === 'overrideLimit' &&
      rule.group === group.id &&
      qty(config, rule.option) > 0,
  )

  if (activeOverrides.length === 0) {
    return { max: group.max, overrideTriggers: [] }
  }

  const max = Math.min(...activeOverrides.map((r) => r.max))
  return {
    max,
    overrideTriggers: activeOverrides.map((r) => r.option),
  }
}

function formatOrList(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]!
  if (names.length === 2) return `${names[0]} or ${names[1]}`
  const last = names[names.length - 1]!
  return `${names.slice(0, -1).join(', ')} or ${last}`
}

function stepMessage(group: Group): string {
  const { step } = group
  if (step === undefined) return ''
  if (group.max !== undefined) {
    return `${group.name} total must be ${group.min}–${group.max} in steps of ${step}`
  }
  return `${group.name} total must be at least ${group.min} in steps of ${step}`
}

export function validate(menu: Menu, config: Config): Violation[] {
  const violations: Violation[] = []
  const optionIndex = indexOptions(menu)

  for (const [optionId, count] of Object.entries(config)) {
    if (!optionIndex.has(optionId)) {
      violations.push({
        code: 'config.unknownOption',
        optionId,
        message: `Unknown option: ${optionId}`,
      })
      continue
    }
    if (count < 0) {
      const meta = optionIndex.get(optionId)!
      violations.push({
        code: 'config.invalidQuantity',
        optionId,
        groupId: meta.groupId,
        message: `${meta.name} quantity cannot be negative`,
      })
    }
  }

  const triggerNames = (ids: OptionId[]): string[] =>
    ids.map((id) => optionIndex.get(id)?.name ?? id)

  for (const group of menu.groups) {
    const total = groupTotal(group, config)
    const { max: effectiveMaxVal, overrideTriggers } = effectiveMax(
      menu,
      group,
      config,
    )

    if (total < group.min) {
      violations.push({
        code: 'group.belowMin',
        groupId: group.id,
        message: `${group.name} needs at least ${group.min} (selected ${total})`,
      })
    }

    if (effectiveMaxVal !== undefined && total > effectiveMaxVal) {
      let message = `${group.name} allows at most ${effectiveMaxVal} (selected ${total})`
      if (overrideTriggers.length > 0) {
        const triggers = formatOrList(triggerNames(overrideTriggers))
        message = `${group.name} allows at most ${effectiveMaxVal} when ${triggers} is selected (selected ${total})`
        if (overrideTriggers.length > 1) {
          message = `${group.name} allows at most ${effectiveMaxVal} when ${triggers} are selected (selected ${total})`
        }
      }
      violations.push({
        code: 'group.aboveMax',
        groupId: group.id,
        message,
      })
    }

    if (group.step !== undefined && total > 0 && total % group.step !== 0) {
      violations.push({
        code: 'group.step',
        groupId: group.id,
        message: stepMessage(group),
      })
    }

    if (group.maxDistinct !== undefined) {
      const distinct = group.options.filter((o) => qty(config, o.id) > 0).length
      if (distinct > group.maxDistinct) {
        violations.push({
          code: 'group.maxDistinct',
          groupId: group.id,
          message: `${group.name} allows at most ${group.maxDistinct} distinct options`,
        })
      }
    }

    if (group.maxPerOption !== undefined) {
      for (const option of group.options) {
        const count = qty(config, option.id)
        if (count > group.maxPerOption) {
          violations.push({
            code: 'group.maxPerOption',
            groupId: group.id,
            optionId: option.id,
            message: `${option.name} allows at most ${group.maxPerOption}`,
          })
        }
      }
    }
  }

  for (const rule of menu.rules) {
    if (rule.type === 'requires') {
      if (qty(config, rule.option) <= 0) continue
      const satisfied = rule.anyOf.some((id) => qty(config, id) > 0)
      if (!satisfied) {
        const trigger = optionIndex.get(rule.option)?.name ?? rule.option
        const anyNames = rule.anyOf.map(
          (id) => optionIndex.get(id)?.name ?? id,
        )
        violations.push({
          code: 'rule.requires',
          ruleId: rule.id,
          optionId: rule.option,
          message: `${trigger} requires ${formatOrList(anyNames)}`,
        })
      }
    }

    if (rule.type === 'excludes') {
      if (qty(config, rule.option) <= 0) continue
      const trigger = optionIndex.get(rule.option)?.name ?? rule.option
      for (const forbiddenId of rule.noneOf) {
        if (qty(config, forbiddenId) > 0) {
          const forbidden =
            optionIndex.get(forbiddenId)?.name ?? forbiddenId
          violations.push({
            code: 'rule.excludes',
            ruleId: rule.id,
            optionId: rule.option,
            message: `${trigger} cannot be combined with ${forbidden}`,
          })
        }
      }
    }
  }

  return violations
}