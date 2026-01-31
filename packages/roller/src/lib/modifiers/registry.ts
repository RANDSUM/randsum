import type { ModifierLog, ModifierOptions, RequiredNumericRollParameters } from '../../types'
import type {
  ModifierContext,
  ModifierDefinition,
  ModifierOptionTypes,
  ModifierRegistry,
  RegistryProcessResult,
  TotalTransformer
} from './schema'
import { ModifierError } from '../../errors'
import { createModifierLog, mergeLogs } from './log'

// ============================================================================
// Registry Instance
// ============================================================================

/**
 * Global modifier registry.
 * Populated by calling registerModifier() for each modifier definition.
 */
const registry: ModifierRegistry = new Map()

/**
 * Cached modifier order (derived from priorities).
 * Regenerated when modifiers are registered.
 */
let cachedOrder: (keyof ModifierOptions)[] | null = null

// ============================================================================
// Registration
// ============================================================================

/**
 * Define and register a modifier.
 * This is the main entry point for creating modifiers.
 *
 * @template K - The modifier name (key in ModifierOptions)
 * @param definition - Complete modifier definition
 * @returns The registered definition (for re-export)
 *
 * @example
 * ```ts
 * export const capModifier = defineModifier({
 *   name: 'cap',
 *   priority: 10,
 *   pattern: /[Cc]\{([^}]{1,50})\}/,
 *   parse: (match) => { ... },
 *   toNotation: (options) => `C{...}`,
 *   toDescription: (options) => ['No rolls greater than X'],
 *   apply: (rolls, options) => ({ rolls: rolls.map(...) })
 * })
 * ```
 */
export function defineModifier<K extends keyof ModifierOptions>(
  definition: ModifierDefinition<ModifierOptionTypes[K]> & { name: K }
): ModifierDefinition<ModifierOptionTypes[K]> {
  registry.set(definition.name, definition as ModifierDefinition)
  cachedOrder = null // Invalidate cache
  return definition
}

/**
 * Get a modifier definition by name.
 */
export function getModifier<K extends keyof ModifierOptions>(
  name: K
): ModifierDefinition<ModifierOptionTypes[K]> | undefined {
  return registry.get(name) as ModifierDefinition<ModifierOptionTypes[K]> | undefined
}

/**
 * Check if a modifier is registered.
 */
export function hasModifier(name: keyof ModifierOptions): boolean {
  return registry.has(name)
}

/**
 * Get all registered modifier definitions.
 */
export function getAllModifiers(): ModifierDefinition[] {
  return Array.from(registry.values())
}

// ============================================================================
// Derived Data
// ============================================================================

/**
 * Get modifier execution order (sorted by priority).
 * Cached for performance.
 */
export function getModifierOrder(): (keyof ModifierOptions)[] {
  cachedOrder ??= Array.from(registry.entries())
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([name]) => name)
  return cachedOrder
}

/**
 * Build combined regex pattern from all registered modifiers.
 * Patterns are joined in priority order.
 */
export function buildCombinedPattern(): RegExp {
  const sources = Array.from(registry.entries())
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([, def]) => def.pattern.source)

  return new RegExp(sources.join('|'), 'g')
}

// ============================================================================
// Registry-Based Operations
// ============================================================================

/**
 * Parse notation string into ModifierOptions using registry.
 */
export function parseModifiersFromRegistry(notation: string): ModifierOptions {
  const result: ModifierOptions = {}

  for (const modifier of registry.values()) {
    // Check if the pattern matches at all before calling parse
    if (modifier.pattern.test(notation)) {
      // Reset lastIndex for patterns that might have 'g' flag effects
      modifier.pattern.lastIndex = 0
      Object.assign(result, modifier.parse(notation))
    }
  }

  return result
}

/**
 * Apply a single modifier using registry lookup.
 */
export function applyModifierFromRegistry(
  name: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions],
  rolls: number[],
  ctx: ModifierContext
): { rolls: number[]; log: ModifierLog | null; transformTotal?: TotalTransformer } {
  if (options === undefined) {
    return { rolls, log: null }
  }

  const modifier = registry.get(name)
  if (!modifier) {
    throw new ModifierError(name, `Unknown modifier type: ${name}`)
  }

  // Validate requirements
  if (modifier.requiresRollFn && ctx.rollOne === undefined) {
    throw new ModifierError(name, `rollOne function required for ${name} modifier`)
  }
  if (modifier.requiresParameters && ctx.parameters === undefined) {
    throw new ModifierError(name, `roll parameters required for ${name} modifier`)
  }

  const initialRolls = [...rolls]

  try {
    const result = modifier.apply(rolls, options, ctx)
    const log = createModifierLog(name, options, initialRolls, result.rolls)

    // Only include transformTotal if it exists
    if (result.transformTotal) {
      return {
        rolls: result.rolls,
        log,
        transformTotal: result.transformTotal
      }
    }

    return {
      rolls: result.rolls,
      log
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new ModifierError(name, error.message)
    }
    throw new ModifierError(name, `Unknown error: ${String(error)}`)
  }
}

/**
 * Apply all modifiers in order using registry.
 */
export function applyAllModifiersFromRegistry(
  modifiers: ModifierOptions,
  initialRolls: number[],
  ctx: ModifierContext
): RegistryProcessResult {
  const order = getModifierOrder()
  let rolls = [...initialRolls]
  let logs: ModifierLog[] = []
  const totalTransformers: TotalTransformer[] = []

  for (const name of order) {
    const options = modifiers[name]
    if (options !== undefined) {
      const result = applyModifierFromRegistry(name, options, rolls, ctx)
      rolls = result.rolls
      if (result.log) {
        logs = mergeLogs(logs, result.log)
      }
      if (result.transformTotal) {
        totalTransformers.push(result.transformTotal)
      }
    }
  }

  return { rolls, logs, totalTransformers }
}

/**
 * Convert modifier options to notation string using registry.
 */
export function modifierToNotationFromRegistry(
  name: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions]
): string | undefined {
  if (options === undefined) return undefined

  const modifier = registry.get(name)
  if (!modifier) return undefined

  return modifier.toNotation(options)
}

/**
 * Convert modifier options to description using registry.
 */
export function modifierToDescriptionFromRegistry(
  name: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions]
): string[] | undefined {
  if (options === undefined) return undefined

  const modifier = registry.get(name)
  if (!modifier) return undefined

  return modifier.toDescription(options)
}

/**
 * Process all modifiers to notation string.
 */
export function processModifierNotationsFromRegistry(
  modifiers: ModifierOptions | undefined
): string {
  if (!modifiers) return ''

  const order = getModifierOrder()
  return order
    .map(name => modifierToNotationFromRegistry(name, modifiers[name]))
    .filter((notation): notation is string => typeof notation === 'string')
    .join('')
}

/**
 * Process all modifiers to descriptions.
 */
export function processModifierDescriptionsFromRegistry(
  modifiers: ModifierOptions | undefined
): string[] {
  if (!modifiers) return []

  const order = getModifierOrder()
  return order
    .map(name => modifierToDescriptionFromRegistry(name, modifiers[name]))
    .flat()
    .filter((desc): desc is string => typeof desc === 'string')
    .filter(desc => desc.length > 0)
}

/**
 * Validate all modifiers using registry.
 */
export function validateModifiersFromRegistry(
  modifiers: ModifierOptions,
  rollContext: RequiredNumericRollParameters
): void {
  for (const [name, modifier] of registry.entries()) {
    const options = modifiers[name]
    if (options !== undefined && modifier.validate) {
      modifier.validate(options, rollContext)
    }
  }
}
