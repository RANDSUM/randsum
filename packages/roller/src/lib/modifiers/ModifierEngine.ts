import type { RequiredNumericRollParameters } from '../../types/core'
import type {
  ComparisonOptions,
  DropOptions,
  ModifierOptions,
  NumericRollBonus,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from '../../types/modifiers'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  formatHumanList
} from '../comparison'
import { createModifierLog, mergeLogs } from './logging'
import {
  applyCapping,
  applyDropping,
  applyExploding,
  applyReplacing,
  applyRerolling,
  applyUnique
} from './transformers'

export const MODIFIER_ORDER: (keyof ModifierOptions)[] = [
  'cap',
  'drop',
  'replace',
  'reroll',
  'explode',
  'unique',
  'plus',
  'minus'
]

type ModifierHandler = (
  bonus: NumericRollBonus,
  options: ModifierOptions[keyof ModifierOptions],
  rollOne?: () => number,
  context?: RequiredNumericRollParameters
) => NumericRollBonus

const MODIFIER_HANDLERS = new Map<keyof ModifierOptions, ModifierHandler>([
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

// Helper functions for formatting descriptions
function formatDropDescription(options: DropOptions): string[] {
  const descriptions: string[] = []

  if (options.highest) {
    if (options.highest > 1) {
      descriptions.push(`Drop highest ${options.highest}`)
    } else {
      descriptions.push('Drop highest')
    }
  }

  if (options.lowest) {
    if (options.lowest > 1) {
      descriptions.push(`Drop lowest ${options.lowest}`)
    } else {
      descriptions.push('Drop lowest')
    }
  }

  if (options.exact) {
    descriptions.push(`Drop ${formatHumanList(options.exact)}`)
  }

  if (options.greaterThan !== undefined) {
    descriptions.push(`Drop greater than [${options.greaterThan}]`)
  }

  if (options.lessThan !== undefined) {
    descriptions.push(`Drop less than [${options.lessThan}]`)
  }

  return descriptions
}

function formatRerollDescription(options: RerollOptions): string[] {
  const rerollList: string[] = []

  if (options.exact) {
    options.exact.forEach(roll => rerollList.push(`${roll}`))
  }

  const greaterLessList: string[] = []
  if (options.greaterThan !== undefined) {
    greaterLessList.push(`greater than [${options.greaterThan}]`)
  }
  if (options.lessThan !== undefined) {
    greaterLessList.push(`less than [${options.lessThan}]`)
  }

  const exactList = formatHumanList(rerollList.map(Number))
  const greaterLess = greaterLessList.join(' and ')

  const conditions = [exactList, greaterLess].filter(Boolean).join(', ')
  if (!conditions) return []

  const maxText = options.max !== undefined ? ` (up to ${options.max} times)` : ''
  return [`Reroll ${conditions}${maxText}`]
}

function formatReplaceDescription(options: ReplaceOptions | ReplaceOptions[]): string[] {
  const rules = Array.isArray(options) ? options : [options]
  return rules.map(({ from, to }) => {
    if (typeof from === 'object') {
      const comparisons = formatComparisonDescription(from)
      return `Replace ${comparisons.join(' and ')} with [${to}]`
    }
    return `Replace [${from}] with [${to}]`
  })
}

// Helper functions for formatting notation
function formatDropNotation(options: DropOptions): string | undefined {
  const parts: string[] = []

  if (options.highest) {
    parts.push(options.highest === 1 ? 'H' : `H${options.highest}`)
  }

  if (options.lowest) {
    parts.push(options.lowest === 1 ? 'L' : `L${options.lowest}`)
  }

  const dropList: string[] = []

  if (options.greaterThan !== undefined) {
    dropList.push(`>${options.greaterThan}`)
  }

  if (options.lessThan !== undefined) {
    dropList.push(`<${options.lessThan}`)
  }

  if (options.exact) {
    options.exact.forEach(roll => dropList.push(`${roll}`))
  }

  if (dropList.length > 0) {
    parts.push(`D{${dropList.join(',')}}`)
  }

  return parts.length ? parts.join('') : undefined
}

function formatRerollNotation(options: RerollOptions): string | undefined {
  const parts = formatComparisonNotation(options)
  if (!parts.length) return undefined

  const maxSuffix = options.max ? `${options.max}` : ''
  return `R{${parts.join(',')}}${maxSuffix}`
}

function formatReplaceNotation(options: ReplaceOptions | ReplaceOptions[]): string | undefined {
  const rules = Array.isArray(options) ? options : [options]
  const notations = rules.map(({ from, to }) => {
    if (typeof from === 'object') {
      const comparisons = formatComparisonNotation(from)
      return comparisons.map(comp => `${comp}=${to}`).join(',')
    }
    return `${from}=${to}`
  })

  return notations.length ? `V{${notations.join(',')}}` : undefined
}

// Description handler lookup table
type DescriptionHandler = (options: ModifierOptions[keyof ModifierOptions]) => string[] | undefined

const DESCRIPTION_HANDLERS = new Map<keyof ModifierOptions, DescriptionHandler>([
  ['plus', options => [`Add ${options as number}`]],
  ['minus', options => [`Subtract ${options as number}`]],
  [
    'cap',
    options =>
      formatComparisonDescription(options as ComparisonOptions).map(str => `No Rolls ${str}`)
  ],
  ['drop', options => formatDropDescription(options as DropOptions)],
  ['reroll', options => formatRerollDescription(options as RerollOptions)],
  ['explode', () => ['Exploding Dice']],
  [
    'unique',
    options => {
      if (typeof options === 'boolean') {
        return ['No Duplicate Rolls']
      }
      return [`No Duplicates (except ${formatHumanList((options as UniqueOptions).notUnique)})`]
    }
  ],
  ['replace', options => formatReplaceDescription(options as ReplaceOptions | ReplaceOptions[])]
])

// Notation handler lookup table
type NotationHandler = (options: ModifierOptions[keyof ModifierOptions]) => string | undefined

const NOTATION_HANDLERS = new Map<keyof ModifierOptions, NotationHandler>([
  [
    'plus',
    options => {
      const numOptions = options as number
      if (numOptions < 0) {
        return `-${Math.abs(numOptions)}`
      }
      return `+${numOptions}`
    }
  ],
  ['minus', options => `-${options as number}`],
  [
    'cap',
    options => {
      const capList = formatComparisonNotation(options as ComparisonOptions)
      return capList.length ? `C{${capList.join(',')}}` : undefined
    }
  ],
  ['drop', options => formatDropNotation(options as DropOptions)],
  ['reroll', options => formatRerollNotation(options as RerollOptions)],
  ['explode', () => '!'],
  [
    'unique',
    options => {
      if (typeof options === 'boolean') return 'U'
      return `U{${(options as UniqueOptions).notUnique.join(',')}}`
    }
  ],
  ['replace', options => formatReplaceNotation(options as ReplaceOptions | ReplaceOptions[])]
])

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ModifierEngine {
  public static apply(
    type: keyof ModifierOptions,
    options: ModifierOptions[keyof ModifierOptions],
    bonus: NumericRollBonus,
    context?: RequiredNumericRollParameters,
    rollOne?: () => number
  ): NumericRollBonus {
    if (options === undefined) {
      return bonus
    }

    const handler = MODIFIER_HANDLERS.get(type)
    if (!handler) {
      throw new Error(`Unknown modifier type: ${type}`)
    }

    return handler(bonus, options, rollOne, context)
  }

  public static toDescription(
    type: keyof ModifierOptions,
    options: ModifierOptions[keyof ModifierOptions]
  ): string[] | undefined {
    if (options === undefined) return undefined

    const handler = DESCRIPTION_HANDLERS.get(type)
    return handler ? handler(options) : undefined
  }

  public static toNotation(
    type: keyof ModifierOptions,
    options: ModifierOptions[keyof ModifierOptions]
  ): string | undefined {
    if (options === undefined) return undefined

    const handler = NOTATION_HANDLERS.get(type)
    return handler ? handler(options) : undefined
  }
}
