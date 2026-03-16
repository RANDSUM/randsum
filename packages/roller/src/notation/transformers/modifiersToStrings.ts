import type { ModifierOptions } from '../types'
import type { NotationSchema } from '../schema'
import { capSchema } from '../definitions/cap'
import { compoundSchema } from '../definitions/compound'
import { countSchema } from '../definitions/count'
import { dropSchema } from '../definitions/drop'
import { explodeSchema } from '../definitions/explode'
import { explodeSequenceSchema } from '../definitions/explodeSequence'
import { integerDivideSchema } from '../definitions/integerDivide'
import { keepSchema } from '../definitions/keep'
import { minusSchema } from '../definitions/minus'
import { moduloSchema } from '../definitions/modulo'
import { multiplySchema } from '../definitions/multiply'
import { multiplyTotalSchema } from '../definitions/multiplyTotal'
import { penetrateSchema } from '../definitions/penetrate'
import { plusSchema } from '../definitions/plus'
import { replaceSchema } from '../definitions/replace'
import { rerollSchema } from '../definitions/reroll'
import { sortSchema } from '../definitions/sort'
import { uniqueSchema } from '../definitions/unique'
import { wildDieSchema } from '../definitions/wildDie'

/**
 * Schema-only modifier list in priority order.
 * Imports from notation/definitions/ (schema-only, no behavior code)
 * to keep the tokenize bundle small.
 */
const MODIFIER_SCHEMAS: readonly NotationSchema[] = [
  capSchema as NotationSchema,
  dropSchema as NotationSchema,
  keepSchema as NotationSchema,
  replaceSchema as NotationSchema,
  rerollSchema as NotationSchema,
  explodeSchema as NotationSchema,
  compoundSchema as NotationSchema,
  penetrateSchema as NotationSchema,
  explodeSequenceSchema as NotationSchema,
  uniqueSchema as NotationSchema,
  wildDieSchema as NotationSchema,
  multiplySchema as NotationSchema,
  plusSchema as NotationSchema,
  minusSchema as NotationSchema,
  sortSchema as NotationSchema,
  integerDivideSchema as NotationSchema,
  moduloSchema as NotationSchema,
  countSchema as NotationSchema,
  multiplyTotalSchema as NotationSchema
]

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
