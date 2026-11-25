import type { Group } from '@/types/menu'

export function formatGroupLimitHint(group: Group): string {
  const parts: string[] = [`min ${group.min}`]

  if (group.max !== undefined) {
    parts.push(`max ${group.max}`)
  }
  if (group.step !== undefined) {
    parts.push(`step ${group.step}`)
  }
  if (group.maxDistinct !== undefined) {
    parts.push(`max distinct ${group.maxDistinct}`)
  }
  if (group.maxPerOption !== undefined) {
    parts.push(`max per option ${group.maxPerOption}`)
  }

  return parts.join(' · ')
}