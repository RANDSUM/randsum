import type { RerollOptions } from '../../../types'
import { formatComparisonNotation } from '../../comparisonUtils'

export function formatRerollNotation(options: RerollOptions): string | undefined {
  const parts = formatComparisonNotation(options)
  const content = parts.length ? parts.join(',') : undefined
  if (!content) return undefined

  const maxSuffix = options.max ? `${options.max}` : ''
  return `R{${content}}${maxSuffix}`
}
