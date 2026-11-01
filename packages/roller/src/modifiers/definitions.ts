import type { ModifierOptions } from '../notation/types'
import { MODIFIER_SCHEMAS } from '../notation/definitions'
import type { ModifierDefinition } from './schema'
import { capModifier } from './cap'
import { compoundModifier } from './compound'
import { countModifier } from './count'
import { dropModifier } from './drop'
import { explodeModifier } from './explode'
import { explodeSequenceModifier } from './explodeSequence'
import { integerDivideModifier } from './integerDivide'
import { keepModifier } from './keep'
import { minusModifier } from './minus'
import { moduloModifier } from './modulo'
import { multiplyModifier } from './multiply'
import { multiplyTotalModifier } from './multiplyTotal'
import { penetrateModifier } from './penetrate'
import { plusModifier } from './plus'
import { replaceModifier } from './replace'
import { rerollModifier } from './reroll'
import { sortModifier } from './sort'
import { uniqueModifier } from './unique'
import { wildDieModifier } from './wildDie'

/** Every modifier definition, keyed by its option name. */
export const MODIFIERS_BY_NAME: Readonly<Record<keyof ModifierOptions, ModifierDefinition>> = {
  cap: capModifier,
  compound: compoundModifier,
  count: countModifier,
  drop: dropModifier,
  explode: explodeModifier,
  explodeSequence: explodeSequenceModifier,
  integerDivide: integerDivideModifier,
  keep: keepModifier,
  minus: minusModifier,
  modulo: moduloModifier,
  multiply: multiplyModifier,
  multiplyTotal: multiplyTotalModifier,
  penetrate: penetrateModifier,
  plus: plusModifier,
  replace: replaceModifier,
  reroll: rerollModifier,
  sort: sortModifier,
  unique: uniqueModifier,
  wildDie: wildDieModifier
}

/**
 * Every modifier definition in execution order: MODIFIER_SCHEMAS (sorted by
 * priority) mapped to the behavior registered under each schema's name.
 */
export const RANDSUM_MODIFIERS: readonly ModifierDefinition[] = Object.freeze(
  MODIFIER_SCHEMAS.map(schema => MODIFIERS_BY_NAME[schema.name])
)
