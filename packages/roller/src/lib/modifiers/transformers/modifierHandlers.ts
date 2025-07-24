import type {
  ComparisonOptions,
  DropOptions,
  ModifierOptions,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from '../../../types'
import { createModifierLog, mergeLogs } from '../logging'
import { applyCapping } from './applyCapping'
import { applyDropping } from './applyDropping'
import { applyExploding } from './applyExploding'
import { applyReplacing } from './applyReplacing'
import { applyRerolling } from './applyRerolling'
import { applyUnique } from './applyUnique'
import type { ModifierHandler } from '../types'

export const MODIFIER_HANDLERS: ReadonlyMap<keyof ModifierOptions, ModifierHandler> = new Map<
  keyof ModifierOptions,
  ModifierHandler
>([
  [
    'plus',
    (bonus, options) => ({
      rolls: bonus.rolls,
      simpleMathModifier: Number(options),
      logs: bonus.logs
    })
  ],
  [
    'minus',
    (bonus, options) => ({
      rolls: bonus.rolls,
      simpleMathModifier: -Number(options),
      logs: bonus.logs
    })
  ],
  [
    'cap',
    (bonus, options) => {
      const initialRolls = [...bonus.rolls]
      const newRolls = applyCapping(bonus.rolls, options as ComparisonOptions)
      const log = createModifierLog('cap', options as ComparisonOptions, initialRolls, newRolls)
      return {
        rolls: newRolls,
        simpleMathModifier: bonus.simpleMathModifier,
        logs: mergeLogs(bonus.logs, log)
      }
    }
  ],
  [
    'drop',
    (bonus, options) => {
      const initialRolls = [...bonus.rolls]
      const newRolls = applyDropping(bonus.rolls, options as DropOptions)
      const log = createModifierLog('drop', options as DropOptions, initialRolls, newRolls)
      return {
        rolls: newRolls,
        simpleMathModifier: bonus.simpleMathModifier,
        logs: mergeLogs(bonus.logs, log)
      }
    }
  ],
  [
    'reroll',
    (bonus, options, rollOne) => {
      if (!rollOne) throw new Error('rollOne function required for reroll modifier')
      const initialRolls = [...bonus.rolls]
      const newRolls = applyRerolling(bonus.rolls, options as RerollOptions, rollOne)
      const log = createModifierLog('reroll', options as RerollOptions, initialRolls, newRolls)
      return {
        rolls: newRolls,
        simpleMathModifier: bonus.simpleMathModifier,
        logs: mergeLogs(bonus.logs, log)
      }
    }
  ],
  [
    'explode',
    (bonus, options, rollOne, context) => {
      if (!rollOne || !context) throw new Error('rollOne and context required for explode modifier')
      const initialRolls = [...bonus.rolls]
      const newRolls = applyExploding(bonus.rolls, context, rollOne)
      const log = createModifierLog('explode', options as boolean, initialRolls, newRolls)
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
      if (!rollOne || !context) throw new Error('rollOne and context required for unique modifier')
      const initialRolls = [...bonus.rolls]
      const newRolls = applyUnique(
        bonus.rolls,
        options as boolean | UniqueOptions,
        context,
        rollOne
      )
      const log = createModifierLog(
        'unique',
        options as boolean | UniqueOptions,
        initialRolls,
        newRolls
      )
      return {
        rolls: newRolls,
        simpleMathModifier: bonus.simpleMathModifier,
        logs: mergeLogs(bonus.logs, log)
      }
    }
  ],
  [
    'replace',
    (bonus, options) => {
      const initialRolls = [...bonus.rolls]
      const newRolls = applyReplacing(bonus.rolls, options as ReplaceOptions | ReplaceOptions[])
      const log = createModifierLog(
        'replace',
        options as ReplaceOptions | ReplaceOptions[],
        initialRolls,
        newRolls
      )
      return {
        rolls: newRolls,
        simpleMathModifier: bonus.simpleMathModifier,
        logs: mergeLogs(bonus.logs, log)
      }
    }
  ]
])
