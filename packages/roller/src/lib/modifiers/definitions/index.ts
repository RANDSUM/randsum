import type { ModifierDefinition } from '../schema'
import { capModifier } from './cap'
import { compoundModifier } from './compound'
import { countFailuresModifier } from './countFailures'
import { countSuccessesModifier } from './countSuccesses'
import { dropModifier } from './drop'
import { explodeModifier } from './explode'
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

export { capModifier }
export { compoundModifier }
export { countFailuresModifier }
export { countSuccessesModifier }
export { dropModifier }
export { explodeModifier }
export { integerDivideModifier }
export { keepModifier }
export { minusModifier }
export { moduloModifier }
export { multiplyModifier }
export { multiplyTotalModifier }
export { penetrateModifier }
export { plusModifier }
export { replaceModifier }
export { rerollModifier }
export { sortModifier }
export { uniqueModifier }
export { wildDieModifier }

/**
 * All modifier definitions in priority order (lowest priority number runs first).
 * This is the single source of truth for which modifiers exist and their execution order.
 */
export const ALL_MODIFIERS: readonly ModifierDefinition[] = Object.freeze([
  capModifier as ModifierDefinition,
  dropModifier as ModifierDefinition,
  keepModifier as ModifierDefinition,
  replaceModifier as ModifierDefinition,
  rerollModifier as ModifierDefinition,
  explodeModifier as ModifierDefinition,
  compoundModifier as ModifierDefinition,
  penetrateModifier as ModifierDefinition,
  uniqueModifier as ModifierDefinition,
  wildDieModifier as ModifierDefinition,
  multiplyModifier as ModifierDefinition,
  plusModifier as ModifierDefinition,
  minusModifier as ModifierDefinition,
  sortModifier as ModifierDefinition,
  integerDivideModifier as ModifierDefinition,
  moduloModifier as ModifierDefinition,
  countSuccessesModifier as ModifierDefinition,
  countFailuresModifier as ModifierDefinition,
  multiplyTotalModifier as ModifierDefinition
])
