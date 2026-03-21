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
  capModifier as ModifierDefinition, // 10 - Clamp
  replaceModifier as ModifierDefinition, // 30 - Map
  rerollModifier as ModifierDefinition, // 40 - Substitute
  explodeModifier as ModifierDefinition, // 50 - Generate
  compoundModifier as ModifierDefinition, // 51 - Accumulate
  penetrateModifier as ModifierDefinition, // 52 - Accumulate
  explodeSequenceModifier as ModifierDefinition, // 53 - Generate
  wildDieModifier as ModifierDefinition, // 55 - Dispatch
  uniqueModifier as ModifierDefinition, // 60 - Substitute
  dropModifier as ModifierDefinition, // 65 - Filter (moved after explosions)
  keepModifier as ModifierDefinition, // 66 - Filter (moved after explosions)
  countModifier as ModifierDefinition, // 80 - Reinterpret
  multiplyModifier as ModifierDefinition, // 85 - Scale
  plusModifier as ModifierDefinition, // 90 - Scale
  minusModifier as ModifierDefinition, // 91 - Scale
  integerDivideModifier as ModifierDefinition, // 93 - Scale
  moduloModifier as ModifierDefinition, // 94 - Scale
  sortModifier as ModifierDefinition, // 95 - Order (moved after arithmetic)
  multiplyTotalModifier as ModifierDefinition // 100 - Scale
])
