import type { NotationSchema } from '../schema'
import type { ModifierOptions } from '../types'
import { capSchema } from './cap'
import { compoundSchema } from './compound'
import { countSchema } from './count'
import { dropSchema } from './drop'
import { explodeSchema } from './explode'
import { explodeSequenceSchema } from './explodeSequence'
import { integerDivideSchema } from './integerDivide'
import { keepSchema } from './keep'
import { minusSchema } from './minus'
import { moduloSchema } from './modulo'
import { multiplySchema } from './multiply'
import { multiplyTotalSchema } from './multiplyTotal'
import { penetrateSchema } from './penetrate'
import { plusSchema } from './plus'
import { replaceSchema } from './replace'
import { rerollSchema } from './reroll'
import { sortSchema } from './sort'
import { uniqueSchema } from './unique'
import { wildDieSchema } from './wildDie'

/**
 * The one modifier list: every modifier's notation schema, sorted by `priority`
 * (lower runs first). The lexer's token specs, notation rendering and
 * description, and RANDSUM_MODIFIERS (which maps each schema to its behavior)
 * all derive their order from it, so no list is ordered by hand. The record is
 * keyed by option name, so a modifier added to ModifierOptions without a schema
 * is a type error.
 *
 * Schema-only: no behavior code, so the tokenize bundle can import it.
 */
export const MODIFIER_SCHEMAS: readonly NotationSchema[] = Object.values({
  cap: capSchema,
  compound: compoundSchema,
  count: countSchema,
  drop: dropSchema,
  explode: explodeSchema,
  explodeSequence: explodeSequenceSchema,
  integerDivide: integerDivideSchema,
  keep: keepSchema,
  minus: minusSchema,
  modulo: moduloSchema,
  multiply: multiplySchema,
  multiplyTotal: multiplyTotalSchema,
  penetrate: penetrateSchema,
  plus: plusSchema,
  replace: replaceSchema,
  reroll: rerollSchema,
  sort: sortSchema,
  unique: uniqueSchema,
  wildDie: wildDieSchema
} satisfies Record<keyof ModifierOptions, NotationSchema>).sort((a, b) => a.priority - b.priority)
