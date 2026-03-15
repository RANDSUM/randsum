import type { ModifierLog, ModifierOptions, RequiredNumericRollParameters } from '../../types'
import type {
  ModifierContext,
  ModifierDefinition,
  ModifierOptionTypes,
  RegistryProcessResult,
  TotalTransformer
} from './schema'
import { ModifierError } from '../../errors'
import { ALL_MODIFIERS } from './definitions'
import { createModifierLog } from './log'

// Built once at module init — no mutation
const modifierMap: ReadonlyMap<keyof ModifierOptions, ModifierDefinition> = new Map(
  ALL_MODIFIERS.map(m => [m.name, m])
)

const COMBINED_PATTERN = new RegExp(ALL_MODIFIERS.map(m => m.pattern.source).join('|'), 'g')

/**
 * Get a modifier definition by name.
 */
export function getModifier<K extends keyof ModifierOptions>(
  name: K
): ModifierDefinition<ModifierOptionTypes[K]> | undefined {
  const definition = modifierMap.get(name)
  if (definition === undefined) return undefined
  return definition as ModifierDefinition<ModifierOptionTypes[K]>
}

/**
 * Check if a modifier is registered.
 */
export function hasModifier(name: keyof ModifierOptions): boolean {
  return modifierMap.has(name)
}

/**
 * Get all modifier definitions in priority order.
 */
export function getAllModifiers(): ModifierDefinition[] {
  return Array.from(ALL_MODIFIERS)
}

/**
 * Get modifier execution order (sorted by priority).
 */
export function getModifierOrder(): (keyof ModifierOptions)[] {
  return ALL_MODIFIERS.map(m => m.name)
}

/**
 * Build combined regex pattern from all modifiers.
 * Patterns are joined in priority order.
 */
export function buildCombinedPattern(): RegExp {
  return new RegExp(ALL_MODIFIERS.map(m => m.pattern.source).join('|'), 'g')
}

/**
 * Get the combined modifier pattern.
 */
export function getCachedCombinedPattern(): RegExp {
  return COMBINED_PATTERN
}

/**
 * Parse notation string into ModifierOptions.
 */
export function parseModifiers(notation: string): ModifierOptions {
  const result: ModifierOptions = {}

  for (const modifier of ALL_MODIFIERS) {
    if (modifier.pattern.test(notation)) {
      modifier.pattern.lastIndex = 0
      Object.assign(result, modifier.parse(notation))
    }
  }

  return result
}

/**
 * Apply a single modifier by name.
 */
export function applyModifier(
  name: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions],
  rolls: number[],
  ctx: ModifierContext
): { rolls: number[]; log: ModifierLog | null; transformTotal?: TotalTransformer } {
  if (options === undefined) {
    return { rolls, log: null }
  }

  const modifier = modifierMap.get(name)
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
    const applied = modifier.apply(rolls, options, ctx)
    const log = createModifierLog(name, options, initialRolls, applied.rolls)

    if (applied.transformTotal) {
      return {
        rolls: applied.rolls,
        log,
        transformTotal: applied.transformTotal
      }
    }

    return {
      rolls: applied.rolls,
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
 * Apply all modifiers in priority order.
 */
export function applyAllModifiers(
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

    const result = applyModifier(name, options, state.rolls, ctx)
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
 * Convert modifier options to notation string.
 */
export function modifierToNotation(
  name: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions]
): string | undefined {
  if (options === undefined) return undefined

  const modifier = modifierMap.get(name)
  if (!modifier) return undefined

  return modifier.toNotation(options)
}

/**
 * Convert modifier options to description.
 */
export function modifierToDescription(
  name: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions]
): string[] | undefined {
  if (options === undefined) return undefined

  const modifier = modifierMap.get(name)
  if (!modifier) return undefined

  return modifier.toDescription(options)
}

/**
 * Process all modifiers to notation string.
 */
export function processModifierNotations(modifiers: ModifierOptions | undefined): string {
  if (!modifiers) return ''

  const order = getModifierOrder()
  return order
    .map(name => modifierToNotation(name, modifiers[name]))
    .filter((notation): notation is string => typeof notation === 'string')
    .join('')
}

/**
 * Process all modifiers to descriptions.
 */
export function processModifierDescriptions(modifiers: ModifierOptions | undefined): string[] {
  if (!modifiers) return []

  const order = getModifierOrder()
  return order
    .map(name => modifierToDescription(name, modifiers[name]))
    .flat()
    .filter((desc): desc is string => typeof desc === 'string')
    .filter(desc => desc.length > 0)
}

/**
 * Validate all modifiers against roll context.
 */
export function validateModifiers(
  modifiers: ModifierOptions,
  rollContext: RequiredNumericRollParameters
): void {
  for (const modifier of ALL_MODIFIERS) {
    const options = modifiers[modifier.name]
    if (options !== undefined && modifier.validate) {
      modifier.validate(options, rollContext)
    }
  }
}
