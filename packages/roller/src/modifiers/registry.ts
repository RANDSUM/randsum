import type { ModifierLog, ModifierOptions } from '../types'
import type {
  ModifierContext,
  ModifierValidationContext,
  RegistryProcessResult,
  TotalTransformer
} from './schema'
import { MODIFIERS_BY_NAME, RANDSUM_MODIFIERS } from './definitions'
import { createArithmeticLog, createModifierLog } from './log'

/** Modifier execution order, computed once at module init. */
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

  const modifier = MODIFIERS_BY_NAME[name]

  // A modifier throws ModifierError (with context) for bad input; anything else
  // is a bug and propagates unchanged rather than being reported as user error.
  const initialRolls = [...rolls]
  const applied = modifier.apply(rolls, options, ctx)
  const log =
    modifier.mutatesRolls === false
      ? createArithmeticLog(name, options)
      : createModifierLog(name, options, initialRolls, applied.rolls, applied.replacements)

  return applied.transformTotal
    ? { rolls: applied.rolls, log, transformTotal: applied.transformTotal }
    : { rolls: applied.rolls, log }
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
  rollContext: ModifierValidationContext
): void {
  for (const modifier of RANDSUM_MODIFIERS) {
    const options = modifiers[modifier.name]
    if (options !== undefined && modifier.validate) {
      modifier.validate(options, rollContext)
    }
  }
}
