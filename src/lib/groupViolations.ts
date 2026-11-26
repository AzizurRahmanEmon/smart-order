import type { StockViolation } from '@/engine/stock'
import type { Violation } from '@/engine/validate'
import type { Config, GroupId, Menu, OptionId } from '@/types/menu'

export type GroupViolation = {
  key: string
  message: string
}

function optionToGroup(menu: Menu): Map<OptionId, GroupId> {
  const map = new Map<OptionId, GroupId>()
  for (const group of menu.groups) {
    for (const option of group.options) {
      map.set(option.id, group.id)
    }
  }
  return map
}

function groupsUsingIngredient(
  menu: Menu,
  config: Config,
  ingredientId: string,
): Set<GroupId> {
  const groups = new Set<GroupId>()
  for (const group of menu.groups) {
    for (const option of group.options) {
      if ((config[option.id] ?? 0) <= 0) continue
      if ((option.uses[ingredientId] ?? 0) > 0) {
        groups.add(group.id)
      }
    }
  }
  return groups
}

function violationKey(v: Violation | StockViolation, message: string): string {
  if (v.code === 'stock.short') {
    return `stock-${(v as StockViolation).ingredientId}-${message}`
  }
  const rv = v as Violation
  return `rule-${rv.code}-${rv.groupId ?? ''}-${rv.optionId ?? ''}-${rv.ruleId ?? ''}-${message}`
}

/**
 * Maps rule and stock violations to the option-group cards they relate to.
 */
export function indexGroupViolations(
  menu: Menu,
  config: Config,
  ruleViolations: Violation[],
  stockViolations: StockViolation[],
): Map<GroupId, GroupViolation[]> {
  const optionGroup = optionToGroup(menu)
  const byGroup = new Map<GroupId, GroupViolation[]>()

  const push = (groupId: GroupId, key: string, message: string) => {
    const list = byGroup.get(groupId) ?? []
    if (list.some((item) => item.key === key)) return
    list.push({ key, message })
    byGroup.set(groupId, list)
  }

  for (const v of ruleViolations) {
    const key = violationKey(v, v.message)
    const rowOnly =
      v.code === 'group.maxPerOption' || v.code === 'config.invalidQuantity'

    if (v.groupId && !rowOnly) {
      push(v.groupId, key, v.message)
    }
    if (v.optionId && !rowOnly) {
      const gid = optionGroup.get(v.optionId)
      if (gid) push(gid, key, v.message)
    }
    if (v.ruleId && v.code === 'rule.excludes') {
      const rule = menu.rules.find((r) => r.id === v.ruleId)
      if (rule?.type === 'excludes') {
        for (const forbiddenId of rule.noneOf) {
          const gid = optionGroup.get(forbiddenId)
          if (gid) push(gid, key, v.message)
        }
      }
    }
  }

  for (const s of stockViolations) {
    const key = violationKey(s, s.message)
    for (const groupId of groupsUsingIngredient(menu, config, s.ingredientId)) {
      push(groupId, key, s.message)
    }
  }

  return byGroup
}

export function optionViolations(
  optionId: OptionId,
  ruleViolations: Violation[],
): GroupViolation[] {
  const items: GroupViolation[] = []
  const seen = new Set<string>()

  for (const v of ruleViolations) {
    if (v.optionId !== optionId) continue
    if (v.code === 'rule.requires' || v.code === 'rule.excludes') continue
    const key = violationKey(v, v.message)
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ key, message: v.message })
  }

  return items
}