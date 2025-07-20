import type {
  DropOptions,
  ModifierOptions,
  NumericRollBonus
} from '../../types'
import { BaseModifier } from './BaseModifier'

export class DropModifier extends BaseModifier<DropOptions> {
  public static readonly highestPattern: RegExp = /[Hh]\d*/g
  public static readonly lowestPattern: RegExp = /[Ll]\d*/g
  public static readonly constraintsPattern: RegExp =
    this.createBracedComparisonPattern(/[Dd]/.source)
  public static parseConstraints(
    notations: string[]
  ): Pick<ModifierOptions, 'drop'> {
    if (notations.length === 0) {
      return {}
    }
    const dropConstraintParameters: DropOptions = {}

    return notations.reduce(
      (acc, notationString) => {
        const constraints = (notationString.split(/[Dd]/)[1] ?? '')
          .replaceAll('{', '')
          .replaceAll('}', '')
          .split(',')
        const parsedConstraints = constraints.reduce((innerAcc, constraint) => {
          if (constraint.includes('<')) {
            return {
              ...innerAcc,
              lessThan: Number(constraint.split('<')[1])
            }
          }

          if (constraint.includes('>')) {
            return {
              ...innerAcc,
              greaterThan: Number(constraint.split('>')[1])
            }
          }

          const exact = [...(innerAcc.exact ?? []), Number(constraint)]

          return {
            ...innerAcc,
            exact
          }
        }, dropConstraintParameters)

        return {
          drop: {
            ...acc.drop,
            ...parsedConstraints
          }
        }
      },
      { drop: dropConstraintParameters }
    )
  }

  public static parseHigh(notations: string[]): Pick<ModifierOptions, 'drop'> {
    if (notations.length === 0) {
      return {}
    }

    const notationString = notations[notations.length - 1] ?? ''
    const highestCount = notationString.split(/[Hh]/)[1]

    if (highestCount === '') {
      return {
        drop: { highest: 1 }
      }
    }

    return {
      drop: { highest: Number(highestCount) }
    }
  }

  public static parseLow(notations: string[]): Pick<ModifierOptions, 'drop'> {
    if (notations.length === 0) {
      return { drop: {} }
    }
    const notationString = notations[notations.length - 1] ?? ''
    const lowestCount = notationString.split(/[Ll]/)[1]

    if (lowestCount === '') {
      return {
        drop: {
          lowest: 1
        }
      }
    }

    return {
      drop: {
        lowest: Number(lowestCount)
      }
    }
  }

  public static override parse = (
    modifiersString: string
  ): Pick<ModifierOptions, 'drop'> => {
    const dropHighModifiers = DropModifier.parseHigh(
      this.extractMatches(modifiersString, DropModifier.highestPattern)
    )
    const dropLowModifiers = DropModifier.parseLow(
      this.extractMatches(modifiersString, DropModifier.lowestPattern)
    )
    const dropConstraintsModifiers = DropModifier.parseConstraints(
      this.extractMatches(modifiersString, DropModifier.constraintsPattern)
    )

    const rawDropModifiers = {
      drop: {
        ...dropHighModifiers.drop,
        ...dropLowModifiers.drop,
        ...dropConstraintsModifiers.drop
      }
    }

    if (Object.keys(rawDropModifiers.drop).length > 0) {
      return rawDropModifiers
    }
    return {}
  }

  public apply(bonus: NumericRollBonus): NumericRollBonus {
    if (this.options === undefined) return bonus
    const { highest, lowest, greaterThan, lessThan, exact } = this.options

    const exactSet = exact ? new Set(exact) : null

    const filteredAndSorted = bonus.rolls
      .filter((roll) => {
        if (greaterThan !== undefined && roll > greaterThan) return false
        if (lessThan !== undefined && roll < lessThan) return false
        if (exactSet?.has(roll)) return false
        return true
      })
      .sort((a, b) => a - b)

    let startIndex = 0
    let endIndex = filteredAndSorted.length

    if (lowest !== undefined) {
      startIndex = Math.min(lowest, filteredAndSorted.length)
    }

    if (highest !== undefined) {
      endIndex = Math.max(0, filteredAndSorted.length - highest)
    }

    const finalResults = filteredAndSorted.slice(startIndex, endIndex)

    const logs = [
      ...bonus.logs,
      this.toModifierLog('drop', bonus.rolls, finalResults)
    ]

    return {
      ...bonus,
      rolls: finalResults,
      logs
    }
  }

  public toDescription(): string[] | undefined {
    if (this.options === undefined) return undefined
    const dropList = []

    if (this.options.highest && this.options.highest > 1)
      dropList.push(`Drop highest ${String(this.options.highest)}`)

    if (this.options.highest && this.options.highest <= 1)
      dropList.push(`Drop highest`)

    if (this.options.lowest && this.options.lowest > 1)
      dropList.push(`Drop lowest ${String(this.options.lowest)}`)

    if (this.options.lowest && this.options.lowest <= 1)
      dropList.push(`Drop lowest`)

    if (this.options.exact) {
      const exact = this.formatHumanList(this.options.exact)
      dropList.push(`Drop ${String(exact)}`)
    }

    this.formatGreaterLessDescription(this.options).forEach((str) =>
      dropList.push(`Drop ${String(str)}`)
    )

    return dropList
  }

  public toNotation(): string | undefined {
    if (this.options === undefined) return undefined
    const dropList: string[] = []
    const greaterLess = this.formatGreaterLessNotation(this.options)
    greaterLess.forEach((str) => dropList.push(str))
    if (this.options.exact) {
      this.options.exact.forEach((roll) => {
        dropList.push(String(roll))
      })
    }

    const finalList = []

    if (this.options.highest && this.options.highest > 1) {
      finalList.push(`H${String(this.options.highest)}`)
    }

    if (this.options.highest && this.options.highest <= 1) {
      finalList.push(`H`)
    }

    if (this.options.lowest && this.options.lowest > 1) {
      finalList.push(`L${String(this.options.lowest)}`)
    }

    if (this.options.lowest && this.options.lowest <= 1) {
      finalList.push(`L`)
    }

    if (dropList.length > 0) {
      finalList.push(`D{${dropList.map((str) => str).join(',')}}`)
    }

    return finalList.join('')
  }
}
