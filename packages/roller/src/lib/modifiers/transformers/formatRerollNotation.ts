import type { RerollOptions } from '../../../types'
import { formatComparisonNotation } from '../../comparisonUtils'

export function formatRerollNotation(options: RerollOptions): string | undefined {
  const parts = formatComparisonNotation(options)
  if (!parts.length) return undefined

  const maxSuffix = options.max ? `${options.max}` : ''
  return `R{${parts.join(',')}}${maxSuffix}`
}
