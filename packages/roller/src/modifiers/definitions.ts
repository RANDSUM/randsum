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

/**
 * All modifier definitions in priority order (lowest priority number runs first).
 * This is the single source of truth for which modifiers exist and their execution order.
 */
export const RANDSUM_MODIFIERS: readonly ModifierDefinition[] = Object.freeze([
  capModifier as ModifierDefinition,
  dropModifier as ModifierDefinition,
  keepModifier as ModifierDefinition,
  replaceModifier as ModifierDefinition,
  rerollModifier as ModifierDefinition,
  explodeModifier as ModifierDefinition,
  compoundModifier as ModifierDefinition,
  penetrateModifier as ModifierDefinition,
  explodeSequenceModifier as ModifierDefinition,
  uniqueModifier as ModifierDefinition,
  wildDieModifier as ModifierDefinition,
  countModifier as ModifierDefinition,
  multiplyModifier as ModifierDefinition,
  plusModifier as ModifierDefinition,
  minusModifier as ModifierDefinition,
  sortModifier as ModifierDefinition,
  integerDivideModifier as ModifierDefinition,
  moduloModifier as ModifierDefinition,
  multiplyTotalModifier as ModifierDefinition
])
