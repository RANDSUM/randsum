import type { ModifierLog, ModifierOptions, RequiredNumericRollParameters } from '../../types'
import type { NotationSchema } from '@randsum/notation/schemas'
import type {
  ModifierBehavior,
  ModifierContext,
  ModifierDefinition,
  ModifierOptionTypes,
  ModifierRegistry,
  RegistryProcessResult,
  TotalTransformer
} from './schema'
import { ModifierError } from '../../errors'
import { createModifierLog } from './log'

/**
 * Minimal schema fields needed for notation parsing.
 * Used as the storage type for the notationRegistry to avoid
 * function parameter variance issues with NotationSchema<TOptions>.
 */
interface ParseableSchema {
  readonly name: keyof ModifierOptions
  readonly priority: number
  readonly pattern: RegExp
  readonly parse: (notation: string) => Partial<ModifierOptions>
}

/**
 * Global modifier registry.
 * Populated by calling defineModifier() for each modifier definition.
 *
 * INITIALIZATION: Modifiers register themselves when their definition files
 * are imported. The `definitions/index.ts` file imports all modifiers,
 * and this is imported by the main package entry point.
 *
 * When importing from `@randsum/roller`, all modifiers are automatically
 * registered before any exports are available. This happens because:
 * 1. Package entry point imports from internal modules
 * 2. Internal modules import from `lib/modifiers/definitions/index.ts`
 * 3. That file imports each modifier definition
 * 4. Each definition calls defineModifier() on load
 *
 * For advanced use cases where you import directly from internal paths,
 * ensure you also import `lib/modifiers/definitions` to trigger registration.
 */
const registry: ModifierRegistry = new Map()

/**
 * Notation-only registry.
 * Populated alongside the full registry by defineModifier().
 *
 * Stores ParseableSchema (the parse-relevant subset of NotationSchema)
 * to avoid function parameter variance issues with generic types.
 * Exists so that parseModifiersFromRegistry can work using only
 * notation schemas, without loading execution logic.
 */
const notationRegistry = new Map<keyof ModifierOptions, ParseableSchema>()

/**
 * Register a notation schema to the notation registry.
 * Accepts any schema that has the parse-relevant fields.
 */
export function registerNotationSchema(schema: ParseableSchema): void {
  notationRegistry.set(schema.name, schema)
}

/**
 * Cache for the combined modifier pattern.
 * Invalidated whenever the registry changes (defineModifier or clearRegistry).
 */
// eslint-disable-next-line no-restricted-syntax
let cachedCombinedPattern: RegExp | null = null

function invalidateCombinedPatternCache(): void {
  cachedCombinedPattern = null
}

/**
 * Define and register a modifier from separate notation schema and behavior.
 * This is the main entry point for creating modifiers.
 *
 * Registers the combined definition to the full modifier registry and
 * the schema to the notation-only registry.
 *
 * @template K - The modifier name (key in ModifierOptions), inferred from schema.name
 * @template TOptions - The option type, inferred from schema functions
 * @param schema - Notation schema (pattern, parse, toNotation, toDescription)
 * @param behavior - Execution behavior (apply, validate, requiresRollFn, requiresParameters)
 * @returns The registered definition (for re-export)
 *
 * @example
 * ```ts
 * export const capModifier = defineModifier(capSchema, capBehavior)
 * ```
 */
export function defineModifier<TOptions>(
  schema: NotationSchema<TOptions> & { name: keyof ModifierOptions },
  behavior: ModifierBehavior<TOptions>
): ModifierDefinition<TOptions> {
  const definition = { ...schema, ...behavior } as ModifierDefinition<TOptions>
  registry.set(schema.name, definition as ModifierDefinition)
  notationRegistry.set(schema.name, schema) // NotationSchema<TOptions> satisfies ParseableSchema
  invalidateCombinedPatternCache()
  return definition
}

/**
 * Get a modifier definition by name.
 *
 * Note: The return type uses a type assertion internally because the registry
 * stores ModifierDefinition<unknown>. This is type-safe because defineModifier()
 * ensures each name maps to its correct option type, and we retrieve by the same name.
 */
export function getModifier<K extends keyof ModifierOptions>(
  name: K
): ModifierDefinition<ModifierOptionTypes[K]> | undefined {
  const definition = registry.get(name)
  if (definition === undefined) return undefined
  return definition as ModifierDefinition<ModifierOptionTypes[K]>
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

/**
 * Clear the registry (for testing purposes only).
 * @internal
 */
export function clearRegistry(): void {
  registry.clear()
  notationRegistry.clear()
  invalidateCombinedPatternCache()
}

/**
 * Re-register default modifiers (for testing restore after clearRegistry).
 * @internal
 */
export function registerDefaultModifiers(definitions: ModifierDefinition[]): void {
  for (const def of definitions) {
    registry.set(def.name, def)
    notationRegistry.set(def.name, def) // ModifierDefinition satisfies ParseableSchema
  }
  invalidateCombinedPatternCache()
}

/**
 * Get modifier execution order (sorted by priority).
 */
export function getModifierOrder(): (keyof ModifierOptions)[] {
  return Array.from(registry.entries())
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([name]) => name)
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

/**
 * Get the cached combined modifier pattern.
 * Builds the pattern lazily on first call and caches it.
 * Cache is invalidated when modifiers are registered or the registry is cleared.
 */
export function getCachedCombinedPattern(): RegExp {
  cachedCombinedPattern ??= buildCombinedPattern()
  return cachedCombinedPattern
}

/**
 * Parse notation string into ModifierOptions using the notation registry.
 * Works with notation schemas only — no execution logic required.
 */
export function parseModifiersFromRegistry(notation: string): ModifierOptions {
  const result: ModifierOptions = {}

  for (const schema of notationRegistry.values()) {
    if (schema.pattern.test(notation)) {
      schema.pattern.lastIndex = 0
      Object.assign(result, schema.parse(notation))
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
  const initialState: RegistryProcessResult = {
    rolls: [...initialRolls],
    logs: [],
    totalTransformers: []
  }

  return order.reduce((state, name) => {
    const options = modifiers[name]
    if (options === undefined) {
      return state
    }

    const result = applyModifierFromRegistry(name, options, state.rolls, ctx)
    return {
      rolls: result.rolls,
      logs: result.log ? [...state.logs, result.log] : state.logs,
      totalTransformers: result.transformTotal
        ? [...state.totalTransformers, result.transformTotal]
        : state.totalTransformers
    }
  }, initialState)
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
