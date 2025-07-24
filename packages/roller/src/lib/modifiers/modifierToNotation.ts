import type { ModifierOptions } from '../../types'
import { NOTATION_HANDLERS } from './transformers/notationHandlers'

export function modifierToNotation(
  type: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions]
): string | undefined {
  if (options === undefined) return undefined

  const handler = NOTATION_HANDLERS.get(type)
  return handler ? handler(options) : undefined
}
