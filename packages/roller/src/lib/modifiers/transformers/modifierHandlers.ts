import type { ModifierOptions, RequiredNumericRollParameters, UniqueOptions } from '../../../types'

import { applyCapping } from './applyCapping'
import { applyDropping } from './applyDropping'
import { applyExploding } from './applyExploding'
import { applyReplacing } from './applyReplacing'
import { applyRerolling } from './applyRerolling'
import { applyUnique } from './applyUnique'
import type { ModifierHandler } from '../types'
import { createModifierLog } from '../logging/createModifierLog'
import { mergeLogs } from '../logging/mergeLogs'
import { ERROR_MESSAGES } from '../../constants'

function createRollModifierHandler<T>(
  modifierName: keyof ModifierOptions,
  applyFunction: (
    rolls: number[],
    options: T,
    rollOne?: () => number,
    context?: RequiredNumericRollParameters
  ) => number[]
): ModifierHandler {
  return (bonus, options, rollOne, context) => {
    const initialRolls = [...bonus.rolls]
    const newRolls = applyFunction(bonus.rolls, options as T, rollOne, context)
    const log = createModifierLog(modifierName, options, initialRolls, newRolls)
    return {
      rolls: newRolls,
      simpleMathModifier: bonus.simpleMathModifier,
      logs: mergeLogs(bonus.logs, log)
    }
  }
}

function createRollModifierHandlerWithRollOne<T>(
  modifierName: keyof ModifierOptions,
  applyFunction: (
    rolls: number[],
    options: T,
    rollOne: () => number,
    context?: RequiredNumericRollParameters
  ) => number[]
): ModifierHandler {
  return (bonus, options, rollOne, context) => {
    if (!rollOne) throw new Error(ERROR_MESSAGES.ROLL_ONE_REQUIRED(modifierName))
    const initialRolls = [...bonus.rolls]
    const newRolls = applyFunction(bonus.rolls, options as T, rollOne, context)
    const log = createModifierLog(modifierName, options, initialRolls, newRolls)
    return {
      rolls: newRolls,
      simpleMathModifier: bonus.simpleMathModifier,
      logs: mergeLogs(bonus.logs, log)
    }
  }
}

// Helper for simple math modifiers
function createMathModifierHandler(multiplier: number): ModifierHandler {
  return (bonus, options) => ({
    rolls: bonus.rolls,
    simpleMathModifier: Number(options) * multiplier,
    logs: bonus.logs
  })
}

export const MODIFIER_HANDLERS: ReadonlyMap<keyof ModifierOptions, ModifierHandler> = new Map<
  keyof ModifierOptions,
  ModifierHandler
>([
  ['plus', createMathModifierHandler(1)],
  ['minus', createMathModifierHandler(-1)],
  ['cap', createRollModifierHandler('cap', applyCapping)],
  ['drop', createRollModifierHandler('drop', applyDropping)],
  ['reroll', createRollModifierHandlerWithRollOne('reroll', applyRerolling)],
  [
    'explode',
    (bonus, options, rollOne, context) => {
      if (!rollOne || !context) throw new Error(ERROR_MESSAGES.ROLL_ONE_CONTEXT_REQUIRED('explode'))
      const initialRolls = [...bonus.rolls]
      const newRolls = applyExploding(bonus.rolls, context, rollOne)
      const log = createModifierLog('explode', options, initialRolls, newRolls)
      return {
        rolls: newRolls,
        simpleMathModifier: bonus.simpleMathModifier,
        logs: mergeLogs(bonus.logs, log)
      }
    }
  ],
  [
    'unique',
    (bonus, options, rollOne, context) => {
      if (!rollOne || !context) throw new Error(ERROR_MESSAGES.ROLL_ONE_CONTEXT_REQUIRED('unique'))
      const initialRolls = [...bonus.rolls]
      const newRolls = applyUnique(
        bonus.rolls,
        options as boolean | UniqueOptions,
        context,
        rollOne
      )
      const log = createModifierLog('unique', options, initialRolls, newRolls)
      return {
        rolls: newRolls,
        simpleMathModifier: bonus.simpleMathModifier,
        logs: mergeLogs(bonus.logs, log)
      }
    }
  ],
  ['replace', createRollModifierHandler('replace', applyReplacing)]
])
