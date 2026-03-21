import type { ModifierOptions } from '../types'
import type { NotationSchema } from '../schema'
import { countFailuresSchema } from '../definitions/countFailures'
import { countSuccessesSchema } from '../definitions/countSuccesses'
import { capSchema } from '../definitions/cap'
import { dropSchema } from '../definitions/drop'
import { keepSchema } from '../definitions/keep'
import { replaceSchema } from '../definitions/replace'
import { rerollSchema } from '../definitions/reroll'
import { explodeSchema } from '../definitions/explode'
import { compoundSchema } from '../definitions/compound'
import { penetrateSchema } from '../definitions/penetrate'
import { explodeSequenceSchema } from '../definitions/explodeSequence'
import { uniqueSchema } from '../definitions/unique'
import { wildDieSchema } from '../definitions/wildDie'
import { multiplySchema } from '../definitions/multiply'
import { plusSchema } from '../definitions/plus'
import { minusSchema } from '../definitions/minus'
import { sortSchema } from '../definitions/sort'
import { integerDivideSchema } from '../definitions/integerDivide'
import { moduloSchema } from '../definitions/modulo'
import { countPattern, countSchema } from '../definitions/count'
import { ModifierError } from '../../errors'
import { multiplyTotalSchema } from '../definitions/multiplyTotal'

/**
 * Minimal schema fields needed for notation parsing.
 * Avoids generic variance issues with NotationSchema<TOptions>.
 */
interface ParseableSchema {
  readonly name: keyof ModifierOptions
  readonly priority: number
  readonly pattern: RegExp
  readonly parse: (notation: string) => Partial<ModifierOptions>
}

/**
 * All modifier schemas in priority order (schema-only, no behavior code).
 * These are the notation/definitions schemas, NOT the co-located modifiers,
 * to keep behavior code out of the tokenize bundle.
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
 * Count-family sugar schemas that translate S{N} and F{N} notation to count options.
 * These are notation-only and not yet registered in RANDSUM_MODIFIERS (see Story 9).
 */
const COUNT_FAMILY_SUGAR: readonly ParseableSchema[] = [countSuccessesSchema, countFailuresSchema]

/**
 * Pre-process syntactic sugar in notation before schema parsing.
 * - `ms{N}` (margin of success) -> `-N` (case-insensitive)
 */
const marginOfSuccessPattern = /[Mm][Ss]\{(\d+)\}/g

function preprocessNotation(notation: string): string {
  return notation.replace(marginOfSuccessPattern, (_match, n: string) => `-${n}`)
}

/**
 * All schemas used for parsing: modifier schemas plus count-family sugar.
 * Evaluated once at module load.
 */
const PARSE_SCHEMAS: readonly ParseableSchema[] = [...MODIFIER_SCHEMAS, ...COUNT_FAMILY_SUGAR]

/**
 * Parse notation string into ModifierOptions using all known notation schemas.
 * Uses notation/definitions schemas as the schema source, supplemented by
 * count-family sugar schemas (S{N}, F{N}) pending Story 9 resolution.
 */
export function parseModifiers(notation: string): ModifierOptions {
  const result: ModifierOptions = {}
  const processed = preprocessNotation(notation)

  const countPatternGlobal = new RegExp(countPattern.source, 'g')
  if ([...processed.matchAll(countPatternGlobal)].length > 1) {
    throw new ModifierError(
      'count',
      'Duplicate count modifier: only one #{...} is allowed per notation string'
    )
  }

  for (const schema of PARSE_SCHEMAS) {
    if (schema.pattern.test(processed)) {
      schema.pattern.lastIndex = 0
      Object.assign(result, schema.parse(processed))
    }
  }

  return result
}

/**
 * Build a combined regex pattern from all known notation schemas.
 * Patterns are joined in priority order, plus syntactic sugar patterns.
 */
export function buildNotationPattern(): RegExp {
  const sources = [...PARSE_SCHEMAS]
    .sort((a, b) => a.priority - b.priority)
    .map(s => s.pattern.source)

  // Add syntactic sugar patterns that are pre-processed before schema parsing
  sources.push(marginOfSuccessPattern.source)
  // Repeat operator (xN) -- handled in notationToOptions, but needed for isDiceNotation validation
  sources.push('[Xx][1-9]\\d*')
  // Annotation labels [text] -- stripped before parsing, needed for isDiceNotation validation
  sources.push('\\[[^\\]]+\\]')

  return new RegExp(sources.join('|'), 'g')
}
