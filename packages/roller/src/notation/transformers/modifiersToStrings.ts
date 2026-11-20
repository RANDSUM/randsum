import type { ModifierOptions } from '../types'
import { MODIFIER_SCHEMAS } from '../definitions'

/**
 * Convert modifier options to a notation string suffix.
 * Uses schema-only iteration (no behavior code imported).
 */
export function modifiersToNotation(modifiers: ModifierOptions | undefined): string {
  if (!modifiers) return ''

  const parts = MODIFIER_SCHEMAS.map(schema => {
    const options = modifiers[schema.name]
    if (options === undefined) return undefined
    return schema.toNotation(options)
  }).filter((notation): notation is string => typeof notation === 'string')

  // A bare `!` written before `!p` or `!s{..}` would read back as `!!` and a
  // stray letter, so it goes after the other explosion forms: `!p!`, `!!!`.
  const bare = parts.indexOf('!')
  const family = parts.findLastIndex(part => part.startsWith('!'))
  if (bare === -1 || family <= bare) return parts.join('')
  return [
    ...parts.slice(0, bare),
    ...parts.slice(bare + 1, family + 1),
    '!',
    ...parts.slice(family + 1)
  ].join('')
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
