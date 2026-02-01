import { capModifier } from './cap'
import { dropModifier } from './drop'
import { keepModifier } from './keep'
import { replaceModifier } from './replace'
import { rerollModifier } from './reroll'
import { explodeModifier } from './explode'
import { compoundModifier } from './compound'
import { penetrateModifier } from './penetrate'
import { uniqueModifier } from './unique'
import { countSuccessesModifier } from './countSuccesses'
import { multiplyModifier } from './multiply'
import { plusModifier } from './plus'
import { minusModifier } from './minus'
import { multiplyTotalModifier } from './multiplyTotal'

export { capModifier }
export { dropModifier }
export { keepModifier }
export { replaceModifier }
export { rerollModifier }
export { explodeModifier }
export { compoundModifier }
export { penetrateModifier }
export { uniqueModifier }
export { countSuccessesModifier }
export { multiplyModifier }
export { plusModifier }
export { minusModifier }
export { multiplyTotalModifier }

export {
  defineModifier,
  getModifier,
  hasModifier,
  getAllModifiers,
  getModifierOrder,
  buildCombinedPattern,
  parseModifiersFromRegistry,
  applyModifierFromRegistry,
  applyAllModifiersFromRegistry,
  modifierToNotationFromRegistry,
  modifierToDescriptionFromRegistry,
  processModifierNotationsFromRegistry,
  processModifierDescriptionsFromRegistry,
  validateModifiersFromRegistry
} from '../registry'
