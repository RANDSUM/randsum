// Single source of truth for the notation token inventory.
//
// Before this module the notation grammar was spread across five overlapping
// regex systems (isDiceNotation's strip-and-check, parseModifiers' schema merge,
// parseArguments' multi-pool split + private die regexes, tokenize's hand-rolled
// pattern table, and notationToOptions' core split). The cursor lexer in this
// directory consumes exactly the specs declared here, and every public surface
// (tokenize, isDiceNotation, validateNotation, notationToOptions, roll's
// parseArguments) is a view over that one pass.
//
// The modifier specs REUSE the notation/definitions schema patterns — the schemas
// remain the semantic source for parse/toNotation/toDescription, and each spec
// carries its schema so a token's text is parsed by the schema that matched it
// (poolToOptions). This table only
// adds the faceted category + a stable token key + the disambiguation ordering
// (mirrors the RDN §modifier specificity list), which the schemas do not carry.

import {
  DIE_MARKER_CUSTOM_FACES,
  DIE_MARKER_DRAW,
  DIE_MARKER_FATE,
  DIE_MARKER_GEOMETRIC,
  DIE_MARKER_PERCENTILE,
  DIE_MARKER_ZERO_BIAS
} from '../constants'
import { capSchema } from '../definitions/cap'
import { compoundSchema } from '../definitions/compound'
import { countFailuresSchema } from '../definitions/countFailures'
import { countSuccessesSchema } from '../definitions/countSuccesses'
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
import type { NotationSchema } from '../schema'

export type ModifierCategory =
  | 'Core'
  | 'Special' // dice types
  | 'Order'
  | 'Clamp'
  | 'Map'
  | 'Filter'
  | 'Substitute'
  | 'Generate'
  | 'Accumulate'
  | 'Scale'
  | 'Reinterpret'
  | 'Dispatch'

export type TokenCategory = ModifierCategory | 'unknown'

/** The die-type of a pool head. `standard` covers NdS; the rest are special dice. */
export type PoolKind =
  | 'standard'
  | 'percentile'
  | 'fate'
  | 'custom'
  | 'draw'
  | 'geometric'
  | 'zeroBias'

/** The schema fields the lexer and the options builder read. */
type ModifierSchema = Pick<NotationSchema, 'pattern' | 'parse'>

interface ModifierSpec {
  readonly key: string
  readonly category: ModifierCategory
  /** The schema whose `parse` turns this token's text into modifier options. */
  readonly schema: ModifierSchema
  /** Sticky regex compiled from the schema source; matched at the cursor on the full string. */
  readonly matcher: RegExp
}

/** Compile a schema pattern into a sticky, case-insensitive matcher used at a cursor. */
function sticky(pattern: RegExp): RegExp {
  const flags = pattern.flags.replace(/[gy]/g, '')
  return new RegExp(pattern.source, `${flags.includes('i') ? flags : `${flags}i`}y`)
}

function spec(
  key: string,
  category: ModifierCategory,
  schema: ModifierSchema,
  matcher: RegExp = sticky(schema.pattern)
): ModifierSpec {
  return { key, category, schema, matcher }
}

// Margin-of-success (`ms{N}`) is syntactic sugar for `-N`. It needs its own token
// so the lexer recognizes and positions it; poolToOptions parses it as a minus.
const marginOfSuccessSource = String.raw`[Mm][Ss]\{\d+\}`

// Ordered by RDN modifier specificity (== schema priority ascending), so the first
// matcher that hits at a cursor is authoritative — identical resolution to the
// priority-sorted alternation isDiceNotation previously stripped with.
export const MODIFIER_SPECS: readonly ModifierSpec[] = [
  spec('C{..}', 'Clamp', capSchema),
  spec('V{..}', 'Map', replaceSchema),
  spec('R{..}', 'Substitute', rerollSchema),
  spec('!', 'Generate', explodeSchema),
  spec('!!', 'Accumulate', compoundSchema),
  spec('!p', 'Accumulate', penetrateSchema),
  spec('!s', 'Generate', explodeSequenceSchema),
  spec('W', 'Dispatch', wildDieSchema),
  spec('U', 'Substitute', uniqueSchema),
  spec('drop', 'Filter', dropSchema),
  spec('K', 'Filter', keepSchema),
  spec('#{..}', 'Reinterpret', countSchema),
  spec('S{..}', 'Reinterpret', countSuccessesSchema),
  spec('F{..}', 'Reinterpret', countFailuresSchema),
  spec('ms{..}', 'Scale', minusSchema, new RegExp(marginOfSuccessSource, 'iy')),
  spec('*', 'Scale', multiplySchema),
  spec('+', 'Scale', plusSchema),
  spec('-', 'Scale', minusSchema),
  spec('//', 'Scale', integerDivideSchema),
  spec('%', 'Scale', moduloSchema),
  spec('sort', 'Order', sortSchema),
  spec('**', 'Scale', multiplyTotalSchema)
]

interface PoolSpec {
  readonly key: string
  readonly kind: PoolKind
  /**
   * Sticky matcher for the die body WITHOUT a leading sign — capture group 1 is the
   * optional quantity, remaining groups are die-specific (sides / fate variant / faces).
   * Special dice are matched before `standard` so their markers are never mis-read.
   */
  readonly matcher: RegExp
}

// The lexer is deliberately permissive on magnitude: quantity/sides may be any
// digit run (or absent), so `1d0`/`0d6`/`d0` still lex as a Core pool for
// highlighting. The positive-integer contract (quantity >= 1, sides >= 1) is
// enforced structurally in `parseNotation`, which keeps the lexer (display) and
// the validator (acceptance) as two views of one pass without a magnitude regex
// in the scanner. Draw/percentile/fate/custom share the `d` marker, so they are
// probed before `standard`.
export const POOL_SPECS: readonly PoolSpec[] = [
  { key: 'DDN', kind: 'draw', matcher: new RegExp(`(\\d*)${DIE_MARKER_DRAW}`, 'iy') },
  { key: 'd%', kind: 'percentile', matcher: new RegExp(`(\\d*)${DIE_MARKER_PERCENTILE}`, 'iy') },
  { key: 'dF', kind: 'fate', matcher: new RegExp(`(\\d*)${DIE_MARKER_FATE}`, 'iy') },
  { key: 'd{...}', kind: 'custom', matcher: new RegExp(`(\\d*)${DIE_MARKER_CUSTOM_FACES}`, 'iy') },
  { key: 'gN', kind: 'geometric', matcher: new RegExp(`(\\d*)${DIE_MARKER_GEOMETRIC}`, 'iy') },
  { key: 'zN', kind: 'zeroBias', matcher: new RegExp(`(\\d*)${DIE_MARKER_ZERO_BIAS}`, 'iy') },
  { key: 'xDN', kind: 'standard', matcher: /(\d*)[Dd](\d+)/y }
]
