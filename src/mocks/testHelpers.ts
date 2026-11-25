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