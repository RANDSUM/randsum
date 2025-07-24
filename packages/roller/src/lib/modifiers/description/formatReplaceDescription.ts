import type { ReplaceOptions } from '../../../types'
import { formatComparisonDescription } from '../../comparisonUtils'

export function formatReplaceDescription(options: ReplaceOptions | ReplaceOptions[]): string[] {
  const rules = Array.isArray(options) ? options : [options]
  return rules.map(({ from, to }) => {
    if (typeof from === 'object') {
      const comparisons = formatComparisonDescription(from)
      return `Replace ${comparisons.join(' and ')} with [${to}]`
    }
    return `Replace [${from}] with [${to}]`
  })
}
