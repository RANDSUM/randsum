import type { ModifierOptions } from '../../types'
import { DESCRIPTION_HANDLERS } from './description/descriptionHandlers'

export function modifierToDescription(
  type: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions]
): string[] | undefined {
  if (options === undefined) return undefined

  const handler = DESCRIPTION_HANDLERS.get(type)
  return handler ? handler(options) : undefined
}
