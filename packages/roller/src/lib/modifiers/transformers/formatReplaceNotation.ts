import type { ReplaceOptions } from '../../../types'
import { formatComparisonNotation } from '../../comparisonUtils'

export function formatReplaceNotation(
  options: ReplaceOptions | ReplaceOptions[]
): string | undefined {
  const rules = Array.isArray(options) ? options : [options]
  const notations = rules.map(({ from, to }) => {
    if (typeof from === 'object') {
      const comparisons = formatComparisonNotation(from)
      return comparisons.map(comp => `${comp}=${to}`).join(',')
    }
    return `${from}=${to}`
  })

  const content = notations.length ? notations.join(',') : undefined
  return content ? `V{${content}}` : undefined
}
