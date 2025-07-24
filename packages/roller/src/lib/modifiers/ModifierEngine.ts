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

    const initialRolls = [...bonus.rolls]
    let newRolls: number[]
    let log: ReturnType<typeof createModifierLog>

    switch (type) {
      case 'plus':
        return {
          rolls: bonus.rolls,
          simpleMathModifier: Number(options),
          logs: bonus.logs
        }

      case 'minus':
        return {
          rolls: bonus.rolls,
          simpleMathModifier: -Number(options),
          logs: bonus.logs
        }

      case 'cap':
        newRolls = applyCapping(bonus.rolls, options as ComparisonOptions)
        log = createModifierLog('cap', options, initialRolls, newRolls)
        break

      case 'drop':
        newRolls = applyDropping(bonus.rolls, options as DropOptions)
        log = createModifierLog('drop', options, initialRolls, newRolls)
        break

      case 'reroll':
        if (!rollOne)
          throw new Error('rollOne function required for reroll modifier')
        newRolls = applyRerolling(
          bonus.rolls,
          options as RerollOptions,
          rollOne
        )
        log = createModifierLog(
          'reroll',
          options || undefined,
          initialRolls,
          newRolls
        )
        break

      case 'explode':
        if (!rollOne || !context)
          throw new Error('rollOne and context required for explode modifier')
        newRolls = applyExploding(bonus.rolls, context, rollOne)
        log = createModifierLog(
          'explode',
          options || undefined,
          initialRolls,
          newRolls
        )
        break

      case 'unique':
        if (!rollOne || !context)
          throw new Error('rollOne and context required for unique modifier')
        newRolls = applyUnique(
          bonus.rolls,
          options as boolean | UniqueOptions,
          context,
          rollOne
        )
        log = createModifierLog('unique', options, initialRolls, newRolls)
        break

      case 'replace':
        newRolls = applyReplacing(
          bonus.rolls,
          options as ReplaceOptions | ReplaceOptions[]
        )
        log = createModifierLog('replace', options, initialRolls, newRolls)
        break

      default:
        throw new Error(`Unknown modifier type: ${String(type)}`)
    }

    return {
      rolls: newRolls,
      simpleMathModifier: bonus.simpleMathModifier,
      logs: mergeLogs(bonus.logs, log)
    }
  }

  public static toDescription(
    type: keyof ModifierOptions,
    options: ModifierOptions[keyof ModifierOptions]
  ): string[] | undefined {
    if (options === undefined) return undefined

    switch (type) {
      case 'plus':
        return [`Add ${options as number}`]

      case 'minus':
        return [`Subtract ${options as number}`]

      case 'cap':
        return formatComparisonDescription(options as ComparisonOptions).map(
          (str) => `No Rolls ${str}`
        )

      case 'drop':
        return ModifierEngine.formatDropDescription(options as DropOptions)

      case 'reroll':
        return ModifierEngine.formatRerollDescription(options as RerollOptions)

      case 'explode':
        return ['Exploding Dice']

      case 'unique':
        if (typeof options === 'boolean') {
          return ['No Duplicate Rolls']
        }
        return [
          `No Duplicates (except ${formatHumanList((options as UniqueOptions).notUnique)})`
        ]

      case 'replace':
        return ModifierEngine.formatReplaceDescription(
          options as ReplaceOptions | ReplaceOptions[]
        )

      default:
        return undefined
    }
  }

  public static toNotation(
    type: keyof ModifierOptions,
    options: ModifierOptions[keyof ModifierOptions]
  ): string | undefined {
    if (options === undefined) return undefined

    switch (type) {
      case 'plus': {
        const numOptions = options as number
        if (numOptions < 0) {
          return `-${Math.abs(numOptions)}`
        }
        return `+${numOptions}`
      }

      case 'minus':
        return `-${options as number}`

      case 'cap': {
        const capList = formatComparisonNotation(options as ComparisonOptions)
        return capList.length > 0 ? `C{${capList.join(',')}}` : undefined
      }

      case 'drop':
        return ModifierEngine.formatDropNotation(options as DropOptions)

      case 'reroll':
        return ModifierEngine.formatRerollNotation(options as RerollOptions)

      case 'explode':
        return '!'

      case 'unique':
        if (typeof options === 'boolean') return 'U'
        return `U{${(options as UniqueOptions).notUnique.join(',')}}`

      case 'replace':
        return ModifierEngine.formatReplaceNotation(
          options as ReplaceOptions | ReplaceOptions[]
        )

      default:
        return undefined
    }
  }

  private static formatDropDescription(options: DropOptions): string[] {
    const descriptions: string[] = []

    if (options.highest) {
      if (options.highest > 1) {
        descriptions.push(`Drop highest ${options.highest}`)
      }
      if (options.highest && options.highest <= 1) {
        descriptions.push('Drop highest')
      }
    }

    if (options.lowest) {
      if (options.lowest > 1) {
        descriptions.push(`Drop lowest ${options.lowest}`)
      }
      if (options.lowest && options.lowest <= 1) {
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

  private static formatDropNotation(options: DropOptions): string | undefined {
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
      options.exact.forEach((roll) => dropList.push(String(roll)))
    }

    if (dropList.length > 0) {
      parts.push(`D{${dropList.join(',')}}`)
    }

    return parts.length > 0 ? parts.join('') : undefined
  }

  private static formatRerollDescription(options: RerollOptions): string[] {
    const rerollList: string[] = []

    if (options.exact) {
      options.exact.forEach((roll) => rerollList.push(String(roll)))
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

    const exactString = [exactList, greaterLess]
      .filter((i) => i !== '')
      .join(', ')

    if (exactString === '') return []

    const coreString = `Reroll ${exactString}`
    const maxText =
      options.max !== undefined ? ` (up to ${options.max} times)` : ''

    return [`${coreString}${maxText}`]
  }

  private static formatRerollNotation(
    options: RerollOptions
  ): string | undefined {
    const parts = formatComparisonNotation(options)
    if (parts.length === 0) return undefined

    const maxSuffix = options.max !== undefined ? String(options.max) : ''
    return `R{${parts.join(',')}}${maxSuffix}`
  }

  private static formatReplaceDescription(
    options: ReplaceOptions | ReplaceOptions[]
  ): string[] {
    const rules = Array.isArray(options) ? options : [options]
    return rules.map(({ from, to }) => {
      if (typeof from === 'object') {
        const comparisons = formatComparisonDescription(from)
        return `Replace ${comparisons.join(' and ')} with [${to}]`
      }
      return `Replace [${from}] with [${to}]`
    })
  }

  private static formatReplaceNotation(
    options: ReplaceOptions | ReplaceOptions[]
  ): string | undefined {
    const rules = Array.isArray(options) ? options : [options]
    const notations = rules.map(({ from, to }) => {
      if (typeof from === 'object') {
        const comparisons = formatComparisonNotation(from)
        return comparisons.map((comp) => `${comp}=${to}`).join(',')
      }
      return `${from}=${to}`
    })

    return notations.length > 0 ? `V{${notations.join(',')}}` : undefined
  }
}
