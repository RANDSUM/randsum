/**
 * Modifier Definitions
 *
 * This module imports all modifier definitions, which registers them
 * with the global modifier registry via the defineModifier() calls.
 *
 * Import this module to ensure all modifiers are registered before use.
 */

// Import all modifier definitions (registration happens on import via defineModifier)
export { capModifier } from './cap'
export { dropModifier } from './drop'
export { keepModifier } from './keep'
export { replaceModifier } from './replace'
export { rerollModifier } from './reroll'
export { explodeModifier } from './explode'
export { compoundModifier } from './compound'
export { penetrateModifier } from './penetrate'
export { uniqueModifier } from './unique'
export { countSuccessesModifier } from './countSuccesses'
export { multiplyModifier } from './multiply'
export { plusModifier } from './plus'
export { minusModifier } from './minus'
export { multiplyTotalModifier } from './multiplyTotal'

// Re-export registry functions for convenience
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
