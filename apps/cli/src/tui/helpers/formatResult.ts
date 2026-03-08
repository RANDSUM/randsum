// SYNC: apps/site/src/components/playground/helpers/formatResult.ts
import type { RollerRollResult } from '@randsum/roller'

export interface FormattedResult {
  readonly total: number
  readonly rolls: readonly (readonly number[])[]
  readonly description: string
}

export interface FormattedError {
  readonly error: string
}

export type FormatResultOutput = FormattedResult | FormattedError

export function isFormattedError(output: FormatResultOutput): output is FormattedError {
  return 'error' in output
}

export function formatResult(result: RollerRollResult): FormatResultOutput {
  const rolls = result.rolls.map(record => record.rolls)
  const descriptions = result.rolls.flatMap(record => record.description).filter(Boolean)
  const description = descriptions.length > 0 ? descriptions.join(', ') : `Total: ${result.total}`

  return {
    total: result.total,
    rolls,
    description
  }
}
