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
// remain the semantic source for parse/toNotation/toDescription. This table only
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

interface ModifierSpec {
  readonly key: string
  readonly category: ModifierCategory
  /** Sticky regex compiled from the schema source; matched at the cursor on the full string. */
  readonly matcher: RegExp
}

/** Compile a schema pattern into a sticky, case-insensitive matcher used at a cursor. */
function sticky(pattern: RegExp): RegExp {
  const flags = pattern.flags.replace(/[gy]/g, '')
  return new RegExp(pattern.source, `${flags.includes('i') ? flags : `${flags}i`}y`)
}

// Margin-of-success (`ms{N}`) is syntactic sugar de-sugared to `-N` in parseModifiers;
// here it needs its own token so the lexer recognizes and positions it.
const marginOfSuccessSource = String.raw`[Mm][Ss]\{\d+\}`

// Ordered by RDN modifier specificity (== schema priority ascending), so the first
// matcher that hits at a cursor is authoritative — identical resolution to the
// priority-sorted alternation isDiceNotation previously stripped with.
export const MODIFIER_SPECS: readonly ModifierSpec[] = [
  { key: 'C{..}', category: 'Clamp', matcher: sticky(capSchema.pattern) },
  { key: 'V{..}', category: 'Map', matcher: sticky(replaceSchema.pattern) },
  { key: 'R{..}', category: 'Substitute', matcher: sticky(rerollSchema.pattern) },
  { key: '!', category: 'Generate', matcher: sticky(explodeSchema.pattern) },
  { key: '!!', category: 'Accumulate', matcher: sticky(compoundSchema.pattern) },
  { key: '!p', category: 'Accumulate', matcher: sticky(penetrateSchema.pattern) },
  { key: '!s', category: 'Generate', matcher: sticky(explodeSequenceSchema.pattern) },
  { key: 'W', category: 'Dispatch', matcher: sticky(wildDieSchema.pattern) },
  { key: 'U', category: 'Substitute', matcher: sticky(uniqueSchema.pattern) },
  { key: 'drop', category: 'Filter', matcher: sticky(dropSchema.pattern) },
  { key: 'K', category: 'Filter', matcher: sticky(keepSchema.pattern) },
  { key: '#{..}', category: 'Reinterpret', matcher: sticky(countSchema.pattern) },
  { key: 'S{..}', category: 'Reinterpret', matcher: sticky(countSuccessesSchema.pattern) },
  { key: 'F{..}', category: 'Reinterpret', matcher: sticky(countFailuresSchema.pattern) },
  { key: 'ms{..}', category: 'Scale', matcher: new RegExp(marginOfSuccessSource, 'iy') },
  { key: '*', category: 'Scale', matcher: sticky(multiplySchema.pattern) },
  { key: '+', category: 'Scale', matcher: sticky(plusSchema.pattern) },
  { key: '-', category: 'Scale', matcher: sticky(minusSchema.pattern) },
  { key: '//', category: 'Scale', matcher: sticky(integerDivideSchema.pattern) },
  { key: '%', category: 'Scale', matcher: sticky(moduloSchema.pattern) },
  { key: 'sort', category: 'Order', matcher: sticky(sortSchema.pattern) },
  { key: '**', category: 'Scale', matcher: sticky(multiplyTotalSchema.pattern) }
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
