import type { Config } from '@/types/menu'

export function hashConfig(config: Config, extra = ''): string {
  const keys = Object.keys(config).sort()
  const parts = keys.map((k) => `${k}:${config[k] ?? 0}`)
  return `${parts.join('|')}|${extra}`
}