import type { InputValue, PipelineOverride, RollCase, RollInput } from './types'
import { SchemaError } from './errors'

function compareValues(
  inputVal: InputValue,
  operator: '=' | '>' | '>=' | '<' | '<=',
  condVal: InputValue
): boolean {
  if (operator === '=') return inputVal === condVal
  if (typeof inputVal !== 'number' || typeof condVal !== 'number') {
    throw new SchemaError(
      'CONDITION_TYPE_MISMATCH',
      `Operator "${operator}" requires numeric values`
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

export function evaluateWhen(
  cases: readonly RollCase[] | undefined,
  input: RollInput
): PipelineOverride | undefined {
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
