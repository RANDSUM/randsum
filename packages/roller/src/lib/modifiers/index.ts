import './definitions'

export {
  defineModifier,
  registerNotationSchema,
  getModifier,
  hasModifier,
  getAllModifiers,
  getModifierOrder,
  buildCombinedPattern,
  getCachedCombinedPattern,
  parseModifiersFromRegistry,
  applyModifierFromRegistry,
  applyAllModifiersFromRegistry,
  modifierToNotationFromRegistry,
  modifierToDescriptionFromRegistry,
  processModifierNotationsFromRegistry,
  processModifierDescriptionsFromRegistry,
  validateModifiersFromRegistry
} from './registry'

export type {
  ModifierDefinition,
  ModifierBehavior,
  ModifierContext,
  ModifierApplyResult,
  ModifierOptionTypes,
  ModifierRegistry,
  RegistryProcessResult,
  TotalTransformer,
  ContextWithRollFn,
  ContextWithParameters,
  RequiredModifierContext
} from './schema'

export { assertRollFn, assertParameters, assertRequiredContext } from './schema'

export { MODIFIER_PRIORITIES } from './priorities'
