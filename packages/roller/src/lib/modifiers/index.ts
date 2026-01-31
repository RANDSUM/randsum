// Public API
export { applyModifiers } from './applyModifiers'
export { parseModifiers } from './parse'
export { processModifierDescriptions, processModifierNotations } from './format'
export type { ModifierHandler } from './types'
export { validateModifierOptions } from './validateModifiers'

// Internal exports (used by other lib/ modules)
export { MODIFIER_ORDER } from './constants'
