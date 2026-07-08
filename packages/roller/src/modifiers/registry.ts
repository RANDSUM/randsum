import type { ModifierLog, ModifierOptions, RequiredNumericRollParameters } from '../types'
import type {
  ModifierContext,
  ModifierDefinition,
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
  if (modifier.requiresRandomFn && ctx.randomFn === undefined) {
    throw new ModifierError(name, `randomFn function required for ${name} modifier`)
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
  // Push into local accumulators instead of rebuilding logs/transformers arrays
  // via spread on every modifier (which was O(n^2) in the number of modifiers).
  // Rolls are threaded through the fold's return value — O(1) reassignment, no
  // per-step spread.
  const logs: ModifierLog[] = []
  const totalTransformers: TotalTransformer[] = []

  const rolls = MODIFIER_ORDER.reduce<number[]>(
    (currentRolls, name) => {
      const options = modifiers[name]
      if (options === undefined) {
        return currentRolls
      }

      const result = applyModifier(name, options, currentRolls, ctx)
      if (result.log) {
        logs.push(result.log)
      }
      if (result.transformTotal) {
        totalTransformers.push(result.transformTotal)
      }
      return result.rolls
    },
    [...initialRolls]
  )

  return { rolls, logs, totalTransformers }
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
