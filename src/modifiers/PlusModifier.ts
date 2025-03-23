import type { NumericRollBonus } from '~types'

export class PlusModifier {
  private options: number | undefined
  constructor(options: number | undefined) {
    this.options = options
  }

  apply(rolls: number[]): NumericRollBonus {
    if (!this.options) return { rolls, simpleMathModifier: 0 }
    return {
      rolls,
      simpleMathModifier: this.options
    }
  }

  toDescription(): string | undefined {
    if (!this.options) return undefined
    return `Add ${this.options}`
  }

  toNotation(): string | undefined {
    if (!this.options) return undefined
    return `+${this.options}`
  }
}
