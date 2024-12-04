import { RollConfig } from '~src/core/types'
import { coreRandom } from '~src/core/utils/coreRandom'

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

  rollMany(quantity: number): number[] {
    return Array.from({ length: quantity }, () => this.roll())
  }
}
