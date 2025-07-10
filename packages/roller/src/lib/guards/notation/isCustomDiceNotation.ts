import { isDiceNotation } from './isDiceNotation'

export function isCustomDiceNotation(notation: unknown): boolean {
  return isDiceNotation(notation) && notation.includes('{')
}
