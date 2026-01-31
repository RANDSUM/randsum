// ============================================================================
// Modifier Registry API
// ============================================================================

// Import definitions to register all modifiers with the registry
import './definitions'

// Export registry functions
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
} from './registry'

// Export schema types
export type {
  ModifierDefinition,
  ModifierContext,
  ModifierApplyResult,
  ModifierOptionTypes,
  ModifierRegistry,
  RegistryProcessResult,
  TypedModifierDefinition,
  TotalTransformer
} from './schema'
