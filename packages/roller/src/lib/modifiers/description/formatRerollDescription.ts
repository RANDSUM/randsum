import type { RerollOptions } from '../../../types'
import { formatHumanList } from '../../comparisonUtils'

export function formatRerollDescription({
  exact,
  greaterThan,
  lessThan,
  max
}: RerollOptions): string[] {
  const rerollList: string[] = []

  if (exact) {
    exact.forEach(roll => rerollList.push(`${roll}`))
  }

  const greaterLessList: string[] = []
  if (greaterThan !== undefined) {
    greaterLessList.push(`greater than [${greaterThan}]`)
  }
  if (lessThan !== undefined) {
    greaterLessList.push(`less than [${lessThan}]`)
  }

  const exactList = formatHumanList(rerollList.map(Number))
  const greaterLess = greaterLessList.join(' and ')

  const conditions = [exactList, greaterLess].filter(Boolean).join(', ')
  if (!conditions) return []

  const maxText = max !== undefined ? ` (up to ${max} times)` : ''
  return [`Reroll ${conditions}${maxText}`]
}
