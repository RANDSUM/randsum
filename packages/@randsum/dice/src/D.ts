import type { RollConfig } from '@randsum/core'

export class D {
  constructor(public sides: number) {
    this.sides = sides
  }

  toRollConfig(): RollConfig {
    return {
      sides: this.sides,
      quantity: 1,
      modifiers: {}
    }
  }

  roll(): number {
    return Math.ceil(Math.random() * this.sides)
  }

  rollMultiple(quantity: number): number[] {
    return Array.from({ length: quantity }, () => this.roll())
  }
}
