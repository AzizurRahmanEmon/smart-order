import type { Config, Menu } from '@/types/menu'

export function summarizeConfig(menu: Menu, config: Config): string {
  const parts: string[] = []
  for (const group of menu.groups) {
    for (const option of group.options) {
      const n = config[option.id] ?? 0
      if (n > 0) {
        parts.push(n > 1 ? `${option.name} ×${n}` : option.name)
      }
    }
  }
  return parts.length > 0 ? parts.join(', ') : 'Empty plate'
}