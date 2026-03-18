import type { NormalizedPipelineOverride, NormalizedRollCase } from './normalizedTypes'
import type { InputValue, RollInput } from './types'
import { SchemaError } from './errors'

export function compareValues(
  inputVal: InputValue,
  operator: '=' | '>' | '>=' | '<' | '<=',
  condVal: InputValue
): boolean {
  if (operator === '=') return inputVal === condVal
  if (typeof inputVal !== 'number' || typeof condVal !== 'number') {
    throw new SchemaError(
      `Operator "${operator}" requires numeric values`,
      'CONDITION_TYPE_MISMATCH'
    )
  }
  switch (operator) {
    case '>':
      return inputVal > condVal
    case '>=':
      return inputVal >= condVal
    case '<':
      return inputVal < condVal
    case '<=':
      return inputVal <= condVal
  }
}

export function evaluateNormalizedWhen(
  cases: readonly NormalizedRollCase[] | undefined,
  input: RollInput
): NormalizedPipelineOverride | undefined {
  if (!cases) return undefined
  for (const rollCase of cases) {
    const { condition } = rollCase
    const inputVal = input[condition.input]
    if (inputVal === undefined) continue
    if (compareValues(inputVal, condition.operator, condition.value)) {
      return rollCase.override
    }
  }
  return undefined
}
