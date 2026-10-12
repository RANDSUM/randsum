import type { ModifierOptions } from '../types'
import { MODIFIER_SCHEMAS } from '../definitions'

/**
 * Convert modifier options to a notation string suffix.
 * Uses schema-only iteration (no behavior code imported).
 */
export function modifiersToNotation(modifiers: ModifierOptions | undefined): string {
  if (!modifiers) return ''

  return MODIFIER_SCHEMAS.map(schema => {
    const options = modifiers[schema.name]
    if (options === undefined) return undefined
    return schema.toNotation(options)
  })
    .filter((notation): notation is string => typeof notation === 'string')
    .join('')
}

/**
 * Convert modifier options to an array of human-readable description strings.
 * Uses schema-only iteration (no behavior code imported).
 */
export function modifiersToDescription(modifiers: ModifierOptions | undefined): string[] {
  if (!modifiers) return []

  return MODIFIER_SCHEMAS.flatMap(schema => {
    const options = modifiers[schema.name]
    if (options === undefined) return []
    return schema.toDescription(options)
  }).filter((desc): desc is string => typeof desc === 'string' && desc.length > 0)
}
