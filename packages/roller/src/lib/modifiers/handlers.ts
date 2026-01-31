import type {
  ComparisonOptions,
  DropOptions,
  KeepOptions,
  ModifierOptions,
  NumericRollBonus,
  ReplaceOptions,
  RequiredNumericRollParameters,
  RerollOptions,
  SuccessCountOptions,
  UniqueOptions
} from '../../types'
import {
  applyCapping,
  applyCompounding,
  applyDropping,
  applyExploding,
  applyKeeping,
  applyPenetrating,
  applyReplacing,
  applyRerolling,
  applyUnique
} from './apply'
import { createModifierLog, mergeLogs } from './log'
import { invariant } from '../invariant'

/**
 * Context object passed to modifier handlers that require additional dependencies.
 */
export interface ModifierContext {
  rollOne?: (() => number) | undefined
  context?: RequiredNumericRollParameters | undefined
}

/**
 * Handler for the 'plus' modifier - adds a fixed value to the total.
 */
function handlePlus(bonus: NumericRollBonus, options: number): NumericRollBonus {
  return {
    rolls: bonus.rolls,
    simpleMathModifier: options,
    logs: bonus.logs
  }
}

/**
 * Handler for the 'minus' modifier - subtracts a fixed value from the total.
 */
function handleMinus(bonus: NumericRollBonus, options: number): NumericRollBonus {
  return {
    rolls: bonus.rolls,
    simpleMathModifier: -options,
    logs: bonus.logs
  }
}

/**
 * Handler for the 'cap' modifier - caps roll values to a range.
 */
function handleCap(
  bonus: NumericRollBonus,
  options: ComparisonOptions,
  _ctx: ModifierContext
): NumericRollBonus {
  const initialRolls = [...bonus.rolls]
  const newRolls = applyCapping(bonus.rolls, options)
  const log = createModifierLog('cap', options, initialRolls, newRolls)
  return {
    rolls: newRolls,
    simpleMathModifier: bonus.simpleMathModifier,
    logs: mergeLogs(bonus.logs, log)
  }
}

/**
 * Handler for the 'drop' modifier - removes dice from the result.
 */
function handleDrop(
  bonus: NumericRollBonus,
  options: DropOptions,
  _ctx: ModifierContext
): NumericRollBonus {
  const initialRolls = [...bonus.rolls]
  const newRolls = applyDropping(bonus.rolls, options)
  const log = createModifierLog('drop', options, initialRolls, newRolls)
  return {
    rolls: newRolls,
    simpleMathModifier: bonus.simpleMathModifier,
    logs: mergeLogs(bonus.logs, log)
  }
}

/**
 * Handler for the 'keep' modifier - keeps specified dice from the result.
 */
function handleKeep(
  bonus: NumericRollBonus,
  options: KeepOptions,
  _ctx: ModifierContext
): NumericRollBonus {
  const initialRolls = [...bonus.rolls]
  const newRolls = applyKeeping(bonus.rolls, options)
  const log = createModifierLog('keep', options, initialRolls, newRolls)
  return {
    rolls: newRolls,
    simpleMathModifier: bonus.simpleMathModifier,
    logs: mergeLogs(bonus.logs, log)
  }
}

/**
 * Handler for the 'reroll' modifier - rerolls dice matching conditions.
 */
function handleReroll(
  bonus: NumericRollBonus,
  options: RerollOptions,
  ctx: ModifierContext
): NumericRollBonus {
  invariant(ctx.rollOne !== undefined, 'rollOne function required for reroll modifier')
  const initialRolls = [...bonus.rolls]
  const newRolls = applyRerolling(bonus.rolls, options, ctx.rollOne)
  const log = createModifierLog('reroll', options, initialRolls, newRolls)
  return {
    rolls: newRolls,
    simpleMathModifier: bonus.simpleMathModifier,
    logs: mergeLogs(bonus.logs, log)
  }
}

/**
 * Handler for the 'explode' modifier - rerolls and adds on max value.
 */
function handleExplode(
  bonus: NumericRollBonus,
  options: boolean | number,
  ctx: ModifierContext
): NumericRollBonus {
  if (ctx.rollOne === undefined || ctx.context === undefined) {
    throw new Error('rollOne and context required for explode modifier')
  }
  const maxDepth = typeof options === 'number' ? options : 1
  const initialRolls = [...bonus.rolls]
  const newRolls = applyExploding(bonus.rolls, ctx.context, ctx.rollOne, maxDepth)
  const log = createModifierLog('explode', options, initialRolls, newRolls)
  return {
    rolls: newRolls,
    simpleMathModifier: bonus.simpleMathModifier,
    logs: mergeLogs(bonus.logs, log)
  }
}

/**
 * Handler for the 'unique' modifier - ensures all dice show different values.
 */
function handleUnique(
  bonus: NumericRollBonus,
  options: boolean | UniqueOptions,
  ctx: ModifierContext
): NumericRollBonus {
  if (ctx.rollOne === undefined || ctx.context === undefined) {
    throw new Error('rollOne and context required for unique modifier')
  }
  const initialRolls = [...bonus.rolls]
  const newRolls = applyUnique(bonus.rolls, options, ctx.context, ctx.rollOne)
  const log = createModifierLog('unique', options, initialRolls, newRolls)
  return {
    rolls: newRolls,
    simpleMathModifier: bonus.simpleMathModifier,
    logs: mergeLogs(bonus.logs, log)
  }
}

/**
 * Handler for the 'replace' modifier - replaces specific values.
 */
function handleReplace(
  bonus: NumericRollBonus,
  options: ReplaceOptions | ReplaceOptions[],
  _ctx: ModifierContext
): NumericRollBonus {
  const initialRolls = [...bonus.rolls]
  const newRolls = applyReplacing(bonus.rolls, options)
  const log = createModifierLog('replace', options, initialRolls, newRolls)
  return {
    rolls: newRolls,
    simpleMathModifier: bonus.simpleMathModifier,
    logs: mergeLogs(bonus.logs, log)
  }
}

/**
 * Handler for the 'countSuccesses' modifier - counts successes instead of summing.
 *
 * Note: This modifier doesn't change the rolls themselves, but affects
 * how the total is calculated. The actual counting happens in generateHistory.
 */
function handleSuccessCount(
  bonus: NumericRollBonus,
  _options: SuccessCountOptions,
  _ctx: ModifierContext
): NumericRollBonus {
  // Success counting doesn't modify rolls, just marks that counting should happen
  // The actual counting logic is in generateHistory
  return bonus
}

/**
 * Handler for the 'compound' modifier - compounding exploding dice.
 */
function handleCompound(
  bonus: NumericRollBonus,
  options: boolean | number,
  ctx: ModifierContext
): NumericRollBonus {
  if (ctx.rollOne === undefined || ctx.context === undefined) {
    throw new Error('rollOne and context required for compound modifier')
  }
  const maxDepth = typeof options === 'number' ? options : 1
  const initialRolls = [...bonus.rolls]
  const newRolls = applyCompounding(bonus.rolls, ctx.context, ctx.rollOne, maxDepth)
  const log = createModifierLog('compound', options, initialRolls, newRolls)
  return {
    rolls: newRolls,
    simpleMathModifier: bonus.simpleMathModifier,
    logs: mergeLogs(bonus.logs, log)
  }
}

/**
 * Handler for the 'penetrate' modifier - penetrating exploding dice.
 */
function handlePenetrate(
  bonus: NumericRollBonus,
  options: boolean | number,
  ctx: ModifierContext
): NumericRollBonus {
  if (ctx.rollOne === undefined || ctx.context === undefined) {
    throw new Error('rollOne and context required for penetrate modifier')
  }
  const maxDepth = typeof options === 'number' ? options : 1
  const initialRolls = [...bonus.rolls]
  const newRolls = applyPenetrating(bonus.rolls, ctx.context, ctx.rollOne, maxDepth)
  const log = createModifierLog('penetrate', options, initialRolls, newRolls)
  return {
    rolls: newRolls,
    simpleMathModifier: bonus.simpleMathModifier,
    logs: mergeLogs(bonus.logs, log)
  }
}

/**
 * Handler for the 'multiply' modifier - multiplies dice sum before arithmetic.
 *
 * Note: This modifier doesn't change the rolls themselves.
 * The actual multiplication happens in generateHistory.
 */
function handleMultiply(
  bonus: NumericRollBonus,
  _options: number,
  _ctx: ModifierContext
): NumericRollBonus {
  // Multiply doesn't modify rolls, it's applied to the total later
  return bonus
}

/**
 * Handler for the 'multiplyTotal' modifier - multiplies final total.
 *
 * Note: This modifier doesn't change the rolls themselves.
 * The actual multiplication happens in generateHistory.
 */
function handleMultiplyTotal(
  bonus: NumericRollBonus,
  _options: number,
  _ctx: ModifierContext
): NumericRollBonus {
  // MultiplyTotal doesn't modify rolls, it's applied to the total later
  return bonus
}

/**
 * Applies a modifier to a NumericRollBonus using strongly-typed handlers.
 *
 * Type assertions in switch cases are safe because:
 * 1. The `type` parameter is a literal type that matches the case
 * 2. The `options` parameter is guaranteed to match the type at runtime
 * 3. This is much safer than the previous `as unknown as` pattern
 */
export function applyModifierHandler(
  type: keyof ModifierOptions,
  options: NonNullable<ModifierOptions[keyof ModifierOptions]>,
  bonus: NumericRollBonus,
  ctx: ModifierContext = {}
): NumericRollBonus {
  switch (type) {
    case 'plus':
      // Safe: when type === 'plus', options is guaranteed to be number
      return handlePlus(bonus, options as number)
    case 'minus':
      // Safe: when type === 'minus', options is guaranteed to be number
      return handleMinus(bonus, options as number)
    case 'cap':
      // Safe: when type === 'cap', options is guaranteed to be ComparisonOptions
      return handleCap(bonus, options as ComparisonOptions, ctx)
    case 'drop':
      // Safe: when type === 'drop', options is guaranteed to be DropOptions
      return handleDrop(bonus, options as DropOptions, ctx)
    case 'keep':
      // Safe: when type === 'keep', options is guaranteed to be KeepOptions
      return handleKeep(bonus, options as KeepOptions, ctx)
    case 'reroll':
      // Safe: when type === 'reroll', options is guaranteed to be RerollOptions
      return handleReroll(bonus, options as RerollOptions, ctx)
    case 'explode':
      // Safe: when type === 'explode', options is guaranteed to be boolean | number
      return handleExplode(bonus, options as boolean | number, ctx)
    case 'unique':
      // Safe: when type === 'unique', options is guaranteed to be boolean | UniqueOptions
      return handleUnique(bonus, options as boolean | UniqueOptions, ctx)
    case 'replace':
      // Safe: when type === 'replace', options is guaranteed to be ReplaceOptions | ReplaceOptions[]
      return handleReplace(bonus, options as ReplaceOptions | ReplaceOptions[], ctx)
    case 'countSuccesses':
      // Safe: when type === 'countSuccesses', options is guaranteed to be SuccessCountOptions
      return handleSuccessCount(bonus, options as SuccessCountOptions, ctx)
    case 'compound':
      // Safe: when type === 'compound', options is guaranteed to be boolean | number
      return handleCompound(bonus, options as boolean | number, ctx)
    case 'penetrate':
      // Safe: when type === 'penetrate', options is guaranteed to be boolean | number
      return handlePenetrate(bonus, options as boolean | number, ctx)
    case 'multiply':
      // Safe: when type === 'multiply', options is guaranteed to be number
      return handleMultiply(bonus, options as number, ctx)
    case 'multiplyTotal':
      // Safe: when type === 'multiplyTotal', options is guaranteed to be number
      return handleMultiplyTotal(bonus, options as number, ctx)
    default: {
      // Exhaustiveness check - TypeScript will error if a modifier type is missing
      const _exhaustive: never = type
      throw new Error(`Unknown modifier type: ${String(_exhaustive)}`)
    }
  }
}
