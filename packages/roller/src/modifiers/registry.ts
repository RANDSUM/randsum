import type { ModifierLog, ModifierOptions, RequiredNumericRollParameters } from '../types'
import type {
  ModifierContext,
  ModifierDefinition,
  ModifierOptionTypes,
  RegistryProcessResult,
  TotalTransformer
} from './schema'
import { ModifierError } from '../errors'
import { RANDSUM_MODIFIERS } from './definitions'
import { createArithmeticLog, createModifierLog } from './log'

// Built once at module init -- no mutation
const modifierMap: ReadonlyMap<keyof ModifierOptions, ModifierDefinition> = new Map(
  RANDSUM_MODIFIERS.map(m => [m.name, m])
)

/**
 * Modifier execution order -- computed once at module init, never reallocated.
 * Use this instead of calling getModifierOrder() in hot paths.
 */
export const MODIFIER_ORDER: readonly (keyof ModifierOptions)[] = Object.freeze(
  RANDSUM_MODIFIERS.map(m => m.name)
)

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
  return Array.from(RANDSUM_MODIFIERS)
}

/**
 * Parse notation string into ModifierOptions.
 */
export function parseModifiers(notation: string): ModifierOptions {
  const result: ModifierOptions = {}

  for (const modifier of RANDSUM_MODIFIERS) {
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
    throw new ModifierError(name, `Unknown modifier type: ${name}`, {
      path: `modifiers.${name}`,
      value: options
    })
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
    const log =
      modifier.mutatesRolls === false
        ? createArithmeticLog(name, options)
        : createModifierLog(name, options, initialRolls, applied.rolls, applied.replacements)

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
  const initialState: RegistryProcessResult = {
    rolls: [...initialRolls],
    logs: [],
    totalTransformers: []
  }

  return MODIFIER_ORDER.reduce((state, name) => {
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

  return MODIFIER_ORDER.map(name => modifierToNotation(name, modifiers[name]))
    .filter((notation): notation is string => typeof notation === 'string')
    .join('')
}

/**
 * Process all modifiers to descriptions.
 */
export function processModifierDescriptions(modifiers: ModifierOptions | undefined): string[] {
  if (!modifiers) return []

  return MODIFIER_ORDER.map(name => modifierToDescription(name, modifiers[name]))
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
  for (const modifier of RANDSUM_MODIFIERS) {
    const options = modifiers[modifier.name]
    if (options !== undefined && modifier.validate) {
      modifier.validate(options, rollContext)
    }
  }
}
