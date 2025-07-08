import { isDiceNotation } from './isDiceNotation'

export function isNumericDiceNotation(notation: unknown): boolean {
  return isDiceNotation(notation) && !notation.includes('{')
}
