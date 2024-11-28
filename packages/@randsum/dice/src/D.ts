import { coreRandom, type RollConfig } from '@randsum/core'

export class D {
  constructor(public sides: number) {
    this.sides = sides
  }

  toRollConfig(): RollConfig {
    return {
      sides: this.sides,
      quantity: 1
    }
  }

  roll(): number {
    return coreRandom(this.sides)
  }

  rollMany(quantity: number): number {
    return Array.from({ length: quantity }, () => this.roll()).reduce(
      (prev, curr) => prev + curr,
      0
    )
  }
}
