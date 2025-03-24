import type { NumericRollBonus, RerollOptions } from '~types'
import { formatGreaterLessDescriptions } from '~utils/descriptionFormatters/formatGreaterLessDescriptions'
import { formatHumanList } from '~utils/formatHumanList'
import { formatGreaterLessNotation } from '~utils/notationFormatters/formatGreaterLessNotation'
import { maxNotation } from '~utils/notationFormatters/maxNotation'

export class RerollModifier {
  private options: RerollOptions | undefined
  constructor(options: RerollOptions | undefined) {
    this.options = options
  }

  apply(rolls: number[], rollOne: () => number): NumericRollBonus {
    if (this.options === undefined) return { rolls, simpleMathModifier: 0 }

    return {
      rolls: [...rolls].map((roll) =>
        this.rerollRoll(roll, this.options as RerollOptions, rollOne)
      ),
      simpleMathModifier: 0
    }
  }

  toDescription(): string | undefined {
    if (this.options === undefined) return undefined
    const rerollList: string[] = []

    if (this.options.exact) {
      this.options.exact.forEach((roll) => {
        rerollList.push(String(roll))
      })
    }
    const greaterLess = `${formatGreaterLessDescriptions(this.options).join(' and ')}`

    const exactList = formatHumanList(rerollList)

    const exactString = [exactList, greaterLess]
      .filter((i) => i !== '')
      .join(', ')

    if (exactString === '') return undefined
    const coreString = `Reroll ${exactString}`

    if (this.options.max) {
      return `${coreString} (up to ${this.options.max} times)`
    }

    return coreString
  }

  toNotation(): string | undefined {
    if (this.options === undefined) return undefined
    const rerollList = []

    if (this.options.exact) {
      this.options.exact.forEach((roll) => {
        rerollList.push(String(roll))
      })
    }
    const greaterLess = formatGreaterLessNotation(this.options)
    if (greaterLess.length > 0) {
      rerollList.push(greaterLess.join(','))
    }

    if (rerollList.length === 0) return ''
    return `R{${rerollList.join(',')}}${maxNotation(this.options.max)}`
  }

  private extractExactValue(
    exact: number[] | undefined,
    roll: number
  ): boolean {
    if (exact === undefined) {
      return false
    }
    return exact.includes(roll)
  }

  private rerollRoll(
    roll: number,
    { greaterThan, lessThan, exact, max }: RerollOptions,
    rollOne: () => number,
    index = 0
  ): number {
    if (max === index) {
      return roll
    }
    if (index === 99) {
      return roll
    }

    if (
      (greaterThan !== undefined && roll > greaterThan) ||
      (lessThan !== undefined && roll < lessThan) ||
      this.extractExactValue(exact, roll)
    ) {
      return this.rerollRoll(
        rollOne(),
        { greaterThan, lessThan, exact, max },
        rollOne,
        index + 1
      )
    }
    return roll
  }
}
